from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import mysql.connector
import json
import re
from datetime import date, datetime
import json
from datetime import date, time, datetime, timedelta



app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/generate"
LLM_MODEL  = "deepseek-v3.1:671b-cloud"

DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "database": "gestionparc",
    "user":     "root",
    "password": ""
}

# ─────────────────────────────────────────────
# MÉMOIRE DE CONVERSATION  (par session utilisateur)
# ─────────────────────────────────────────────
conversation_memory: dict[str, list[dict]] = {}

MAX_HISTORY = 12

def get_history(session_id: str) -> list[dict]:
    return conversation_memory.setdefault(session_id, [])

def push_history(session_id: str, role: str, content: str):
    history = get_history(session_id)
    history.append({"role": role, "content": content})
    if len(history) > MAX_HISTORY * 2:
        conversation_memory[session_id] = history[-(MAX_HISTORY * 2):]

# ─────────────────────────────────────────────
# HELPERS DB
# ─────────────────────────────────────────────
#t5alini na3mil db_query : exécute une requête SELECT et formate les dates en ISO.
# db_execute : exécute une requête modifiant les données et retourne le nombre de lignes affectées.
def db_query(sql: str, params: tuple = ()) -> list[dict]:
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        for row in rows:
            for k, v in row.items():
                if isinstance(v, (date, datetime)):
                    row[k] = v.isoformat()
        return rows
    except Exception as e:
        return [{"error": str(e)}]

def db_execute(sql: str, params: tuple = ()) -> dict:
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute(sql, params)
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        conn.close()
        return {"affected_rows": affected}
    except Exception as e:
        return {"error": str(e)}
    
def serialize_obj(obj):
    if isinstance(obj, (datetime, date, time)):
        return obj.isoformat()  # exemple: '2026-04-09T14:20:00'
    if isinstance(obj, timedelta):
        return str(obj)  # ou obj.total_seconds() pour un nombre
    raise TypeError(f"Type {type(obj)} non sérialisable")    

# ─────────────────────────────────────────────
# INTENTS  ── détection par regex + mots-clés
# ─────────────────────────────────────────────
#Détection des intentions
#Utilise expressions régulières pour détecter le type de question.
#Exemples d’intentions :
#CHAUFFEUR_MON_PROFIL → le chauffeur veut voir ses infos personnelles.
def detect_intent(msg: str) -> str:
    m = msg.lower().strip()

    # ── CHAUFFEUR ──
    if re.search(r"(mon chef|mon responsable|chef du parc)", m):
        return "CHAUFFEUR_MON_CHEF"
    if re.search(r"(mon profil|mes infos|mon local|mon site)", m):
        return "CHAUFFEUR_MON_PROFIL"
    if re.search(r"(mon v[ée]hicule|ma voiture|mon auto)", m):
        return "CHAUFFEUR_MON_VEHICULE"
    if re.search(r"(mes missions|missions d[' ]aujourd|missions du jour|mes missions terminées|feuille de route|carnet de route)", m):
        return "CHAUFFEUR_MES_MISSIONS"
    if re.search(r"(mes d[ée]clarations|[ée]tat de ma d[ée]claration|statut)", m):
        return "CHAUFFEUR_MES_DECLARATIONS"
    if re.search(r"(d[ée]clarer (une )?panne|signaler (une )?panne)", m):
        return "CHAUFFEUR_DECLARER_PANNE"
    if re.search(r"d[ée]clarer (un )?accident", m):
        return "CHAUFFEUR_DECLARER_ACCIDENT"
    if re.search(r"d[ée]clarer (une )?amende|contravention", m):
        return "CHAUFFEUR_DECLARER_AMENDE"
    if re.search(r"(terminer|compl[ée]ter|finir|cl[ôo]turer) (ma )?mission", m):
        return "CHAUFFEUR_COMPLETER_MISSION"
    if re.search(r"(mission\s*(#?\d+|id\s*\d+|[a-zA-Z]+))\s+(km|heure)", m):
        return "CHAUFFEUR_COMPLETER_MISSION_DATA"
    if re.search(r"^(km\s*(d[ée]part|arriv[ée]e)|heure\s*(d[ée]part|arriv[ée]e))", m):
        return "CHAUFFEUR_COMPLETER_MISSION_DATA_RAW"

    # ── CHEF DU PARC ──
    if re.search(r"(liste des v[ée]hicules|tous les v[ée]hicules|mes v[ée]hicules)", m):
        return "CHEF_LISTE_VEHICULES"
    if re.search(r"v[ée]hicules? (disponibles?)", m):
        return "CHEF_VEHICULES_DISPO"
    if re.search(r"v[ée]hicules? (en mission)", m):
        return "CHEF_VEHICULES_MISSION"
    if re.search(r"v[ée]hicules? (en entretien)", m):
        return "CHEF_VEHICULES_ENTRETIEN"
    if re.search(r"v[ée]hicules? (indisponibles?)", m):
        return "CHEF_VEHICULES_INDISPO"
    if re.search(r"(modifier|changer|mettre).*[ée]tat.*v[ée]hicule|v[ée]hicule.*[ée]tat", m):
        return "CHEF_MAJ_ETAT_VEHICULE"
    if re.search(r"(affecter|attribuer|assigner).*(v[ée]hicule|voiture).*(chauffeur)", m):
        return "CHEF_AFFECTER_VEHICULE"
    if re.search(r"(liste des chauffeurs|mes chauffeurs|mes conducteurs|tous les chauffeurs)", m):
        return "CHEF_LISTE_CHAUFFEURS"
    if re.search(r"(modifier|changer|mettre|passer).*[ée]tat.*chauffeur|chauffeur.*(disponible|mission|cong[ée])", m):
        return "CHEF_MAJ_ETAT_CHAUFFEUR"
    if re.search(r"(toutes les missions|missions (du jour|d[' ]aujourd|en cours))", m):
        return "CHEF_LISTE_MISSIONS"
    if re.search(r"(feuilles? de route|carnet de route)", m):
        return "CHEF_FEUILLES_ROUTE"
    if re.search(r"(toutes les d[ée]clarations|d[ée]clarations (en attente|traités?|rejet[ée]s?))", m):
        return "CHEF_LISTE_DECLARATIONS"
    if re.search(r"(traiter|valider|approuver) d[ée]claration", m):
        return "CHEF_TRAITER_DECLARATION"
    if re.search(r"(liste des entretiens|entretiens)", m):
        return "CHEF_LISTE_ENTRETIENS"
    if re.search(r"(liste des cartes|carte carburant|solde carte|solde carburant)", m):
        return "CHEF_LISTE_CARTES"
    if re.search(r"(recharger|alimenter|recharge).*(carte)", m):
        return "CHEF_RECHARGER_CARTE"

    return "GENERAL"

