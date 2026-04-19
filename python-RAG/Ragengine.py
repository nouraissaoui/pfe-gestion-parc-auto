"""
Ragengine.py — Moteur RAG de ParcBot
LangChain + ChromaDB + Ollama (DeepSeek / nomic-embed-text)

Pipeline complet :
  question
    → embedding (nomic-embed-text via Ollama)
    → ChromaDB : 3 recherches séparées (ALL + rôle + user_id personnel)
    → fusion + dédoublonnage des chunks
    → prompt strict (contexte + rôle + historique)
    → DeepSeek via Ollama  →  réponse finale

Stratégie anti-hallucination :
  1. temperature=0.1 (quasi-déterministe)
  2. Prompt système strict : "base-toi UNIQUEMENT sur le CONTEXTE"
  3. Fallback explicite si contexte vide
  4. 3 recherches séparées au lieu d'un filtre $or instable
  5. Dédoublonnage par clé de contenu (120 premiers caractères)
"""

import logging
from typing import Optional
import requests

from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────
OLLAMA_URL  = "http://localhost:11434"
LLM_MODEL   = "deepseek-r1:7b"       # Remplacer par votre modèle Ollama disponible
EMBED_MODEL = "nomic-embed-text"
CHROMA_DIR  = "./chroma_db"
COLLECTION  = "parcbot_docs"
TOP_K       = 6  # chunks par recherche (max 3×6=18 avant dédup)

# ─── Prompts système (un par rôle) ───────────────────────────────────────────
_SYS_CHEF = """Tu es ParcBot, assistant intelligent de gestion de parc automobile.
Tu réponds au Chef du Parc qui a accès à TOUTES les données de son parc.
Il peut consulter : véhicules, chauffeurs, missions, feuilles de route,
déclarations, entretiens, cartes carburant, garages, locaux.

RÈGLES STRICTES :
- Si la question porte sur les données du parc (véhicule, chauffeur, mission, etc.),
  réponds UNIQUEMENT à partir du CONTEXTE fourni ci-dessous.
- Si le contexte ne contient pas l'information demandée, réponds EXACTEMENT :
  "Je ne trouve pas cette information dans la base de données du parc."
- Si la question est générale (définition, conseil, explication), réponds librement.
- Ne révèle jamais les données d'un autre parc ou d'un autre utilisateur.
- Réponds toujours en français, de façon professionnelle et concise."""

_SYS_CHAUFFEUR = """Tu es ParcBot, assistant intelligent de gestion de parc automobile.
Tu réponds au Chauffeur qui ne peut consulter QUE ses propres informations personnelles.
Il peut voir : ses missions, sa feuille de route, son véhicule assigné,
ses déclarations, et les informations générales du parc (locaux, véhicules).

RÈGLES STRICTES :
- Si la question porte sur ses données personnelles (missions, déclarations, véhicule),
  réponds UNIQUEMENT à partir du CONTEXTE fourni ci-dessous.
- Si le contexte ne contient pas l'information demandée, réponds EXACTEMENT :
  "Je ne trouve pas cette information dans vos données."
- Ne révèle JAMAIS les données d'autres chauffeurs.
- Si la question est générale (définition, conseil, explication), réponds librement.
- Réponds toujours en français, de façon simple et claire."""

SYSTEM_PROMPTS = {
    "CHEF_DU_PARC": _SYS_CHEF,
    "CHAUFFEUR": _SYS_CHAUFFEUR,
}

# ─── Template de prompt utilisateur ──────────────────────────────────────────
USER_PROMPT_TEMPLATE = """
=== CONTEXTE (données de la base du parc) ===
{context}
==============================================

=== HISTORIQUE DE CONVERSATION ===
{history}
==================================

QUESTION : {question}

Réponds maintenant en respectant strictement tes instructions.
"""


