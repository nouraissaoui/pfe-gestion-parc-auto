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
  id: number;           // ID du Chauffeur ou du Chef de Parc
  nom: string;
  prenom: string;
  mail: string;
  typeUtilisateur: string; // "CHEF_PARC" ou "CHAUFFEUR"
  idLocal: number | null;
}
export interface Local {
  idLocal?: number;
  nomLocal: string;
  adresse: string;
  region?: string;
  ville?: string;
  images?: string; // <-- string au lieu de string[]
  
}
export interface ChefParc {
  idChefParc: number;
  nom: string;
  prenom: string;
  mail: string;
  motDePasse?: string;
  dateNomination?: string;
  ancienneteChef?: number;
  niveauResponsabilite?: 'LOCAL_PRINCIPAL' | 'REGIONAL'|null ;
  local?: Local | null;
}
export interface Vehicule {
type: any;
  idVehicule: number;
  matricule: string;
  marque: string;
  modele: string;
  annee: number;
  carburant: string;
  image: string;
  etat: 'DISPONIBLE' | 'EN_MISSION' | 'EN_ENTRETIEN' | 'INDISPONIBLE';
    local?: any; // On peut typer plus précisément si on a l'interface Local

}
export interface Chauffeur {
  idChauffeur?: number;
  nom: string;
  prenom: string;
  mail: string;
  motDePasse?: string; // Optionnel car WRITE_ONLY côté backend
  datePriseLicense?: string;
  anciennete?: number;
  typeVehiculePermis?: string;
  dateExpirationPermis?: string;
  region?: string;
  etatChauffeur: 'DISPONIBLE' | 'EN_MISSION' | 'EN_CONGE';
  vehicule?: Vehicule | null;
  local?: Local | null; // Le local est envoyé en tant qu'objet imbriqué
}

@Injectable({
  providedIn: 'root'
})
export class GestionParcService {

  private baseUrl = 'http://localhost:8080/api/gestion-parc'; // URL de base
  private apiUrl = 'http://localhost:8080/api/gestion-parc/local'; 
private apiUrl1 = 'http://localhost:8080/api/gestion-parc/carte';

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

  getVehiculesEnMission(idLocal: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${idLocal}/vehicules-en-mission`);
  }

  getVehiculesEnEntretien(idLocal: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${idLocal}/vehicules-en-entretien`);
  }

  getVehiculesIndisponibles(idLocal: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${idLocal}/vehicules-indisponibles`);
  }

  // ================= VEHICULES =================

  getVehiculesByLocal(idLocal: number): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.baseUrl}/${idLocal}/vehicules`);
  }

  updateEtatVehicule(idVehicule: number, etat: string): Observable<Vehicule> {
    const params = new HttpParams().set('etat', etat);
    return this.http.put<Vehicule>(
      `${this.baseUrl}/vehicule/${idVehicule}/etat`,
      null,
      { params }
    );
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
      // Récupérer les chauffeurs du local
  getChauffeursParLocal(idLocal: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/local/${idLocal}/chauffeurs`);
  }

  // Valider l'affectation
affecterVehicule(idChauffeur: number, idVehicule: number): Observable<any> {
  // On s'assure que les IDs sont envoyés proprement dans l'URL
  const url = `${this.baseUrl}/affecter/${idChauffeur}/${idVehicule}`;
  console.log("Appel API Affectation : ", url); 
  
  return this.http.put(url, {}, {
    observe: 'response' // Permet de voir le code statut (200, 404, etc.)
  });
}
getChauffeursByLocal(idLocal: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/local/${idLocal}/chauffeurs`);
  }
  updateEtatChauffeur(idChauffeur: number, etat: string): Observable<any> {
    // On passe l'état en RequestParam comme défini dans ton Controller Java
    return this.http.put(`${this.baseUrl}/chauffeur/${idChauffeur}/etat?etat=${etat}`, {});
  }
  // Affecter une mission manuellement
  affecterMission(mission: any, idChauffeur: number, idVehicule: number, idChef: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/mission/affecter/${idChauffeur}/${idVehicule}/${idChef}`, mission);
  }

  // Récupérer les missions d'une feuille spécifique (le carnet)
  getMissionsFeuille(idFeuille: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/feuille-de-route/${idFeuille}/missions`);
  }

  // Récupérer les feuilles de route du local