# ─────────────────────────────────────────────
# DATA FETCHERS  (noms de colonnes corrigés)
# ─────────────────────────────────────────────
#Fonctions de récupération de données

def fetch_chauffeur_profile(chauffeur_id: int) -> dict:
    """
    Correction : chef_parc.id_local → local.id_local  (et non l'inverse)
    Colonne PK du chef : id_chefparc
    """
    rows = db_query("""
        SELECT c.id_chauffeur, c.nom, c.prenom, c.mail, c.region,
               c.anciennete, c.etat_chauffeur, c.type_vehicule_permis,
               c.date_expiration_permis,
               l.nom_local, l.adresse, l.ville, l.region AS region_local,
               cp.nom        AS chef_nom,
               cp.prenom     AS chef_prenom,
               cp.mail       AS chef_mail
        FROM chauffeur c
        LEFT JOIN local l    ON c.id_local = l.id_local
        LEFT JOIN chef_parc cp ON cp.id_local = l.id_local
        WHERE c.id_chauffeur = %s
    """, (chauffeur_id,))
    return rows[0] if rows else {}


def fetch_chauffeur_vehicule(chauffeur_id: int) -> dict:
    """Inchangé — structure correcte."""
    rows = db_query("""
        SELECT v.id_vehicule, v.matricule, v.marque, v.modele,
               v.annee, v.carburant, v.etat
        FROM vehicule v
        JOIN chauffeur c ON c.id_vehicule = v.id_vehicule
        WHERE c.id_chauffeur = %s
    """, (chauffeur_id,))
    return rows[0] if rows else {}


def fetch_chauffeur_missions(chauffeur_id: int) -> list:
    """
    Correction : table 'missions' (et non 'mission'),
    FK id_chauffeur dans la table missions.
    """
    return db_query("""
        SELECT m.id_mission, m.date_mission, m.point_depart, m.destination,
               m.heure_depart_prevue, m.heure_depart_reelle, m.heure_arrivee_reelle,
               m.km_depart, m.km_arrivee, m.observations, m.description
        FROM missions m
        WHERE m.id_chauffeur = %s
        ORDER BY m.date_mission DESC
    """, (chauffeur_id,))


def fetch_chauffeur_declarations(chauffeur_id: int) -> list:
    """
    Correction : FK dans declaration est 'chauffeur_id' (et non 'id_chauffeur').
    """
    return db_query("""
        SELECT d.id_declaration, d.type, d.description, d.date_creation, d.status
        FROM declaration d
        WHERE d.chauffeur_id = %s
        ORDER BY d.date_creation DESC
    """, (chauffeur_id,))


def fetch_chef_vehicules(chef_id: int, filtre: str = None) -> list:
    """
    Correction : jointure via chef_parc.id_local = local.id_local,
    PK du chef : id_chefparc.
    """
    sql = """
        SELECT v.id_vehicule, v.matricule, v.marque, v.modele, v.etat,
               c.nom AS chauffeur_nom, c.prenom AS chauffeur_prenom
        FROM vehicule v
        JOIN local l      ON v.id_local = l.id_local
        JOIN chef_parc cp ON cp.id_local = l.id_local
        LEFT JOIN chauffeur c ON c.id_vehicule = v.id_vehicule
        WHERE cp.id_chefparc = %s
    """
    params = [chef_id]
    if filtre:
        sql += " AND v.etat = %s"
        params.append(filtre)
    sql += " ORDER BY v.matricule"
    return db_query(sql, tuple(params))


def fetch_chef_chauffeurs(chef_id: int) -> list:
    """
    Correction : jointure chef_parc.id_local = local.id_local,
    PK du chef : id_chefparc.
    """
    return db_query("""
        SELECT c.id_chauffeur, c.nom, c.prenom, c.mail, c.etat_chauffeur,
               v.matricule AS vehicule_matricule
        FROM chauffeur c
        JOIN local l      ON c.id_local    = l.id_local
        JOIN chef_parc cp ON cp.id_local   = l.id_local
        LEFT JOIN vehicule v ON c.id_vehicule = v.id_vehicule
        WHERE cp.id_chefparc = %s
        ORDER BY c.nom
    """, (chef_id,))


def fetch_chef_missions(chef_id: int) -> list:
    """
    Correction : table 'missions', jointure chef via id_local,
    PK du chef : id_chefparc.
    """
    return db_query("""
        SELECT m.id_mission, m.date_mission, m.point_depart, m.destination,
               c.nom  AS chauffeur_nom, c.prenom AS chauffeur_prenom,
               v.matricule,
               m.heure_depart_prevue, m.heure_arrivee_reelle
        FROM missions m
        JOIN chauffeur c  ON m.id_chauffeur = c.id_chauffeur
        JOIN vehicule  v  ON m.id_vehicule  = v.id_vehicule
        JOIN chef_parc cp ON cp.id_local    = m.id_local
        WHERE cp.id_chefparc = %s
        ORDER BY m.date_mission DESC
    """, (chef_id,))


