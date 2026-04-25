"""
Ragengine.py — Moteur RAG de ParcBot
LangChain + ChromaDB + Ollama (DeepSeek / nomic-embed-text)
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
LLM_MODEL   = "llama3:latest"
EMBED_MODEL = "nomic-embed-text"
CHROMA_DIR  = "./chroma_db"
COLLECTION  = "parcbot_docs"
TOP_K       = 6
BATCH_SIZE  = 100   # ChromaDB max = 166, on prend 100 par sécurité

# ─── Prompts système ──────────────────────────────────────────────────────────
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
    "CHAUFFEUR":    _SYS_CHAUFFEUR,
}

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
    if not docs:
        logger.warning("[RAG] Aucun document à indexer")
        return

    chunks = self.splitter.split_documents(docs)
    logger.info(f"[RAG] Indexation : {len(docs)} docs → {len(chunks)} chunks")

    # ── Vérifier si ChromaDB existe déjà ─────────────────────────────────
    import os
    chroma_exists = os.path.exists(CHROMA_DIR) and os.listdir(CHROMA_DIR)

    if chroma_exists and not reset:
        # Charger la collection existante sans réindexer
        logger.info("[RAG] Collection ChromaDB existante détectée — chargement sans réindexation")
        self.vectorstore = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=self.embeddings,
            collection_name=COLLECTION,
        )
        logger.info("[RAG] ChromaDB chargé depuis le disque ✓")
        return

    # ── Sinon : indexation complète ───────────────────────────────────────
    if reset and self.vectorstore:
        try:
            self.vectorstore.delete_collection()
            logger.info("[RAG] Ancienne collection supprimée")
        except Exception as e:
            logger.warning(f"[RAG] Impossible de supprimer la collection : {e}")

    # Premier batch
    self.vectorstore = Chroma.from_documents(
        documents=chunks[:BATCH_SIZE],
        embedding=self.embeddings,
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION,
    )
    logger.info(f"[RAG] Batch 1 indexé : {min(BATCH_SIZE, len(chunks))}/{len(chunks)} chunks")

    # Batches suivants
    for i in range(BATCH_SIZE, len(chunks), BATCH_SIZE):
        batch = chunks[i: i + BATCH_SIZE]
        self.vectorstore.add_documents(batch)
        logger.info(f"[RAG] Batch indexé : {i + len(batch)}/{len(chunks)} chunks")

    self.vectorstore.persist()
    logger.info(f"[RAG] ChromaDB persisté — {len(chunks)} chunks indexés")

    # ── RECHERCHE VECTORIELLE ─────────────────────────────────────────────────
    def retrieve(
        self,
        question: str,
        role: str,
        user_id: int,
        k: int = TOP_K,
    ) -> list[Document]:
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

        # 1. Documents publics (véhicules, locaux)
        _search({"accessible_by": {"$eq": "ALL"}})
        # 2. Documents réservés au rôle
        _search({"accessible_by": {"$eq": role}})
        # 3. Documents personnels du chauffeur
        _search({"accessible_by": {"$eq": str(user_id)}})

        logger.info(
            f"[RAG] Retrieve → {len(results)} chunks "
            f"pour '{question[:50]}' (rôle={role}, uid={user_id})"
        )
        return results[: k * 2]

    # ── APPEL LLM ─────────────────────────────────────────────────────────────
    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            "stream": False,
            "options": {
                "temperature": 0.1,
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
        # Étape 1 : Récupération
        relevant_docs = self.retrieve(question, role, user_id)
        context_used  = len(relevant_docs) > 0

        # Étape 2 : Contexte
        sources: list[str] = []
        context_parts: list[str] = []
        for doc in relevant_docs:
            context_parts.append(doc.page_content)
            src = doc.metadata.get("source", "")
            if src and src not in sources:
                sources.append(src)

        context = "\n---\n".join(context_parts) if context_parts else \
            "Aucune donnée spécifique trouvée dans la base du parc."

        # Étape 3 : Historique (12 derniers messages)
        history_lines: list[str] = []
        for msg in history[-12:]:
            label = "Utilisateur" if msg.get("role") == "user" else "ParcBot"
            history_lines.append(f"{label} : {msg.get('content', '')}")
        history_text = "\n".join(history_lines) if history_lines else "Pas d'historique."

        # Étape 4 : Prompt
        system_prompt = SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS["CHAUFFEUR"])
        user_prompt = USER_PROMPT_TEMPLATE.format(
            context=context,
            history=history_text,
            question=question,
        )

        # Étape 5 : LLM
        answer_text = self._call_llm(system_prompt, user_prompt)

        # Étape 6 : Retour
        return {
            "answer":       answer_text,
            "sources":      sources,
            "context_used": context_used,
        }