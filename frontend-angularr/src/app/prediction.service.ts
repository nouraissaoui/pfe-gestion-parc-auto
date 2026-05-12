import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Interfaces ML ─────────────────────────────────────────────────
export interface PredictionRequest {
  type_vehicule    : string;
  nombre_cylindres : number;
  taille_moteur    : number;
  transmission     : string;
  boite            : string;
  annee            : number;
  trafic           : string;
  type_charge      : string;
  poids_charge_kg  : number;
  kilometrage      : number;
  trajet_km        : number;
  prix_carburant   : number;
}

export interface PredictionResult {
  conso_constructeur : number;
  conso_reelle       : number;
  litres_total       : number;
  cout_carburant     : number | null;
}

// ── Interface Véhicule enrichie (champs ML inclus) ────────────────
export interface VehiculeML {
  idVehicule      : number;
  matricule       : string;
  marque          : string;
  modele          : string;
  annee           : number;
  carburant       : string;
  etat            : string;
  image           : string | null;
  boite           : string | null;
  km_total        : number | null;
  nombre_cylindres: number | null;
  taille_moteur   : number | null;
  transmission    : string | null;
  type_vehicule   : string | null;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {

  private flaskUrl = 'http://localhost:5001/api/predict';
  private springUrl = 'http://localhost:8080/api/gestion-parc';

  constructor(private http: HttpClient) {}

  /** Appel Flask ML */
  predict(data: PredictionRequest): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(this.flaskUrl, data);
  }

  /** Récupère tous les véhicules du local (avec les champs ML) */
  getVehiculesByLocal(idLocal: number): Observable<VehiculeML[]> {
    return this.http.get<VehiculeML[]>(`${this.springUrl}/${idLocal}/vehicules`);
  }
}