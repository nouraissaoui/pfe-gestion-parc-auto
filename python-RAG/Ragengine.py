"""
Moteur RAG principal de ParcBot.

Pipeline :
  question  →  embedding (nomic-embed-text via Ollama)
            →  ChromaDB : 3 recherches séparées (ALL + rôle + user_id)
            →  fusion + dédoublonnage des chunks
            →  prompt augmenté (contexte + rôle + historique)
            →  DeepSeek LLM (Ollama)  →  réponse

Correction clé : le filtre $or de ChromaDB est instable selon les versions.
On remplace par 3 appels similarity_search indépendants + fusion manuelle.
"""

import logging
from typing import Optional
import requests

from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

OLLAMA_URL   = "http://localhost:11434"
LLM_MODEL    = "deepseek-v3.1:671b-cloud"
EMBED_MODEL  = "nomic-embed-text"
CHROMA_DIR   = "./chroma_db"
COLLECTION   = "parcbot_docs"
TOP_K        = 6   # chunks par recherche (3 recherches × 6 = 18 max avant dédoublonnage)


# ─── Prompts système par rôle ─────────────────────────────────────────────────
SYSTEM_PROMPTS = {
    "CHEF_DU_PARC": """Tu es ParcBot, assistant intelligent spécialisé dans la gestion de parc automobile.
Tu réponds au Chef du Parc qui a accès à toutes les informations de son parc.
Il peut consulter : véhicules, chauffeurs, missions, feuilles de route, déclarations,
entretiens, cartes carburant, garages, locaux.
Réponds en français, de façon professionnelle et précise.
Si une question ne concerne pas le parc automobile, réponds normalement comme un assistant général.
Utilise le CONTEXTE fourni pour répondre aux questions spécifiques.
Ne révèle jamais les données d'un autre parc ou d'un autre utilisateur.""",

    "CHAUFFEUR": """Tu es ParcBot, assistant intelligent spécialisé dans la gestion de parc automobile.
Tu réponds au Chauffeur qui peut uniquement consulter ses propres informations.
Il peut consulter : ses missions du jour/semaine, sa feuille de route, son véhicule assigné,
ses déclarations, et les informations générales du parc.
Réponds en français, de façon simple et claire.
Si une question ne concerne pas le parc automobile, réponds normalement comme un assistant général.
Utilise le CONTEXTE fourni pour répondre aux questions personnelles.
Ne révèle JAMAIS les informations des autres chauffeurs.""",
}

GENERAL_INSTRUCTION = """
CONTEXTE RÉCUPÉRÉ (base de données) :
{context}

HISTORIQUE DE CONVERSATION :
{history}

QUESTION : {question}

INSTRUCTIONS :
- Si le contexte contient des informations pertinentes, base ta réponse dessus.
- Si le contexte est vide ou non pertinent, réponds comme un assistant général compétent.
- Réponds toujours en français.
- Sois concis mais complet.
- Ne dis jamais "je ne dispose pas de la liste" si le contexte contient des données.
"""


