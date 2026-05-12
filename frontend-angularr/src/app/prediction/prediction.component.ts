// prediction.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  PredictionService,
  PredictionRequest,
  PredictionResult,
  VehiculeML
} from '../prediction.service';

@Component({
  selector: 'app-prediction',
  templateUrl: './prediction.component.html',
  imports: [FormsModule, CommonModule, HttpClientModule],
  styleUrl: './prediction.component.css',
})
export class PredictionComponent implements OnInit {

  // ── Données véhicules depuis la BD ────────────────────────────
  vehicules       : VehiculeML[] = [];          // tous les véhicules du local
  vehiculeSelectionne : VehiculeML | null = null;
  idVehiculeChoisi : number | null = null;
  loadingVehicules = false;
  erreurVehicules  = '';

  // ── Listes statiques (trajet) ─────────────────────────────────
  niveauxTrafic = ['fluide', 'modere', 'dense', 'embouteillage'];
  typesCharge   = ['personne', 'mixte', 'materiel'];

  // ── Formulaire ────────────────────────────────────────────────
  form = {
    // champs AUTO-REMPLIS depuis la BD (lecture seule après sélection)
    typeVehicule    : '',
    nombreCylindres : 0,
    tailleMoteur    : 0,
    transmission    : '',
    boite           : '',
    annee           : 0,
    kilometrage     : 0,

    // champs TRAJET (saisis manuellement — inchangés)
    trajetKm        : 100,
    trafic          : 'fluide',
    typeCharge      : 'personne',
    poidsChargeKg   : 0,
    prixCarburant   : 2.3
  };

  // ── État résultat ─────────────────────────────────────────────
  result  : PredictionResult | null = null;
  loading  = false;
  error    = '';

  constructor(private predictionService: PredictionService) {}

  ngOnInit(): void {
    this.chargerVehicules();
  }

  // ── Chargement des véhicules du local ─────────────────────────
  chargerVehicules(): void {
    // Récupère l'idLocal depuis le sessionStorage (même logique que le reste de l'app)
    const idLocal = Number(sessionStorage.getItem('idLocal'));
    console.log('idLocal from session:', idLocal); // ← check this
  console.log('All sessionStorage:', { ...sessionStorage }); // ← check this
    if (!idLocal) {
      this.erreurVehicules = 'Aucun local trouvé en session.';
      return;
    }

    this.loadingVehicules = true;
    this.predictionService.getVehiculesByLocal(idLocal).subscribe({
      next: (list) => {
        // On ne garde que les véhicules avec les champs ML renseignés
        this.vehicules = list.filter(v => v.idVehicule); 

        this.loadingVehicules = false;
      },
      error: () => {
        this.erreurVehicules = 'Impossible de charger les véhicules.';
        this.loadingVehicules = false;
      }
    });
  }

  // ── Auto-remplissage quand l'utilisateur choisit un véhicule ──
  onVehiculeChange(): void {
    if (!this.idVehiculeChoisi) {
      this.vehiculeSelectionne = null;
      this.resetChampsVehicule();
      
      return;
    }

    const v = this.vehicules.find(x => x.idVehicule === Number(this.idVehiculeChoisi));
    if (!v) return;

    this.vehiculeSelectionne = v;

    // Remplissage automatique des champs depuis la BD
    this.form.typeVehicule    = v.type_vehicule   ?? '';
    this.form.nombreCylindres = v.nombre_cylindres ?? 4;
    this.form.tailleMoteur    = v.taille_moteur    ?? 2.0;
    this.form.transmission    = v.transmission     ?? 'traction';
    this.form.boite           = v.boite            ?? 'manuelle';
    this.form.annee           = v.annee;
    this.form.kilometrage     = v.km_total         ?? 0;
  }

  // ── Reset si désélection ──────────────────────────────────────
  private resetChampsVehicule(): void {
    this.form.typeVehicule    = '';
    this.form.nombreCylindres = 0;
    this.form.tailleMoteur    = 0;
    this.form.transmission    = '';
    this.form.boite           = '';
    this.form.annee           = 0;
    this.form.kilometrage     = 0;
  }

  // ── Libellé carburant pour le badge ──────────────────────────
  get badgeCarburant(): string {
    const c = this.vehiculeSelectionne?.carburant ?? '';
    const map: Record<string, string> = {
      'Diesel'    : '⛽ Diesel',
      'Essence'   : '⛽ Essence',
      'Hybride'   : '🔋 Hybride',
      'Électrique': '⚡ Électrique',
    };
    return map[c] ?? c;
  }

  // ── Fallback image cassée ─────────────────────────────────────
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  // ── Soumission ────────────────────────────────────────────────
  onSubmit(): void {
    if (!this.vehiculeSelectionne) {
      this.error = 'Veuillez sélectionner un véhicule.';
      return;
    }

    this.loading = true;
    this.error   = '';
    this.result  = null;

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
        this.result  = res;
        this.loading = false;
      },
      error: () => {
        this.error   = 'Erreur lors de la prédiction. Vérifiez que le serveur Flask est lancé.';
        this.loading = false;
      }
    });
  }
}