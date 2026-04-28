import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

// ✅ snake_case pour matcher exactement la réponse Flask
export interface PredictionResult {
  conso_constructeur : number;
  conso_reelle       : number;
  litres_total       : number;
  cout_carburant     : number | null;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private apiUrl = 'http://localhost:5001/api/predict';
  constructor(private http: HttpClient) {}
  predict(data: PredictionRequest): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(this.apiUrl, data);
  }
}