class ParcBotRAG:

    def __init__(self):
        self.embeddings = OllamaEmbeddings(
            base_url=OLLAMA_URL,
            model=EMBED_MODEL,
        )
        self.vectorstore: Optional[Chroma] = None
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,       # réduit (était 800) pour des chunks plus précis
            chunk_overlap=80,
            separators=["\n\n", "\n", ".", " "],
        )

    # ── Indexation ──────────────────────────────────────────────────────────
    def index_documents(self, docs: list[Document], reset: bool = False) -> None:
        if not docs:
            logger.warning("Aucun document à indexer")
            return

        chunks = self.splitter.split_documents(docs)
        logger.info(f"Indexation : {len(docs)} docs → {len(chunks)} chunks")

        if reset and self.vectorstore:
            self.vectorstore.delete_collection()

        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=CHROMA_DIR,
            collection_name=COLLECTION,
        )
        self.vectorstore.persist()
        logger.info("ChromaDB persisté")

    # ── Recherche vectorielle corrigée ───────────────────────────────────────
    def retrieve(
        self,
        question: str,
        role: str,
        user_id: int,
        k: int = TOP_K,
    ) -> list[Document]:
        """
        3 recherches séparées pour contourner le bug du filtre $or de ChromaDB.

        Recherche 1 : documents publics (accessible_by = "ALL")
        Recherche 2 : documents du rôle (accessible_by = "CHEF_DU_PARC")
        Recherche 3 : documents personnels (accessible_by = str(user_id))

        Les résultats sont fusionnés et dédoublonnés par contenu.
        """
        if not self.vectorstore:
            logger.warning("vectorstore non initialisé")
            return []

        results: list[Document] = []
        seen: set[str] = set()

        def _search_with_filter(filter_expr: dict) -> None:
            try:
                docs = self.vectorstore.similarity_search(
                    query=question,
                    k=k,
                    filter=filter_expr,
                )
                for doc in docs:
                    # Clé de dédoublonnage : 120 premiers caractères du contenu
                    key = doc.page_content[:120].strip()
                    if key not in seen:
                        seen.add(key)
                        results.append(doc)
            except Exception as e:
                logger.warning(f"Recherche filtrée échouée {filter_expr}: {e}")

        # 1. Documents publics (véhicules, garages, locaux — visible par tous)
        _search_with_filter({"accessible_by": {"$eq": "ALL"}})

        # 2. Documents réservés au rôle (CHEF_DU_PARC voit tout le parc)
        _search_with_filter({"accessible_by": {"$eq": role}})

        # 3. Documents personnels (le chauffeur ne voit que les siens)
        _search_with_filter({"accessible_by": {"$eq": str(user_id)}})

        logger.info(f"Retrieve → {len(results)} chunks pour '{question[:60]}' (rôle={role}, uid={user_id})")
        return results[:k * 2]  # garder au max 2×k chunks fusionnés

    # ── Génération LLM via Ollama ────────────────────────────────────────────
    def _call_llm(self, prompt: str) -> str:
        payload = {
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 1024,
            },
        }
        try:
            resp = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json=payload,
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
        except Exception as e:
            logger.error(f"Erreur LLM : {e}")
            return "Désolé, une erreur est survenue lors de la génération de la réponse."

    # ── Pipeline RAG complet ─────────────────────────────────────────────────
    def answer(
        self,
        question: str,
        user_id: int,
        role: str,
        history: list[dict],
    ) -> dict:
        """
        Pipeline RAG complet :
        1. Récupérer les chunks pertinents (3 recherches fusionnées)
        2. Construire le contexte textuel
        3. Formater l'historique
        4. Construire le prompt final
        5. Appeler le LLM
        6. Retourner réponse + sources
        """
        # 1. Récupération
        relevant_docs = self.retrieve(question, role, user_id)
        context_used = len(relevant_docs) > 0

        # 2. Contexte textuel
        context_parts = []
        sources = []
        for doc in relevant_docs:
            context_parts.append(doc.page_content)
            src = doc.metadata.get("source", "")
            if src and src not in sources:
                sources.append(src)

        context = "\n---\n".join(context_parts) if context_parts else "Aucune donnée spécifique trouvée."

        # 3. Historique (6 derniers échanges)
        history_text = ""
        for msg in history[-6:]:
            role_label = "Utilisateur" if msg["role"] == "user" else "ParcBot"
            history_text += f"{role_label} : {msg['content']}\n"

        # 4. Prompt final
        system = SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS["CHAUFFEUR"])
        user_block = GENERAL_INSTRUCTION.format(
            context=context,
            history=history_text or "Pas d'historique.",
            question=question,
        )
        full_prompt = f"{system}\n\n{user_block}"

        # 5. Appel LLM
        answer_text = self._call_llm(full_prompt)

        return {
            "answer": answer_text,
            "sources": sources,
            "context_used": context_used,
        }