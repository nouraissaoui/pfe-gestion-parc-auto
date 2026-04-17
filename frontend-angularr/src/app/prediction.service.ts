// src/app/prediction/prediction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface PredictionRequest {
  typeVehicule     : string;
  nombreCylindres  : number;
  tailleMoteur     : number;
  transmission     : string;
  boite            : string;
  annee            : number;
  trafic           : string;
  typeCharge       : string;
  poidsChargeKg    : number;
  kilometrage      : number;
  trajetKm         : number;
  prixCarburant   ?: number;
}

export interface PredictionResponse {
  consoConstructeur : number;
  consoReelle       : number;
  litresTotal       : number;
  coutCarburant    ?: number;
  detailCorrecteurs : {
    trafic      : number;
    type_charge : number;
    poids_L100  : number;
    kilometrage : number;
  };
}

@Injectable({ providedIn: 'root' })
export class PredictionService {

  private apiUrl = 'http://localhost:8080/api/predict';

  constructor(private http: HttpClient) {}

  predict(data: PredictionRequest): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(this.apiUrl, data);
  }
}