def fetch_chef_feuilles(chef_id: int) -> list:
    """
    Correction : FK dans feuille_de_route est 'id_chefparc' (et non 'id_chef_parc').
    """
    return db_query("""
        SELECT f.id_feuille, f.date_generation, f.statut,
               c.nom  AS chauffeur_nom, c.prenom AS chauffeur_prenom,
               v.matricule
        FROM feuille_de_route f
        JOIN chauffeur c ON f.id_chauffeur = c.id_chauffeur
        JOIN vehicule  v ON f.id_vehicule  = v.id_vehicule
        WHERE f.id_chefparc = %s
        ORDER BY f.date_generation DESC
    """, (chef_id,))


def fetch_chef_declarations(chef_id: int, statut: str = None) -> list:
    """
    Correction :
    - FK chauffeur : 'chauffeur_id' (et non 'id_chauffeur')
    - FK véhicule  : 'vehicule_id'  (et non 'id_vehicule')
    - Jointure chef via local
    """
    sql = """
        SELECT d.id_declaration, d.type, d.description, d.date_creation, d.status,
               c.nom  AS chauffeur_nom, c.prenom AS chauffeur_prenom,
               v.matricule
        FROM declaration d
        JOIN chauffeur c  ON d.chauffeur_id  = c.id_chauffeur
        JOIN vehicule  v  ON d.vehicule_id   = v.id_vehicule
        JOIN local     l  ON c.id_local      = l.id_local
        JOIN chef_parc cp ON cp.id_local     = l.id_local
        WHERE cp.id_chefparc = %s
    """
    params = [chef_id]
    if statut:
        sql += " AND d.status = %s"
        params.append(statut)
    sql += " ORDER BY d.date_creation DESC"
    return db_query(sql, tuple(params))


def fetch_chef_entretiens(chef_id: int) -> list:
    """
    Correction : FK dans entretien est 'id_chefparc' (et non 'id_chef_du_parc').
    """
    return db_query("""
        SELECT e.id_entretien, e.type_entretien, e.date_prevue, e.date_effectuee,
               e.status, e.observations, e.categorie,
               v.matricule, g.nom_garage
        FROM entretien e
        JOIN vehicule v             ON e.id_vehicule = v.id_vehicule
        LEFT JOIN garage_maintenance g ON e.id_garage = g.id_garage
        WHERE e.id_chefparc = %s
        ORDER BY e.date_prevue DESC
    """, (chef_id,))


def fetch_chef_cartes(chef_id: int) -> list:
    """
    Correction : FK dans carte_carburant est 'id_chefparc' (et non via local).
    """
    return db_query("""
        SELECT cc.numero_carte, cc.montant_reel, cc.montant_charge,
               cc.date_chargement, v.matricule
        FROM carte_carburant cc
        JOIN vehicule v ON cc.id_vehicule = v.id_vehicule
        WHERE cc.id_chefparc = %s
    """, (chef_id,))


def fetch_vehicule_by_matricule(matricule: str) -> dict:
    rows = db_query("SELECT * FROM vehicule WHERE matricule = %s", (matricule,))
    return rows[0] if rows else {}


def fetch_chauffeur_by_name(nom: str, prenom: str) -> dict:
    rows = db_query(
        "SELECT * FROM chauffeur WHERE LOWER(nom) = %s AND LOWER(prenom) = %s",
        (nom.lower(), prenom.lower())
    )
    return rows[0] if rows else {}


def fetch_chauffeur_by_id(cid: int) -> dict:
    rows = db_query("SELECT * FROM chauffeur WHERE id_chauffeur = %s", (cid,))
    return rows[0] if rows else {}

# ─────────────────────────────────────────────
# PENDING STATE  (interactions multi-tours)
# ─────────────────────────────────────────────
#Gestion des états "pending" (multi-tour)
#Exemple :

#Le chauffeur veut compléter une mission → on demande les km, heure, observations → on attend la réponse avant de finir la mission.
pending_state: dict[str, dict] = {}

# ─────────────────────────────────────────────
# SMART HANDLERS
# ─────────────────────────────────────────────
def handle_chauffeur_completer_mission(msg: str, chauffeur_id: int, session_id: str) -> str | None:
    missions_ouvertes = [
        m for m in fetch_chauffeur_missions(chauffeur_id)
        if m.get("km_arrivee") is None and m.get("heure_arrivee_reelle") is None
    ]

    if not missions_ouvertes:
        return "✅ Vous n'avez aucune mission en cours à compléter."

    if len(missions_ouvertes) == 1:
        m = missions_ouvertes[0]
        pending_state[session_id] = {
            "action": "complete_mission",
            "mission_id": m["id_mission"]
        }
        return (
            f"📋 **Mission à compléter :**\n"
            f"• 🗓️ Date : {m['date_mission']}\n"
            f"• 🏁 Départ : {m['point_depart']} → **{m['destination']}**\n"
            f"• ⏰ Heure prévue : {m['heure_depart_prevue']}\n\n"
            f"Veuillez fournir les données de fin de mission :\n"
            f"`km depart 12500 km arrivee 12750 heure arrivee 14:30 [observations RAS]`"
        )
    else:
        lines = ["📋 **Plusieurs missions en cours — choisissez-en une :**\n"]
        for i, m in enumerate(missions_ouvertes, 1):
            lines.append(
                f"**{i}.** {m['point_depart']} → **{m['destination']}** "
                f"(date : {m['date_mission']}, ID : {m['id_mission']})"
            )
        lines.append(
            "\n✏️ Précisez la mission par numéro, destination, ou ID :\n"
            "`mission 1 km depart 12000 km arrivee 12300 heure arrivee 09:45`\n"
            "`mission Sfax km arrivee 12750 heure arrivee 14:30`\n"
            "`mission id 42 km arrivee 12750 heure arrivee 14:30`"
        )
        pending_state[session_id] = {
            "action": "complete_mission_select",
            "missions": missions_ouvertes
        }
        return "\n".join(lines)