class ParcBotRAG:
    """
    Moteur RAG principal de ParcBot.
    Instancier une seule fois au démarrage de l'application (singleton).
    """

    def __init__(self):
        logger.info("[RAG] Initialisation des embeddings (nomic-embed-text)...")
        self.embeddings = OllamaEmbeddings(
            base_url=OLLAMA_URL,
            model=EMBED_MODEL,
        )
        self.vectorstore: Optional[Chroma] = None
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=80,
            separators=["\n\n", "\n", ".", " "],
        )
        logger.info("[RAG] ParcBotRAG initialisé")

    # ── INDEXATION ────────────────────────────────────────────────────────────
    def index_documents(self, docs: list[Document], reset: bool = False) -> None:
        """
        Découpe les documents en chunks et les indexe dans ChromaDB.
        Si reset=True, supprime la collection existante avant de réindexer.
        """
        if not docs:
            logger.warning("[RAG] Aucun document à indexer")
            return

        chunks = self.splitter.split_documents(docs)
        logger.info(f"[RAG] Indexation : {len(docs)} docs → {len(chunks)} chunks")

        if reset and self.vectorstore:
            try:
                self.vectorstore.delete_collection()
                logger.info("[RAG] Ancienne collection supprimée")
            except Exception as e:
                logger.warning(f"[RAG] Impossible de supprimer la collection : {e}")

        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=CHROMA_DIR,
            collection_name=COLLECTION,
        )
        self.vectorstore.persist()
        logger.info(f"[RAG] ChromaDB persisté — {len(chunks)} chunks indexés")

    # ── RECHERCHE VECTORIELLE (3 appels séparés, anti-bug $or) ────────────────
    def retrieve(
        self,
        question: str,
        role: str,
        user_id: int,
        k: int = TOP_K,
    ) -> list[Document]:
        """
        Effectue 3 recherches séparées pour éviter le bug du filtre $or ChromaDB :

        1. Documents publics    : accessible_by = "ALL"
        2. Documents du rôle    : accessible_by = "CHEF_DU_PARC" ou "CHAUFFEUR"
        3. Documents personnels : accessible_by = str(user_id)

        Résultats fusionnés et dédoublonnés par contenu (120 premiers chars).
        """
        if not self.vectorstore:
            logger.warning("[RAG] vectorstore non initialisé — retrieve ignoré")
            return []

        results: list[Document] = []
        seen: set[str] = set()

        def _search(filter_expr: dict) -> None:
            try:
                docs = self.vectorstore.similarity_search(
                    query=question,
                    k=k,
                    filter=filter_expr,
                )
                for doc in docs:
                    key = doc.page_content[:120].strip()
                    if key not in seen:
                        seen.add(key)
                        results.append(doc)
            except Exception as e:
                logger.warning(f"[RAG] Recherche filtrée échouée {filter_expr}: {e}")

        # Recherche 1 : documents publics (véhicules, locaux — visibles par tous)
        _search({"accessible_by": {"$eq": "ALL"}})

        # Recherche 2 : documents réservés au rôle (chef voit les chauffeurs, missions, etc.)
        _search({"accessible_by": {"$eq": role}})

        # Recherche 3 : documents personnels du chauffeur (ses missions, déclarations)
        _search({"accessible_by": {"$eq": str(user_id)}})

        logger.info(
            f"[RAG] Retrieve → {len(results)} chunks "
            f"pour '{question[:50]}' (rôle={role}, uid={user_id})"
        )
        # Limiter à 2×k pour ne pas surcharger le contexte LLM
        return results[: k * 2]

    # ── APPEL LLM VIA OLLAMA ──────────────────────────────────────────────────
    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """
        Appelle le LLM Ollama avec un prompt système et un prompt utilisateur séparés.
        Utilise /api/chat (format messages) plutôt que /api/generate
        pour un meilleur respect du system prompt.
        """
        payload = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            "stream": False,
            "options": {
                "temperature": 0.1,   # Quasi-déterministe → anti-hallucination
                "num_predict": 1024,
                "top_p": 0.9,
            },
        }
        try:
            resp = requests.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
                timeout=120,
            )
            resp.raise_for_status()
            data = resp.json()
            # Format réponse /api/chat
            return data.get("message", {}).get("content", "").strip()
        except requests.exceptions.Timeout:
            logger.error("[RAG] Timeout LLM (>120s)")
            return "Désolé, le délai de réponse a été dépassé. Veuillez réessayer."
        except Exception as e:
            logger.error(f"[RAG] Erreur LLM : {e}")
            return "Désolé, une erreur est survenue lors de la génération de la réponse."

    # ── PIPELINE RAG COMPLET ──────────────────────────────────────────────────
    def answer(
        self,
        question: str,
        user_id: int,
        role: str,
        history: list[dict],
    ) -> dict:
        """
        Pipeline RAG complet :
          1. Retrieve  → chunks pertinents depuis ChromaDB (3 recherches)
          2. Context   → assemblage du contexte textuel
          3. History   → formatage des 6 derniers échanges
          4. Prompt    → construction du prompt final
          5. LLM       → appel Ollama DeepSeek
          6. Return    → {answer, sources, context_used}
        """

        # ── Étape 1 : Récupération ────────────────────────────────────────────
        relevant_docs = self.retrieve(question, role, user_id)
        context_used  = len(relevant_docs) > 0

        # ── Étape 2 : Construction du contexte ───────────────────────────────
        sources: list[str] = []
        context_parts: list[str] = []

        for doc in relevant_docs:
            context_parts.append(doc.page_content)
            src = doc.metadata.get("source", "")
            if src and src not in sources:
                sources.append(src)

        if context_parts:
            context = "\n---\n".join(context_parts)
        else:
            context = "Aucune donnée spécifique trouvée dans la base du parc."

        # ── Étape 3 : Historique (6 derniers échanges = 12 messages max) ─────
        history_lines: list[str] = []
        for msg in history[-12:]:
            label = "Utilisateur" if msg.get("role") == "user" else "ParcBot"
            history_lines.append(f"{label} : {msg.get('content', '')}")
        history_text = "\n".join(history_lines) if history_lines else "Pas d'historique."

        # ── Étape 4 : Construction du prompt ─────────────────────────────────
        system_prompt = SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS["CHAUFFEUR"])
        user_prompt = USER_PROMPT_TEMPLATE.format(
            context=context,
            history=history_text,
            question=question,
        )

        # ── Étape 5 : Appel LLM ──────────────────────────────────────────────
        answer_text = self._call_llm(system_prompt, user_prompt)

        # ── Étape 6 : Retour ─────────────────────────────────────────────────
        return {
            "answer":       answer_text,
            "sources":      sources,
            "context_used": context_used,
        }