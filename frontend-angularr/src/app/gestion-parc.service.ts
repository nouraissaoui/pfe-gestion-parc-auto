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
export interface Local {
  idLocal?: number;
  nomLocal: string;
  adresse: string;
  region?: string;
  ville?: string;
  images?: string; // <-- string au lieu de string[]
  
}

@Injectable({
  providedIn: 'root'
})
export class GestionParcService {

  private baseUrl = 'http://localhost:8080/api/gestion-parc'; // URL de base
  private apiUrl = 'http://localhost:8080/api/gestion-parc/local'; 


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
    return this.http.get<number>(`${this.baseUrl}/${idLocal}/total-vehicules`);
  }

  // Missions en cours
  getMissionsEnCours(idLocal: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${idLocal}/missions-en-cours`);
  }

  // Véhicules disponibles
  getVehiculesDisponibles(idLocal: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${idLocal}/vehicules-disponibles`);
  }

  // Déclarations en attente
  getDeclarationsEnAttente(idChef: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/declarations-en-attente/${idChef}`);
  }

  // Entretiens en attente
  getEntretiensEnAttente(idChef: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/en-attente/${idChef}`);
  }
    // 🔹 Nouvelle méthode pour récupérer le chef-parc par ID
  getChefParcById(idChef: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/chef-parc/${idChef}`);
  }
    getAll() {
      return this.http.get<Local[]>(this.apiUrl );
    }
  
    add(local: Local) {
      return this.http.post(this.apiUrl , local);
    }
  
    update(id: number, local: Local) {
      return this.http.put(`${this.apiUrl }/${id}`, local);
    }
  
    delete(id: number) {
      return this.http.delete(`${this.apiUrl}/${id}`);
    }
  

}