def parse_mission_data(msg: str) -> dict:
    data = {}
    m = msg.lower()

    kd = re.search(r"km\s*d[ée]part\s+(\d+(?:\.\d+)?)", m)
    ka = re.search(r"km\s*arriv[ée]e\s+(\d+(?:\.\d+)?)", m)
    hd = re.search(r"heure\s*d[ée]part\s+(\d{1,2}:\d{2})", m)
    ha = re.search(r"heure\s*arriv[ée]e\s+(\d{1,2}:\d{2})", m)
    ob = re.search(r"observations?\s+(.+)", m)

    if kd: data["kmDepart"]           = float(kd.group(1))
    if ka: data["kmArrivee"]          = float(ka.group(1))
    if hd: data["heureDepartReelle"]  = hd.group(1) + ":00" if len(hd.group(1)) == 5 else hd.group(1)
    if ha: data["heureArriveeReelle"] = ha.group(1) + ":00" if len(ha.group(1)) == 5 else ha.group(1)
    if ob: data["observations"]       = ob.group(1).strip()
    return data


def complete_mission_via_api(mission_id: int, data: dict) -> str:
    if not data:
        return "❌ Aucune donnée valide trouvée. Format attendu : `km arrivee 12750 heure arrivee 14:30`"
    try:
        resp = requests.put(
            f"http://localhost:8080/api/gestion-parc/mission/{mission_id}/completer",
            json=data, timeout=10
        )
        if resp.status_code == 200:
            return (
                f"✅ **Mission #{mission_id} complétée avec succès !**\n"
                + ("\n".join(f"• {k} : {v}" for k, v in data.items()))
            )
        return f"❌ Erreur Spring Boot ({resp.status_code}) : {resp.text}"
    except Exception as e:
        return f"❌ Impossible de joindre le serveur : {e}"

#Si l’utilisateur est en train de compléter une mission ou traiter une déclaration, on continue le processus en plusieurs étapes.
def handle_pending(msg: str, session_id: str) -> str | None:
    state = pending_state.get(session_id)
    if not state:
        return None

    action = state.get("action")

    # ── Traiter déclaration (multi-tour) ──
    if action == "traiter_declaration_pending":
        dec_id = state["dec_id"]
        raw    = msg

        garage_match = re.search(r"garage\s*(?:id\s*:?\s*)?(\d+)", raw, re.IGNORECASE)
        type_match   = re.search(r"type\s+entretien\s*:?\s*(.+?)(?:\n|date|obs|$)", raw, re.IGNORECASE)
        date_match   = re.search(r"date\s+pr[eé]vue\s*:?\s*(\d{4}-\d{2}-\d{2})", raw, re.IGNORECASE)
        obs_match    = re.search(r"observations?\s*:?\s*(.+?)$", raw, re.IGNORECASE | re.MULTILINE)

        if not (garage_match and type_match and date_match):
            return (
                "❓ Il manque certaines informations. Merci de fournir :\n"
                "```\nGarage ID : <id>\nType entretien : <type>\nDate prévue : AAAA-MM-JJ\nObservations : <optionnel>\n```"
            )

        chef_id   = state["chef_id"]
        garage_id = int(garage_match.group(1))
        type_e    = type_match.group(1).strip()
        date_e    = date_match.group(1)
        obs_e     = obs_match.group(1).strip() if obs_match else ""

        try:
            resp = requests.post(
                f"http://localhost:8080/api/gestion-parc/declaration/{dec_id}/traiter",
                params={
                    "idChef":       chef_id,
                    "idGarage":     garage_id,
                    "typeEntretien": type_e,
                    "datePrevue":   date_e,
                    "obs":          obs_e
                }, timeout=10
            )
            del pending_state[session_id]
            if resp.status_code == 200:
                return (
                    f"✅ **Déclaration #{dec_id} traitée avec succès !**\n"
                    f"• Garage : {garage_id}  • Type : {type_e}  • Date : {date_e}\n"
                    f"• Observations : {obs_e or '—'}\n"
                    f"Un entretien a été créé automatiquement."
                )
            return f"❌ Erreur ({resp.status_code}) : {resp.text}"
        except Exception as e:
            return f"❌ Impossible de joindre le serveur : {e}"

    # ── Compléter mission ──
    if action == "complete_mission":
        data   = parse_mission_data(msg)
        result = complete_mission_via_api(state["mission_id"], data)
        del pending_state[session_id]
        return result

    if action == "complete_mission_select":
        missions = state["missions"]
        m = msg.lower()

        target_mission = None

        num_match  = re.match(r"mission\s+(\d+)\b", m)
        id_match   = re.search(r"mission\s+(?:id\s*#?\s*)?#?(\d+)", m)
        dest_match = re.match(r"mission\s+([a-zA-ZÀ-ÿ ]+?)(?:\s+km|\s+heure|$)", m)

        if id_match:
            mid = int(id_match.group(1))
            for ms in missions:
                if ms["id_mission"] == mid:
                    target_mission = ms
                    break
        elif num_match:
            idx = int(num_match.group(1)) - 1
            if 0 <= idx < len(missions):
                target_mission = missions[idx]
        elif dest_match:
            dest = dest_match.group(1).strip()
            for ms in missions:
                if dest.lower() in ms["destination"].lower():
                    target_mission = ms
                    break

        if not target_mission:
            if re.search(r"km\s*(d[ée]part|arriv[ée]e)", m):
                return (
                    "⚠️ Plusieurs missions en cours. Veuillez préciser quelle mission vous souhaitez compléter :\n"
                    "`mission 1 km arrivee ...`  ou  `mission Sfax km arrivee ...`  ou  `mission id 42 km arrivee ...`"
                )
            return "❓ Je n'ai pas trouvé la mission demandée. Réessayez en précisant le numéro, la destination ou l'ID."

        data   = parse_mission_data(msg)
        result = complete_mission_via_api(target_mission["id_mission"], data)
        del pending_state[session_id]
        return result

    return None

