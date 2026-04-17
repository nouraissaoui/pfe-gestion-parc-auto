"""
ParcBot - Chatbot RAG pour Gestion de Parc Automobile
FastAPI + LangChain + ChromaDB + Ollama (DeepSeek)
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging

from Ragengine import ParcBotRAG
from BDloader import ParcDBLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ParcBot API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Singleton RAG engine ──────────────────────────────────────────────────────
rag_engine: Optional[ParcBotRAG] = None

VALID_ROLES = {"CHEF_DU_PARC", "CHAUFFEUR"}


@app.on_event("startup")
async def startup():
    global rag_engine
    logger.info("Initialisation ParcBot RAG...")
    rag_engine = ParcBotRAG()
    loader = ParcDBLoader()
    docs = loader.load_all_documents()
    rag_engine.index_documents(docs)
    logger.info(f"ParcBot prêt — {len(docs)} documents indexés dans ChromaDB")


# ── Schémas ───────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str
    user_id: int
    role: str           # "CHEF_DU_PARC" ou "CHAUFFEUR"
    history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []
    context_used: bool = False


# ── Endpoint principal ────────────────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if req.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Rôle invalide '{req.role}'. Valeurs acceptées : {VALID_ROLES}"
        )
    if not rag_engine:
        raise HTTPException(503, "RAG engine non initialisé")

    result = rag_engine.answer(
        question=req.question,
        user_id=req.user_id,
        role=req.role,
        history=req.history,
    )
    return result


# ── Endpoint de debug : voir les chunks récupérés AVANT le LLM ───────────────
@app.post("/debug-retrieve")
async def debug_retrieve(req: ChatRequest):
    """
    Outil de diagnostic : montre exactement quels chunks ChromaDB retourne
    pour une question donnée, avant d'appeler le LLM.

    Utilisation avec curl ou Postman :
      POST /debug-retrieve
      { "question": "Chauffeurs disponibles", "user_id": 1, "role": "CHEF_DU_PARC", "history": [] }
    """
    if not rag_engine:
        raise HTTPException(503, "RAG engine non initialisé")
    if req.role not in VALID_ROLES:
        raise HTTPException(400, f"Rôle invalide '{req.role}'")

    docs = rag_engine.retrieve(req.question, req.role, req.user_id, k=8)
    return {
        "question": req.question,
        "role": req.role,
        "user_id": req.user_id,
        "nb_chunks_recuperes": len(docs),
        "chunks": [
            {
                "rank": i + 1,
                "source": d.metadata.get("source", "—"),
                "entity": d.metadata.get("entity", "—"),
                "accessible_by": d.metadata.get("accessible_by", "—"),
                "apercu": d.page_content[:300],
            }
            for i, d in enumerate(docs)
        ],
    }


# ── Réindexation manuelle ─────────────────────────────────────────────────────
@app.post("/reindex")
async def reindex():
    """Recharger les données de la BD et réindexer ChromaDB."""
    if not rag_engine:
        raise HTTPException(503, "RAG engine non initialisé")
    loader = ParcDBLoader()
    docs = loader.load_all_documents()
    rag_engine.index_documents(docs, reset=True)
    return {"message": f"{len(docs)} documents réindexés avec succès"}


# ── Santé ─────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "engine_ready": rag_engine is not None}