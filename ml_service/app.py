from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import pandas as pd

app = Flask(__name__)
CORS(app)

# ── Chargement modèle et config ───────────────────────────────────
model_final = joblib.load('model_carburant.pkl')

with open('colonnes_modele.json') as f:
    colonnes = json.load(f)

with open('config_phase2.json') as f:
    cfg = json.load(f)

facteurs_trafic      = cfg['facteurs_trafic']
facteurs_type_charge = cfg['facteurs_type_charge']
poids_mapping        = cfg['poids_mapping']
delta_poids          = cfg['correcteur_poids_par_100kg']

def correcteur_poids(kg):
    return (kg / 100) * delta_poids

def correcteur_kilometrage(km):
    km_cfg = cfg['correcteur_km']
    if km < 50_000:    return km_cfg['0_50000']
    elif km < 150_000: return km_cfg['50000_150000']
    elif km < 250_000: return km_cfg['150000_250000']
    else:              return km_cfg['250000_plus']

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()

    type_vehicule    = data['type_vehicule']
    nombre_cylindres = float(data['nombre_cylindres'])
    taille_moteur    = float(data['taille_moteur'])
    transmission     = data['transmission']
    boite            = data['boite']
    annee            = int(data['annee'])
    trafic           = data['trafic']
    type_charge      = data['type_charge']
    poids_charge_kg  = float(data['poids_charge_kg'])
    kilometrage      = float(data['kilometrage'])
    trajet_km        = float(data['trajet_km'])
    prix_carburant   = float(data.get('prix_carburant', 0)) or None

    # ── PHASE 1 : ML ─────────────────────────────────────────────
    age_vehicule = 2026 - annee
    volume_gaz   = nombre_cylindres * taille_moteur
    weight       = poids_mapping.get(type_vehicule, 1400)

    input_dict = {col: 0 for col in colonnes}
    input_dict.update({
        'nombre_cylindres': nombre_cylindres,
        'taille_moteur'   : taille_moteur,
        'age_vehicule'    : age_vehicule,
        'volume_gaz'      : volume_gaz,
        'weight'          : weight,
    })
    for col in [f'type_{type_vehicule}',
                f'transmission_{transmission}',
                f'boite_{boite}']:
        if col in input_dict:
            input_dict[col] = 1

    input_df   = pd.DataFrame([input_dict])[colonnes]
    conso_base = float(model_final.predict(input_df)[0])

    # ── PHASE 2 : Correcteurs ─────────────────────────────────────
    f_trafic = facteurs_trafic.get(trafic, 1.0)
    f_charge = facteurs_type_charge.get(type_charge, 1.0)
    f_poids  = correcteur_poids(poids_charge_kg)
    f_km     = correcteur_kilometrage(kilometrage)

    conso_reelle = (conso_base * f_trafic * f_charge * f_km) + f_poids
     # ✅ Plafond
    conso_reelle = min(conso_reelle, conso_base * 2.0)
    litres_total = conso_reelle * trajet_km / 100
    cout = round(litres_total * prix_carburant, 2) if prix_carburant else None

    return jsonify({
        'conso_constructeur' : round(conso_base, 2),
        'conso_reelle'       : round(conso_reelle, 2),
        'litres_total'       : round(litres_total, 2),
        'cout_carburant'     : cout
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)