# ─────────────────────────────────────────────
# CONSTRUCTION DU CONTEXTE DONNÉES
# ─────────────────────────────────────────────
def build_data_context(intent: str, msg: str, user_role: str, user_id: int) -> str:
    ctx = ""
    m   = msg.lower()

    # ── CHAUFFEUR ──
    if intent in ("CHAUFFEUR_MON_CHEF", "CHAUFFEUR_MON_PROFIL"):
        p = fetch_chauffeur_profile(user_id)
        if p:
            ctx = f"""
DONNÉES PROFIL CHAUFFEUR :
- Nom           : {p.get('prenom')} {p.get('nom')}
- Email         : {p.get('mail')}
- Région        : {p.get('region')}
- Ancienneté    : {p.get('anciennete')} ans
- État          : {p.get('etat_chauffeur')}
- Permis        : {p.get('type_vehicule_permis')} (expire : {p.get('date_expiration_permis')})
- Local         : {p.get('nom_local')} — {p.get('adresse')}, {p.get('ville')}
- Chef du Parc  : {p.get('chef_prenom')} {p.get('chef_nom')} ({p.get('chef_mail')})
"""

    elif intent == "CHAUFFEUR_MON_VEHICULE":
        v   = fetch_chauffeur_vehicule(user_id)
        ctx = (
            f"VÉHICULE AFFECTÉ AU CHAUFFEUR : {json.dumps(v, ensure_ascii=False)}"
            if v else "VÉHICULE : Aucun véhicule affecté."
        )

    elif intent == "CHAUFFEUR_MES_MISSIONS":
        missions = fetch_chauffeur_missions(user_id)
        today    = date.today().isoformat()
        if "aujourd" in m or "du jour" in m:
            missions = [x for x in missions if str(x.get("date_mission", "")).startswith(today)]
            ctx = f"MISSIONS DU JOUR ({today}) : {json.dumps(missions, ensure_ascii=False)}"
        elif "terminée" in m:
            missions = [x for x in missions if x.get("heure_arrivee_reelle") is not None]
            ctx = f"MISSIONS TERMINÉES : {json.dumps(missions, ensure_ascii=False)}"
        elif "feuille" in m or "carnet" in m:
            feuilles = db_query(
                "SELECT * FROM feuille_de_route WHERE id_chauffeur = %s ORDER BY date_generation DESC",
                (user_id,)
            )
            ctx = f"FEUILLES DE ROUTE : {json.dumps(feuilles, ensure_ascii=False)}"
        else:
            ctx = f"TOUTES MES MISSIONS : {json.dumps(missions, ensure_ascii=False, default=serialize_obj)}"

    elif intent == "CHAUFFEUR_MES_DECLARATIONS":
        decls = fetch_chauffeur_declarations(user_id)
        ctx   = f"MES DÉCLARATIONS : {json.dumps(decls, ensure_ascii=False)}"

    # ── CHEF ──
    elif intent == "CHEF_LISTE_VEHICULES":
        vehicules = fetch_chef_vehicules(user_id)
        ctx = f"TOUS LES VÉHICULES DU LOCAL : {json.dumps(vehicules, ensure_ascii=False)}"

    elif intent == "CHEF_VEHICULES_DISPO":
        v   = fetch_chef_vehicules(user_id, "DISPONIBLE")
        ctx = f"VÉHICULES DISPONIBLES : {json.dumps(v, ensure_ascii=False)}"

    elif intent == "CHEF_VEHICULES_MISSION":
        v   = fetch_chef_vehicules(user_id, "EN_MISSION")
        ctx = f"VÉHICULES EN MISSION : {json.dumps(v, ensure_ascii=False)}"

    elif intent == "CHEF_VEHICULES_ENTRETIEN":
        v   = fetch_chef_vehicules(user_id, "EN_ENTRETIEN")
        ctx = f"VÉHICULES EN ENTRETIEN : {json.dumps(v, ensure_ascii=False)}"

    elif intent == "CHEF_VEHICULES_INDISPO":
        v   = fetch_chef_vehicules(user_id, "INDISPONIBLE")
        ctx = f"VÉHICULES INDISPONIBLES : {json.dumps(v, ensure_ascii=False)}"

    elif intent == "CHEF_LISTE_CHAUFFEURS":
        ch  = fetch_chef_chauffeurs(user_id)
        ctx = f"CHAUFFEURS DU LOCAL : {json.dumps(ch, ensure_ascii=False)}"

    elif intent == "CHEF_LISTE_MISSIONS":
        missions = fetch_chef_missions(user_id)
        today    = date.today().isoformat()
        if "aujourd" in m or "du jour" in m:
            missions = [x for x in missions if str(x.get("date_mission", "")).startswith(today)]
            ctx = f"MISSIONS DU JOUR ({today}) : {json.dumps(missions, ensure_ascii=False)}"
        else:
            ctx = f"TOUTES LES MISSIONS : {json.dumps(missions, ensure_ascii=False)}"

    elif intent == "CHEF_FEUILLES_ROUTE":
        feuilles = fetch_chef_feuilles(user_id)
        ctx = f"FEUILLES DE ROUTE : {json.dumps(feuilles, ensure_ascii=False)}"

    elif intent == "CHEF_LISTE_DECLARATIONS":
        statut = None
        if "en attente" in m:  statut = "EN_ATTENTE"
        elif "traité"   in m:  statut = "TRAITE"
        elif "rejeté"   in m:  statut = "REJETE"
        decls = fetch_chef_declarations(user_id, statut)
        ctx   = f"DÉCLARATIONS : {json.dumps(decls, ensure_ascii=False)}"

    elif intent == "CHEF_LISTE_ENTRETIENS":
        ent = fetch_chef_entretiens(user_id)
        ctx = f"ENTRETIENS : {json.dumps(ent, ensure_ascii=False)}"

    elif intent == "CHEF_LISTE_CARTES":
        cartes = fetch_chef_cartes(user_id)
        ctx    = f"CARTES CARBURANT : {json.dumps(cartes, ensure_ascii=False)}"

    return ctx.strip()

