// prediction.component.ts
import { Component } from '@angular/core';
import { PredictionRequest, PredictionResponse, PredictionService } from '../prediction.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-prediction',
  templateUrl: './prediction.component.html',
  imports: [FormsModule, CommonModule],
  styleUrl: './prediction.component.css', 
})
export class PredictionComponent {

  form: PredictionRequest = {
    typeVehicule    : 'SUV',
    nombreCylindres : 4,
    tailleMoteur    : 2.0,
    transmission    : 'integrale',
    boite           : 'automatique',
    annee           : 2022,
    trafic          : 'fluide',
    typeCharge      : 'personne',
    poidsChargeKg   : 0,
    kilometrage     : 50000,
    trajetKm        : 100,
    prixCarburant   : 2.3
  };

  result    : PredictionResponse | null = null;
  loading   : boolean = false;
  error     : string  = '';

  typesVehicule  = ['petite','moyenne','grande','SUV','sport','utilitaire','familiale'];
  transmissions  = ['traction','propulsion','integrale','4x4'];
  boites         = ['automatique','manuelle'];
  niveauxTrafic  = ['fluide','modere','dense','embouteillage'];
  typesCharge    = ['personne','materiel','mixte'];

  constructor(private predictionService: PredictionService) {}

  onSubmit(): void {
    this.loading = true;
    this.error   = '';
    this.result  = null;

    this.predictionService.predict(this.form).subscribe({
      next : (res) => { this.result = res;  this.loading = false; },
      error: (err) => { this.error  = 'Erreur de connexion au serveur';
                        this.loading = false; }
    });
  }
}