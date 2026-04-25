"""
BDloader.py — Chargement de la base de données parc automobile
Architecture : Python Flask → Spring Boot API → MySQL
"""

import logging
import requests
from langchain.schema import Document
from datetime import date, datetime

logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8080/api/gestion-parc"


def _fmt(val):
    if val is None:
        return "non renseigné"
    if isinstance(val, (date, datetime)):
        return val.strftime("%d/%m/%Y")
    return str(val)


def _make_doc(text: str, meta: dict) -> Document:
    return Document(page_content=text.strip(), metadata=meta)


def _get(endpoint: str) -> list:
    try:
        url = f"{BASE_URL}{endpoint}"
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"[BDloader] Erreur API {endpoint}: {e}")
        return []


class ParcDBLoader:

    def load_vehicules(self) -> list[Document]:
        rows = _get("/vehicules")
        docs = []
        for r in rows:
            local = r.get("local") or {}
            text = (
                f"VEHICULE\n"
                f"Matricule : {r.get('matricule', 'N/A')}\n"
                f"Marque : {_fmt(r.get('marque'))}\n"
                f"Modèle : {_fmt(r.get('modele'))}\n"
                f"Année : {_fmt(r.get('annee'))}\n"
                f"Carburant : {_fmt(r.get('carburant'))}\n"
                f"État actuel : {_fmt(r.get('etat'))}\n"
                f"Local affecté : {local.get('nomLocal', 'non affecté')}\n"
            )
            docs.append(_make_doc(text, {
                "doc_type": "vehicule",
                "entity": "vehicule",
                "accessible_by": "ALL",
                "source": "vehicule_status",
            }))
        logger.info(f"[BDloader] {len(docs)} véhicules chargés")
        return docs

    def load_chauffeurs(self) -> list[Document]:
        rows = _get("/chauffeurs")
        docs = []
        for r in rows:
            cid = str(r.get("idChauffeur", ""))
            local = r.get("local") or {}
            text = (
                f"CHAUFFEUR\n"
                f"Nom complet : {r.get('prenom', '')} {r.get('nom', '')}\n"
                f"Email : {_fmt(r.get('mail'))}\n"
                f"Région : {_fmt(r.get('region'))}\n"
                f"Local affecté : {local.get('nomLocal', 'non affecté')}\n"
                f"État : {_fmt(r.get('etatChauffeur'))}\n"
            )
            docs.append(_make_doc(text, {
                "doc_type": "chauffeur",
                "entity": "chauffeur",
                "user_id": cid,
                "accessible_by": "CHEF_DU_PARC",
                "source": "chauffeur_profile",
            }))
        logger.info(f"[BDloader] {len(docs)} chauffeurs chargés")
        return docs

    def load_declarations(self) -> list[Document]:
        locaux = _get("/local")
        docs = []
        total_declarations = 0
        for local in locaux:
            id_local = local.get("idLocal")
            if not id_local:
                continue
            rows = _get(f"/local/{id_local}/declarations-toutes")
            total_declarations += len(rows)
            for r in rows:
                vehicule  = r.get("vehicule")  or {}
                chauffeur = r.get("chauffeur") or {}
                cid = str(chauffeur.get("idChauffeur", ""))
                text = (
                    f"DÉCLARATION\n"
                    f"Type : {_fmt(r.get('type'))}\n"
                    f"Statut : {_fmt(r.get('status'))}\n"
                    f"Chauffeur : {chauffeur.get('prenom', '')} {chauffeur.get('nom', '')}\n"
                    f"Véhicule : {vehicule.get('matricule', 'N/A')}\n"
                    f"Description : {_fmt(r.get('description'))}\n"
                    f"Date création : {_fmt(r.get('dateCreation'))}\n"
                )
                # Version chef
                docs.append(_make_doc(text, {
                    "doc_type": "declaration",
                    "entity": "declaration",
                    "user_id": cid,
                    "accessible_by": "CHEF_DU_PARC",
                    "source": "declaration",
                }))
                # Version chauffeur concerné
                if cid:
                    docs.append(_make_doc(text, {
                        "doc_type": "declaration",
                        "entity": "declaration",
                        "user_id": cid,
                        "accessible_by": cid,
                        "source": "declaration",
                    }))
        logger.info(f"[BDloader] {total_declarations} déclarations chargées → {len(docs)} docs")
        return docs

    def load_missions(self) -> list[Document]:
        chauffeurs = _get("/chauffeurs")
        docs = []
        total_missions = 0
        for c in chauffeurs:
            cid = c.get("idChauffeur")
            if not cid:
                continue
            missions = _get(f"/chauffeur/{cid}/missions")
            total_missions += len(missions)
            for m in missions:
                vehicule = m.get("vehicule") or {}
                text = (
                    f"MISSION\n"
                    f"ID mission : {m.get('idMission', 'N/A')}\n"
                    f"Chauffeur : {c.get('prenom', '')} {c.get('nom', '')}\n"
                    f"Départ : {_fmt(m.get('pointDepart'))}\n"
                    f"Destination : {_fmt(m.get('destination'))}\n"
                    f"Date mission : {_fmt(m.get('dateMission'))}\n"
                    f"Véhicule : {vehicule.get('matricule', 'non assigné')}\n"
                    f"Statut feuille de route : {_fmt(m.get('statutFeuilleDeRoute'))}\n"
                )
                # Version chef
                docs.append(_make_doc(text, {
                    "doc_type": "mission",
                    "entity": "mission",
                    "user_id": str(cid),
                    "accessible_by": "CHEF_DU_PARC",
                    "source": "mission",
                }))
                # Version chauffeur
                docs.append(_make_doc(text, {
                    "doc_type": "mission",
                    "entity": "mission",
                    "user_id": str(cid),
                    "accessible_by": str(cid),
                    "source": "mission",
                }))
        logger.info(f"[BDloader] {total_missions} missions chargées → {len(docs)} docs")
        return docs

    def load_locaux(self) -> list[Document]:
        rows = _get("/local")          # ← corrigé : était "/locaux"
        docs = []
        for r in rows:
            text = (
                f"LOCAL\n"
                f"Nom : {r.get('nomLocal', 'N/A')}\n"
                f"Ville : {_fmt(r.get('ville'))}\n"
                f"Région : {_fmt(r.get('region'))}\n"
            )
            docs.append(_make_doc(text, {
                "doc_type": "local",
                "entity": "local",
                "accessible_by": "ALL",
                "source": "local",
            }))
        logger.info(f"[BDloader] {len(docs)} locaux chargés")
        return docs

    def load_all_documents(self) -> list[Document]:
        """Charge toutes les entités et retourne la liste complète de Documents."""
        loaders = [
            self.load_vehicules,
            self.load_chauffeurs,
            self.load_declarations,
            self.load_missions,
            self.load_locaux,
        ]
        all_docs = []
        for fn in loaders:
            try:
                docs = fn()
                all_docs.extend(docs)
            except Exception as e:
                logger.error(f"[BDloader] Erreur dans {fn.__name__}: {e}")

        logger.info(f"[BDloader] Total : {len(all_docs)} documents chargés")
        return all_docs