# ─────────────────────────────────────────────
# ACTIONS DIRECTES  (sans passer par le LLM)
# ─────────────────────────────────────────────
def try_direct_action(intent: str, msg: str, user_role: str, user_id: int, session_id: str) -> str | None:
    m = msg.lower()

    # ── DÉCLARER PANNE / ACCIDENT / AMENDE (CHAUFFEUR) ──
    if intent in ("CHAUFFEUR_DECLARER_PANNE", "CHAUFFEUR_DECLARER_ACCIDENT", "CHAUFFEUR_DECLARER_AMENDE"):
        type_map = {
            "CHAUFFEUR_DECLARER_PANNE":    "PANNE",
            "CHAUFFEUR_DECLARER_ACCIDENT": "ACCIDENT",
            "CHAUFFEUR_DECLARER_AMENDE":   "AMENDE"
        }
        dec_type    = type_map[intent]
        desc_match  = re.search(r"(?:panne|accident|amende|contravention)\s*:?\s*(.+)", msg, re.IGNORECASE)
        if not desc_match or len(desc_match.group(1).strip()) < 5:
            return (
                f"⚠️ Pour déclarer une **{dec_type.lower()}**, merci de fournir une description.\n"
                f"Format : `Déclarer une {dec_type.lower()} : <description précise>`\n"
                f"Exemple : `Déclarer une panne : le moteur surchauffe depuis ce matin`"
            )
        description = desc_match.group(1).strip()
        try:
            resp = requests.post(
                "http://localhost:8080/api/gestion-parc/declaration/creer",
                json={"idChauffeur": user_id, "type": dec_type, "description": description},
                timeout=10
            )
            if resp.status_code == 200:
                return (
                    f"✅ **Déclaration de {dec_type.lower()} enregistrée avec succès !**\n"
                    f"📝 Description : {description}\n"
                    f"📊 Statut : EN_ATTENTE — votre chef de parc va la traiter prochainement."
                )
            return f"❌ Erreur ({resp.status_code}) : {resp.text}"
        except Exception as e:
            return f"❌ Impossible de joindre le serveur : {e}"

    # ── COMPLÉTER MISSION (CHAUFFEUR) ──
    if intent == "CHAUFFEUR_COMPLETER_MISSION":
        return handle_chauffeur_completer_mission(msg, user_id, session_id)

    if intent in ("CHAUFFEUR_COMPLETER_MISSION_DATA", "CHAUFFEUR_COMPLETER_MISSION_DATA_RAW"):
        state = pending_state.get(session_id)
        if not state:
            return "⚠️ Veuillez d'abord taper **'Terminer ma mission'** pour que je trouve vos missions en cours."
        return None  # laissé à handle_pending

    # ── MODIFIER ÉTAT VÉHICULE (CHEF) ──
    if intent == "CHEF_MAJ_ETAT_VEHICULE" and user_role == "CHEF_PARC":
        mat_match = re.search(r"([A-Z]{2}-\d{3}-[A-Z]{2}|\d{1,3}\s*t[a-z]*\s*\d{4,})", msg, re.IGNORECASE)
        id_match  = re.search(r"(?:v[ée]hicule|id)\s+(?:id\s+)?(\d+)", msg, re.IGNORECASE)
        etat_map  = {
            "disponible":  "DISPONIBLE",
            "en mission":  "EN_MISSION",
            "entretien":   "EN_ENTRETIEN",
            "indisponible":"INDISPONIBLE"
        }
        etat = next((v for k, v in etat_map.items() if k in m), None)
        if not etat:
            return "❓ État non reconnu. Valeurs acceptées : disponible, en mission, entretien, indisponible."

        vehicule_id = None
        if id_match:
            vehicule_id = int(id_match.group(1))
        elif mat_match:
            v = fetch_vehicule_by_matricule(mat_match.group(1).upper())
            vehicule_id = v.get("id_vehicule")

        if not vehicule_id:
            return "❓ Véhicule non identifié. Précisez le matricule (ex: TU-123-AB) ou l'ID."

        try:
            resp = requests.put(
                f"http://localhost:8080/api/gestion-parc/vehicule/{vehicule_id}/etat",
                params={"etat": etat}, timeout=10
            )
            if resp.status_code == 200:
                return f"✅ État du véhicule **{vehicule_id}** mis à jour → **{etat}**"
            return f"❌ Erreur ({resp.status_code}) : {resp.text}"
        except Exception as e:
            return f"❌ Serveur inaccessible : {e}"

    # ── AFFECTER VÉHICULE À CHAUFFEUR (CHEF) ──
    if intent == "CHEF_AFFECTER_VEHICULE" and user_role == "CHEF_PARC":
        mat_match    = re.search(r"([A-Z]{2}-\d{3}-[A-Z]{2})", msg, re.IGNORECASE)
        ch_id_match  = re.search(r"chauffeur\s+(?:id\s+)?(\d+)", msg, re.IGNORECASE)
        ch_name_match= re.search(r"chauffeur\s+([A-ZÀ-ÿa-z]+)\s+([A-ZÀ-ÿa-z]+)", msg, re.IGNORECASE)

        vehicule_id  = None
        chauffeur_id = None

        if mat_match:
            v = fetch_vehicule_by_matricule(mat_match.group(1).upper())
            vehicule_id = v.get("id_vehicule")

        if ch_id_match:
            chauffeur_id = int(ch_id_match.group(1))
        elif ch_name_match:
            c = fetch_chauffeur_by_name(ch_name_match.group(1), ch_name_match.group(2))
            chauffeur_id = c.get("id_chauffeur")

        if not vehicule_id or not chauffeur_id:
            return "❓ Impossible d'identifier le véhicule ou le chauffeur. Ex : `Affecter véhicule TU-123-AB chauffeur Ahmed Ben Ali`"

        try:
            resp = requests.put(
                f"http://localhost:8080/api/gestion-parc/affecter/{chauffeur_id}/{vehicule_id}",
                timeout=10
            )
            if resp.status_code == 200:
                return f"✅ Véhicule **{mat_match.group(1).upper()}** affecté au chauffeur **ID {chauffeur_id}** avec succès !"
            return f"❌ Erreur ({resp.status_code}) : {resp.text}"
        except Exception as e:
            return f"❌ Serveur inaccessible : {e}"

    # ── MODIFIER ÉTAT CHAUFFEUR (CHEF) ──
    if intent == "CHEF_MAJ_ETAT_CHAUFFEUR" and user_role == "CHEF_PARC":
        etat_map = {
            "disponible": "DISPONIBLE",
            "en mission": "EN_MISSION",
            r"cong[ée]":  "EN_CONGE"
        }
        etat = None
        for pattern, val in etat_map.items():
            if re.search(pattern, m):
                etat = val
                break
        if not etat:
            return "❓ État non reconnu. Valeurs acceptées : disponible, en mission, congé."

        ch_id_match   = re.search(r"chauffeur\s+(?:id\s+)?(\d+)", msg, re.IGNORECASE)
        ch_name_match = re.search(r"chauffeur\s+([A-ZÀ-ÿa-z]+)\s+([A-ZÀ-ÿa-z]+)", msg, re.IGNORECASE)

        chauffeur_id = None
        if ch_id_match:
            chauffeur_id = int(ch_id_match.group(1))
        elif ch_name_match:
            c = fetch_chauffeur_by_name(ch_name_match.group(1), ch_name_match.group(2))
            chauffeur_id = c.get("id_chauffeur")

        if not chauffeur_id:
            return "❓ Chauffeur non identifié. Précisez le nom/prénom ou l'ID."

        try:
            resp = requests.put(
                f"http://localhost:8080/api/gestion-parc/chauffeur/{chauffeur_id}/etat",
                params={"etat": etat}, timeout=10
            )
            if resp.status_code == 200:
                return f"✅ État du chauffeur **ID {chauffeur_id}** mis à jour → **{etat}**"
            return f"❌ Erreur ({resp.status_code}) : {resp.text}"
        except Exception as e:
            return f"❌ Serveur inaccessible : {e}"

    # ── TRAITER DÉCLARATION (CHEF) ──
    if intent == "CHEF_TRAITER_DECLARATION" and user_role == "CHEF_PARC":
        dec_id_match = re.search(r"d[ée]claration\s+(?:id\s+)?#?(\d+)", msg, re.IGNORECASE)
        if not dec_id_match:
            return "❓ Précisez l'ID de la déclaration. Ex : `Traiter déclaration 3`"

        dec_id       = int(dec_id_match.group(1))
        garage_match = re.search(r"garage\s*(?:id\s*:?\s*)?(\d+)", m)
        type_match   = re.search(r"type\s+entretien\s*:?\s*(.+?)(?:\s+date|\s+obs|$)", msg, re.IGNORECASE)
        date_match   = re.search(r"date\s+pr[eé]vue\s*:?\s*(\d{4}-\d{2}-\d{2})", msg, re.IGNORECASE)
        obs_match    = re.search(r"observations?\s*:?\s*(.+?)$", msg, re.IGNORECASE | re.MULTILINE)

        if garage_match and type_match and date_match:
            obs_e = obs_match.group(1).strip() if obs_match else ""
            try:
                resp = requests.post(
                    f"http://localhost:8080/api/gestion-parc/declaration/{dec_id}/traiter",
                    params={
                        "idChef":        user_id,
                        "idGarage":      int(garage_match.group(1)),
                        "typeEntretien": type_match.group(1).strip(),
                        "datePrevue":    date_match.group(1),
                        "obs":           obs_e
                    }, timeout=10
                )
                if resp.status_code == 200:
                    return (
                        f"✅ **Déclaration #{dec_id} traitée !** Un entretien a été créé.\n"
                        f"• Garage ID : {garage_match.group(1)}\n"
                        f"• Type : {type_match.group(1).strip()}\n"
                        f"• Date prévue : {date_match.group(1)}\n"
                        f"• Observations : {obs_e or '—'}"
                    )
                return f"❌ Erreur ({resp.status_code}) : {resp.text}"
            except Exception as e:
                return f"❌ Serveur inaccessible : {e}"
        else:
            pending_state[session_id] = {
                "action":  "traiter_declaration_pending",
                "dec_id":  dec_id,
                "chef_id": user_id
            }
            return (
                f"📋 Pour traiter la **déclaration #{dec_id}**, veuillez fournir :\n"
                "```\nGarage ID : <id>\nType entretien : <ex: Révision moteur>\nDate prévue : AAAA-MM-JJ\nObservations : <optionnel>\n```"
            )

    # ── RECHARGER CARTE (CHEF) ──
    if intent == "CHEF_RECHARGER_CARTE" and user_role == "CHEF_PARC":
        carte_match   = re.search(r"carte\s+([\w-]+)", msg, re.IGNORECASE)
        montant_match = re.search(r"montant\s+(\d+(?:\.\d+)?)", msg, re.IGNORECASE)

        if not carte_match or not montant_match:
            return "❓ Format : `Recharger carte CC-2024-001 montant 500`"

        numero  = carte_match.group(1).upper()
        montant = float(montant_match.group(1))
        try:
            resp = requests.put(
                f"http://localhost:8080/api/gestion-parc/carte/recharger/{numero}",
                json={"montant": montant}, timeout=10
            )
            if resp.status_code == 200:
                return f"✅ Carte **{numero}** rechargée de **{montant} DT** avec succès !"
            return f"❌ Erreur ({resp.status_code}) : {resp.text}"
        except Exception as e:
            return f"❌ Serveur inaccessible : {e}"

    return None

