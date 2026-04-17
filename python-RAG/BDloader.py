"""
ParcDBLoader — Version corrigée RAG (ANTI-HALLUCINATION)

Architecture :
Python → Spring Boot API → MySQL

Objectif :
- Séparer strictement les types de données
- Empêcher les mélanges (vehicle ≠ declaration)
- Permettre filtrage LangChain par doc_type
"""

import logging
import requests
from langchain.schema import Document
from datetime import date, datetime

logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8080/api/gestion-parc"


# =========================
# UTILITAIRES
# =========================

def _fmt(val):
    if val is None:
        return "non renseigné"
    if isinstance(val, (date, datetime)):
        return val.strftime("%d/%m/%Y")
    return str(val)


def _make_doc(text: str, meta: dict):
    return Document(page_content=text.strip(), metadata=meta)


def _get(endpoint: str):
    try:
        url = f"{BASE_URL}{endpoint}"
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"API error {endpoint}: {e}")
        return []


# =========================
# LOADER
# =========================
class ParcDBLoader:

    def __init__(self):
        pass


    # =========================
    # CHAUFFEURS
    # =========================
    def load_chauffeurs(self):
        rows = _get("/chauffeurs")
        docs = []

        for r in rows:
            cid = str(r.get("idChauffeur"))

            local = r.get("local") or {}
            local_name = local.get("nomLocal", "non affecté")

            text = (
                f"PROFILE CHAUFFEUR\n"
                f"Nom : {r.get('prenom')} {r.get('nom')}\n"
                f"Email : {_fmt(r.get('mail'))}\n"
                f"Région : {_fmt(r.get('region'))}\n"
                f"Local affecté : {local_name}\n"
                f"État : {_fmt(r.get('etatChauffeur'))}\n"
            )

            docs.append(_make_doc(text, {
                "doc_type": "chauffeur",
                "entity": "chauffeur",
                "user_id": cid,
                "accessible_by": "CHEF_DU_PARC",
                "source": "chauffeur_profile"
            }))

        return docs


    # =========================
    # VÉHICULES
    # =========================
    def load_vehicules(self):
        rows = _get("/vehicules")
        docs = []

        for r in rows:
            local = r.get("local") or {}

            text = (
                f"VEHICULE\n"
                f"Matricule : {r.get('matricule')}\n"
                f"Marque : {_fmt(r.get('marque'))}\n"
                f"Modèle : {_fmt(r.get('modele'))}\n"
                f"Année : {_fmt(r.get('annee'))}\n"
                f"Carburant : {_fmt(r.get('carburant'))}\n"
                f"ÉTAT ACTUEL : {_fmt(r.get('etat'))}\n"
                f"Local : {local.get('nomLocal', 'non affecté')}\n"
            )

            docs.append(_make_doc(text, {
                "doc_type": "vehicule",
                "entity": "vehicule",
                "accessible_by": "ALL",
                "source": "vehicule_status"
            }))

        return docs


    # =========================
    # DÉCLARATIONS
    # =========================
    def load_declarations(self):
        rows = _get("/declarations")
        docs = []

        for r in rows:
            vehicule = r.get("vehicule") or {}
            chauffeur = r.get("chauffeur") or {}

            text = (
                f"DÉCLARATION\n"
                f"Type : {_fmt(r.get('type'))}\n"
                f"Statut : {_fmt(r.get('status'))}\n"
                f"Chauffeur : {chauffeur.get('prenom','')} {chauffeur.get('nom','')}\n"
                f"Véhicule : {vehicule.get('matricule','')}\n"
                f"Description : {_fmt(r.get('description'))}\n"
                f"Date : {_fmt(r.get('dateCreation'))}\n"
            )

            docs.append(_make_doc(text, {
                "doc_type": "declaration",
                "entity": "declaration",
                "accessible_by": "CHEF_DU_PARC",
                "source": "declaration"
            }))

        return docs


    # =========================
    # MISSIONS
    # =========================
    def load_missions(self):
        chauffeurs = _get("/chauffeurs")
        docs = []

        for c in chauffeurs:
            cid = c.get("idChauffeur")

            missions = _get(f"/chauffeur/{cid}/missions")

            for m in missions:
                vehicule = m.get("vehicule") or {}

                text = (
                    f"MISSION\n"
                    f"ID : {m.get('idMission')}\n"
                    f"Départ : {_fmt(m.get('pointDepart'))}\n"
                    f"Destination : {_fmt(m.get('destination'))}\n"
                    f"Date mission : {_fmt(m.get('dateMission'))}\n"
                    f"Véhicule : {vehicule.get('matricule','non assigné')}\n"
                    f"Statut feuille : {_fmt(m.get('statutFeuilleDeRoute'))}\n"
                )

                docs.append(_make_doc(text, {
                    "doc_type": "mission",
                    "entity": "mission",
                    "user_id": str(cid),
                    "accessible_by": "CHEF_DU_PARC",
                    "source": "mission"
                }))

        return docs


    # =========================
    # LOCAUX
    # =========================
    def load_locaux(self):
        rows = _get("/locaux")
        docs = []

        for r in rows:
            text = (
                f"LOCAL\n"
                f"Nom : {r.get('nomLocal')}\n"
                f"Ville : {_fmt(r.get('ville'))}\n"
                f"Région : {_fmt(r.get('region'))}\n"
            )

            docs.append(_make_doc(text, {
                "doc_type": "local",
                "entity": "local",
                "accessible_by": "ALL",
                "source": "local"
            }))

        return docs


    # =========================
    # GLOBAL
    # =========================
    def load_all_documents(self):
        loaders = [
            self.load_chauffeurs,
            self.load_vehicules,
            self.load_declarations,
            self.load_missions,
            self.load_locaux,
        ]

        all_docs = []

        for fn in loaders:
            try:
                docs = fn()
                all_docs.extend(docs)
                logger.info(f"{fn.__name__} -> {len(docs)} docs")
            except Exception as e:
                logger.error(f"Erreur {fn.__name__}: {e}")

        return all_docs