getFeuillesDeRoute(idLocal: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/local/${idLocal}/feuilles-actives`);
}
// --- Missions ---

// Modifier une mission (Remplace l'ancienne version)
modifierMission(idMission: number, missionDetails: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/mission/modifier/${idMission}`, missionDetails);
}

// Supprimer une mission (Vérifiez que l'URL correspond au DeleteMapping du Controller)
deleteMission(idMission: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/mission/supprimer/${idMission}`);
}

// Supprimer une feuille de route complète et libérer les ressources
deleteFeuilleDeRoute(idFeuille: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/feuille-de-route/supprimer/${idFeuille}`);
}
  
  getAllChefs(): Observable<ChefParc[]> {
    return this.http.get<ChefParc[]>(`${this.baseUrl}/chefparc`);
  }

 
  createChefParc(payload: any): Observable<ChefParc> {
    return this.http.post<ChefParc>(`${this.baseUrl}/chefparc`, payload);
  }

  
updateChefParc(id: number, payload: any): Observable<ChefParc> {
  console.log("Données envoyées au serveur :", payload); // Vérifiez dans la console F12 si niveauResponsabilite est bien à null
  return this.http.put<ChefParc>(`${this.baseUrl}/chefparc/${id}`, payload);
}
 
// Dans gestion-parc.service.ts
deleteChefParc(id: number): Observable<string> {
  return this.http.delete(`${this.baseUrl}/chefparc/${id}`, { responseType: 'text' });
}

  // ------------------ LOCAUX ------------------

 // Ajoutez cette méthode dans votre ChefParcService
getAllLocaux(): Observable<Local[]> {
  return this.http.get<Local[]>('http://localhost:8080/api/gestion-parc/local'); 
  // Remplacez /locaux par votre endpoint réel pour les locaux
}
  getLocalById(id: number): Observable<Local> {
    return this.http.get<Local>(`${this.baseUrl}/local/${id}`);
  }
  // ==================== CRUD VÉHICULES SIMPLE ====================

  // 1. Récupérer tous les véhicules
  getAllVehicules(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.baseUrl}/vehicules`);
  }

  // 2. Récupérer un véhicule par son ID
  getVehiculeById(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.baseUrl}/vehicule/${id}`);
  }

  // 3. Ajouter un véhicule (avec l'ID du local en option)
  addVehicule(vehicule: Vehicule, idLocal: number): Observable<Vehicule> {
    return this.http.post<Vehicule>(`${this.baseUrl}/vehicule?idLocal=${idLocal}`, vehicule);
  }

  // 4. Modifier un véhicule
  updateVehicule(id: number, vehicule: Vehicule, idLocal: number): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${this.baseUrl}/vehicule/${id}?idLocal=${idLocal}`, vehicule);
  }

  // 5. Supprimer un véhicule
  deleteVehicule(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/vehicule/${id}`, { responseType: 'text' });
  }
getCarte(numero: string): Observable<any> {
    return this.http.get(`${this.apiUrl1}/${numero}`);
  }

  recharger(numero: string, montant: number): Observable<any> {
    return this.http.put(`${this.apiUrl1}/recharger/${numero}`, { montant });
  }
  // ==================== CRUD CHAUFFEURS COMPLET ====================

  // 1. Récupérer tous les chauffeurs
  getAllChauffeurs(): Observable<Chauffeur[]> {
    return this.http.get<Chauffeur[]>(`${this.baseUrl}/chauffeurs`);
  }

  // 2. Récupérer un chauffeur par ID
  getChauffeurById(id: number): Observable<Chauffeur> {
    return this.http.get<Chauffeur>(`${this.baseUrl}/chauffeur/${id}`);
  }

  // 3. Ajouter un chauffeur (Le Local est déjà dans l'objet Chauffeur)
  addChauffeur(chauffeur: Chauffeur): Observable<Chauffeur> {
    return this.http.post<Chauffeur>(`${this.baseUrl}/chauffeur`, chauffeur);
  }

  // 4. Modifier un chauffeur
  updateChauffeur(id: number, chauffeur: Chauffeur): Observable<Chauffeur> {
    return this.http.put<Chauffeur>(`${this.baseUrl}/chauffeur/${id}`, chauffeur);
  }

  // 5. Supprimer un chauffeur
  deleteChauffeur(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/chauffeur/${id}`);
  }
}