# ─────────────────────────────────────────────
# PROMPT MAÎTRE
# ─────────────────────────────────────────────
SYSTEM_PROMPT = """Tu es **ParcBot**, l'assistant intelligent intégré au système de Gestion de Parc Automobile d'AGIL.
Tu es précis, professionnel, courtois et concis. Tu réponds toujours en français.

━━━ RÈGLES ABSOLUES ━━━
1. Tu utilises EXCLUSIVEMENT les données fournies dans le contexte ci-dessous pour répondre aux questions métier.
2. Tu NE dois JAMAIS inventer des données (matricules, noms, IDs, états, etc.).
3. Si les données sont vides ou absentes, dis-le clairement.
4. Pour les questions générales (hors application), réponds comme un assistant intelligent.
5. Formate tes réponses de manière lisible : utilise des émojis appropriés, des listes et du **gras** pour les informations clés.
6. Tu NE dois JAMAIS mentionner que tu es un LLM ou que tu utilises un modèle IA.

━━━ TON RÔLE ACTUEL ━━━
Utilisateur connecté : {user_role} (ID : {user_id}, Nom : {user_name})

━━━ DONNÉES EN BASE POUR CETTE REQUÊTE ━━━
{data_context}

━━━ HISTORIQUE DE LA CONVERSATION ━━━
{history}

━━━ QUESTION DE L'UTILISATEUR ━━━
{user_message}

━━━ RÉPONSE (en français, claire, avec émojis pertinents) ━━━"""


