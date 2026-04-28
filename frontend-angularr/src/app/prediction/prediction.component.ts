// prediction.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PredictionService, PredictionRequest,PredictionResult } from '../prediction.service';

@Component({
  selector: 'app-prediction',
  templateUrl: './prediction.component.html',
  imports: [FormsModule, CommonModule,HttpClientModule],
  styleUrl: './prediction.component.css', 
})
export class PredictionComponent {

  // ── Listes des options ────────────────────────────────────────
  typesVehicule = [
    'voiture_minicompacte',
    'voiture_sous_compacte',
    'voiture_compacte',
    'voiture_moyenne',
    'voiture_grande',
    'voiture_deux_places',
    'VUS_petit',
    'VUS_standard',
    'camionnette_petit',
    'camionnette_standard',
    'break_petit',
    'break_moyen',
    'monospace'
  ];

  transmissions  = ['integrale', 'propulsion', 'traction', '4x4'];
  boites         = ['automatique', 'manuelle'];
  niveauxTrafic  = ['fluide', 'modere', 'dense', 'embouteillage'];
  typesCharge    = ['personne', 'mixte', 'materiel'];

  // ── Formulaire ────────────────────────────────────────────────
  form = {
    typeVehicule    : 'voiture_moyenne',
    nombreCylindres : 4,
    tailleMoteur    : 2.0,
    transmission    : 'traction',
    boite           : 'automatique',
    annee           : 2020,
    kilometrage     : 50000,
    trajetKm        : 100,
    trafic          : 'fluide',
    typeCharge      : 'personne',
    poidsChargeKg   : 0,
    prixCarburant   : 2.3
  };

  // ── État ──────────────────────────────────────────────────────
  result  : PredictionResult | null = null;
  loading  = false;
  error    = '';

  constructor(private predictionService: PredictionService) {}

  onSubmit(): void {
    this.loading = true;
    this.error   = '';
    this.result  = null;

    // Mapping camelCase → snake_case pour l'API Flask
    const payload: PredictionRequest = {
      type_vehicule    : this.form.typeVehicule,
      nombre_cylindres : this.form.nombreCylindres,
      taille_moteur    : this.form.tailleMoteur,
      transmission     : this.form.transmission,
      boite            : this.form.boite,
      annee            : this.form.annee,
      trafic           : this.form.trafic,
      type_charge      : this.form.typeCharge,
      poids_charge_kg  : this.form.poidsChargeKg,
      kilometrage      : this.form.kilometrage,
      trajet_km        : this.form.trajetKm,
      prix_carburant   : this.form.prixCarburant
    };

this.predictionService.predict(payload).subscribe({
  next: (res: PredictionResult) => {
    this.result = {
      conso_constructeur : res.conso_constructeur,
      conso_reelle       : res.conso_reelle,
      litres_total       : res.litres_total,
      cout_carburant     : res.cout_carburant
    };
    this.loading = false;
  },
  error: () => {
    this.error   = 'Erreur lors de la prédiction. Vérifiez que le serveur Flask est lancé.';
    this.loading = false;
  }
});
  }
}