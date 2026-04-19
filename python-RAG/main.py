"""
main.py — Serveur Flask ParcBot
Endpoints :
  POST /chat           → réponse RAG
  POST /reindex        → réindexation manuelle
  POST /debug-retrieve → voir les chunks avant LLM (diagnostic)
  GET  /health         → état du serveur
"""

import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from Ragengine import ParcBotRAG
from BDloader import ParcDBLoader

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ─── App Flask ────────────────────────────────────────────────────────────────
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

# ─── Rôles valides ───────────────────────────────────────────────────────────
VALID_ROLES = {"CHEF_DU_PARC", "CHAUFFEUR"}

# ─── Singleton RAG (initialisé au démarrage) ─────────────────────────────────
rag_engine: ParcBotRAG = None


def init_rag():
    """Initialise le moteur RAG et indexe la BD au démarrage."""
    global rag_engine
    logger.info("═══ Initialisation ParcBot RAG ═══")
    rag_engine = ParcBotRAG()

    loader = ParcDBLoader()
    docs = loader.load_all_documents()

    if docs:
        rag_engine.index_documents(docs)
        logger.info(f"═══ ParcBot prêt — {len(docs)} documents indexés ═══")
    else:
        logger.warning("═══ Aucun document chargé (API Spring Boot inaccessible ?) ═══")


# ─── Initialisation au démarrage ─────────────────────────────────────────────
with app.app_context():
    init_rag()


# ─── ENDPOINT : Chat principal ───────────────────────────────────────────────
@app.route("/chat", methods=["POST"])
def chat():
    """
    Body JSON attendu :
    {
        "question": "Combien de véhicules disponibles ?",
        "user_id": 42,
        "role": "CHEF_DU_PARC",
        "history": [{"role": "user", "content": "..."}, ...]
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Corps JSON manquant"}), 400

    question = (data.get("question") or "").strip()
    user_id  = data.get("user_id")
    role     = (data.get("role") or "").strip()
    history  = data.get("history") or []

    # Validation
    if not question:
        return jsonify({"error": "Le champ 'question' est requis"}), 400
    if role not in VALID_ROLES:
        return jsonify({
            "error": f"Rôle invalide '{role}'. Valeurs acceptées : {sorted(VALID_ROLES)}"
        }), 400
    if rag_engine is None:
        return jsonify({"error": "RAG engine non initialisé"}), 503

    try:
        result = rag_engine.answer(
            question=question,
            user_id=int(user_id) if user_id else 0,
            role=role,
            history=history,
        )
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"[/chat] Erreur inattendue : {e}", exc_info=True)
        return jsonify({"error": "Erreur interne du serveur"}), 500


# ─── ENDPOINT : Réindexation manuelle ────────────────────────────────────────
@app.route("/reindex", methods=["POST"])
def reindex():
    """Recharge les données de l'API Spring Boot et réindexe ChromaDB."""
    if rag_engine is None:
        return jsonify({"error": "RAG engine non initialisé"}), 503
    try:
        loader = ParcDBLoader()
        docs = loader.load_all_documents()
        rag_engine.index_documents(docs, reset=True)
        return jsonify({"message": f"{len(docs)} documents réindexés avec succès"}), 200
    except Exception as e:
        logger.error(f"[/reindex] Erreur : {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ─── ENDPOINT : Debug (voir les chunks avant LLM) ────────────────────────────
@app.route("/debug-retrieve", methods=["POST"])
def debug_retrieve():
    """
    Outil de diagnostic : montre exactement quels chunks ChromaDB retourne
    AVANT d'appeler le LLM. Utile pour tracer les hallucinations.

    Exemple curl :
      curl -X POST http://localhost:8000/debug-retrieve \\
        -H "Content-Type: application/json" \\
        -d '{"question":"chauffeurs disponibles","user_id":1,"role":"CHEF_DU_PARC","history":[]}'
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Corps JSON manquant"}), 400

    question = (data.get("question") or "").strip()
    user_id  = data.get("user_id", 0)
    role     = (data.get("role") or "CHEF_DU_PARC").strip()
    history  = data.get("history") or []

    if not question:
        return jsonify({"error": "Le champ 'question' est requis"}), 400
    if role not in VALID_ROLES:
        return jsonify({"error": f"Rôle invalide '{role}'"}), 400
    if rag_engine is None:
        return jsonify({"error": "RAG engine non initialisé"}), 503

    docs = rag_engine.retrieve(question, role, int(user_id), k=8)
    return jsonify({
        "question":             question,
        "role":                 role,
        "user_id":              user_id,
        "nb_chunks_recuperes":  len(docs),
        "chunks": [
            {
                "rank":         i + 1,
                "source":       d.metadata.get("source", "—"),
                "doc_type":     d.metadata.get("doc_type", "—"),
                "accessible_by":d.metadata.get("accessible_by", "—"),
                "apercu":       d.page_content[:300],
            }
            for i, d in enumerate(docs)
        ],
    }), 200


# ─── ENDPOINT : Santé ─────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return jsonify({
        "status":       "ok",
        "engine_ready": rag_engine is not None,
    }), 200


# ─── Lancement ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)