def build_prompt(user_message: str, user_role: str, user_id: int, user_name: str,
                 data_context: str, history: list[dict]) -> str:
    history_text = ""
    for turn in history[-6:]:
        role_label    = "Utilisateur" if turn["role"] == "user" else "ParcBot"
        history_text += f"{role_label}: {turn['content']}\n"

    return SYSTEM_PROMPT.format(
        user_role    = user_role,
        user_id      = user_id,
        user_name    = user_name,
        data_context = data_context if data_context else "Aucune donnée spécifique récupérée pour cette requête.",
        history      = history_text.strip() if history_text else "Début de la conversation.",
        user_message = user_message
    )

# ─────────────────────────────────────────────
# ENDPOINT PRINCIPAL
# ─────────────────────────────────────────────
@app.route("/chat", methods=["POST"])
def chat():
    body         = request.json or {}
    user_message = body.get("message", "").strip()
    user_role    = body.get("role", "CHAUFFEUR")
    user_id      = int(body.get("userId", 0))
    user_name    = body.get("userName", "Utilisateur")
    session_id   = body.get("sessionId", f"{user_role}_{user_id}")

    if not user_message:
        return jsonify({"response": "❓ Votre message est vide."})

    # 1️⃣ Vérifier l'état en attente (multi-tour)
    pending_result = handle_pending(user_message, session_id)
    if pending_result:
        push_history(session_id, "user",      user_message)
        push_history(session_id, "assistant", pending_result)
        return jsonify({"response": pending_result})

    # 2️⃣ Détecter l'intention
    intent = detect_intent(user_message)

    # 3️⃣ Essayer une action directe (CRUD)
    direct = try_direct_action(intent, user_message, user_role, user_id, session_id)
    if direct:
        push_history(session_id, "user",      user_message)
        push_history(session_id, "assistant", direct)
        return jsonify({"response": direct})

    # 4️⃣ Construire le contexte données
    data_context = ""
    if intent != "GENERAL":
        data_context = build_data_context(intent, user_message, user_role, user_id)

    # 5️⃣ Construire le prompt et appeler le LLM
    history = get_history(session_id)
    prompt  = build_prompt(user_message, user_role, user_id, user_name, data_context, history)

    try:
        resp = requests.post(OLLAMA_URL, json={
            "model":   LLM_MODEL,
            "prompt":  prompt,
            "stream":  False,
            "options": {"temperature": 0.3, "num_ctx": 4096}
        }, timeout=60)

        result       = resp.json()
        bot_response = result.get("response", "").strip()

    except Exception as e:
        bot_response = f"⚠️ Le service IA est temporairement indisponible : {e}"

    # 6️⃣ Sauvegarder dans la mémoire
    push_history(session_id, "user",      user_message)
    push_history(session_id, "assistant", bot_response)

    return jsonify({"response": bot_response})


@app.route("/chat/reset", methods=["POST"])
def reset_chat():
    body       = request.json or {}
    session_id = body.get("sessionId", "")
    if session_id in conversation_memory:
        del conversation_memory[session_id]
    if session_id in pending_state:
        del pending_state[session_id]
    return jsonify({"message": "Conversation réinitialisée."})


if __name__ == "__main__":
    app.run(debug=True, port=5000)