# app.py ─────────────────────────────────────────────────────────
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib, json
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)  # autorise les appels depuis Spring Boot

# ── Chargement au démarrage ───────────────────────────────────────
model    = joblib.load('model_carburant.pkl')
colonnes = json.load(open('colonnes_modele.json'))
config   = json.load(open('config_phase2.json'))

facteurs_trafic      = config['facteurs_trafic']
facteurs_type_charge = config['facteurs_type_charge']
poids_mapping        = config['poids_mapping']

def correcteur_poids(kg):
    return (kg / 100) * 0.5

def correcteur_kilometrage(km):
    if km < 50000:    return 1.00
    elif km < 150000: return 1.05
    elif km < 250000: return 1.12
    else:             return 1.20

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        # ── Validation des champs requis ──────────────────────────
        champs_requis = [
            'type_vehicule', 'nombre_cylindres', 'taille_moteur',
            'transmission', 'boite', 'annee', 'trafic',
            'type_charge', 'poids_charge_kg', 'kilometrage', 'trajet_km'
        ]
        for champ in champs_requis:
            if champ not in data:
                return jsonify({'error': f'Champ manquant : {champ}'}), 400

        # ── Phase 1 : ML ──────────────────────────────────────────
        type_v   = data['type_vehicule']
        age      = 2026 - int(data['annee'])
        vol_gaz  = float(data['nombre_cylindres']) * float(data['taille_moteur'])
        weight   = poids_mapping.get(type_v, 1400)

        input_dict = {col: 0 for col in colonnes}
        input_dict.update({
            'nombre_cylindres' : float(data['nombre_cylindres']),
            'taille_moteur'    : float(data['taille_moteur']),
            'age_vehicule'     : age,
            'volume_gaz'       : vol_gaz,
            'weight'           : weight,
        })
        for col in [f"type_{type_v}",
                    f"transmission_{data['transmission']}",
                    f"boite_{data['boite']}"]:
            if col in input_dict:
                input_dict[col] = 1

        input_df   = pd.DataFrame([input_dict])[colonnes]
        conso_base = float(model.predict(input_df)[0])

        # ── Phase 2 : Correcteurs ─────────────────────────────────
        f_trafic = facteurs_trafic.get(data['trafic'], 1.0)
        f_charge = facteurs_type_charge.get(data['type_charge'], 1.0)
        f_poids  = correcteur_poids(float(data['poids_charge_kg']))
        f_km     = correcteur_kilometrage(float(data['kilometrage']))

        conso_reelle = (conso_base * f_trafic * f_charge * f_km) + f_poids
        litres_total = conso_reelle * float(data['trajet_km']) / 100
        prix         = data.get('prix_carburant')
        cout         = round(litres_total * float(prix), 2) if prix else None

        return jsonify({
            'conso_constructeur_L100' : round(conso_base, 2),
            'conso_reelle_L100'       : round(conso_reelle, 2),
            'litres_total'            : round(litres_total, 2),
            'cout_carburant'          : cout,
            'detail_correcteurs': {
                'trafic'      : f_trafic,
                'type_charge' : f_charge,
                'poids_L100'  : round(f_poids, 3),
                'kilometrage' : f_km,
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'model_carburant.pkl'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000,debug=True)