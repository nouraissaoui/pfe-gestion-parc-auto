import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {  HttpParams } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

export interface DashboardStats {
  totalVehicules: number;
  missionsEnCours: number;
  vehiculesDisponibles: number;
  declarationsEnAttente: number;
  maintenanceEnAttente: number;
}
export interface LoginResponse {
  idUser: number;
  nom: string;
  prenom: string;
  role: string;

  idChefParc?: number;
  idChauffeur?: number;
  idAdmin?: number;

  idLocal?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GestionParcService {

  private baseUrl = 'http://localhost:8080/api/auth'; // URL de base
  private dashboardUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) { }

  // Méthode pour login
login(email: string, password: string): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(
    `${this.baseUrl}/login`,
    { mail: email, motDePasse: password }
  );
}
  // Total véhicules
  getTotalVehicules(idLocal: number): Observable<number> {
    return this.http.get<number>(`${this.dashboardUrl}/${idLocal}/total-vehicules`);
  }

  // Missions en cours
  getMissionsEnCours(idLocal: number): Observable<number> {
    return this.http.get<number>(`${this.dashboardUrl}/${idLocal}/missions-en-cours`);
  }

  // Véhicules disponibles
  getVehiculesDisponibles(idLocal: number): Observable<number> {
    return this.http.get<number>(`${this.dashboardUrl}/${idLocal}/vehicules-disponibles`);
  }

  // Déclarations en attente
  getDeclarationsEnAttente(idChef: number): Observable<number> {
    return this.http.get<number>(`${this.dashboardUrl}/declarations-en-attente/${idChef}`);
  }

  // Entretiens en attente
  getEntretiensEnAttente(idChef: number): Observable<number> {
    return this.http.get<number>(`${this.dashboardUrl}/en-attente/${idChef}`);
  }

}