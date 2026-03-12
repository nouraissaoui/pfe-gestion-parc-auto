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
// 1. Interface à ajouter en haut du fichier
export interface Entretien {
  idEntretien?: number;
  typeEntretien: string;
  categorie: 'ENTRETIEN_PERIODIQUE' | 'ENTRETIEN_SUITE_DECLARATION';
  datePrevue: string;
  // dateEffectuee supprimée
  observations: string;
  // status supprimé (car la création vaut ordre de mission)
  declaration?: Declaration;
  garage: any;
  vehicule: Vehicule;
  chefDuParc: any;
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
export interface Declaration {
  idDeclaration?: number;
  type: 'PANNE' | 'AMENDE' | 'ACCIDENT';
  description: string;
  dateCreation?: string;
  status?: 'EN_ATTENTE' | 'TRAITE' | 'REJETE';
  vehicule?: Vehicule;
  chauffeur?: Chauffeur;
  chefParc?: ChefParc;
}
export interface Mission {
  idMission: number;
  dateMission: string;
  pointDepart: string;
  destination: string;
  heureDepartPrevue: string;
  description: string;
  heureDepartReelle?: string;
  heureArriveeReelle?: string;
  kmDepart?: number;
  kmArrivee?: number;
  consommationCarburant?: number;
  observations?: string;
}

export interface FeuilleDeRoute {
  idFeuille: number;
  dateGeneration: string;
  statut: string;
  vehicule: any;
  chauffeur: any;
  chefParc: any;
  missions: Mission[];
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
 // Dans gestion-parc.service.ts
deleteVehicule(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/vehicule/${id}`);
}
getCarte(numero: string): Observable<any> {
    return this.http.get(`${this.apiUrl1}/${numero}`);
  }
// Récupérer la liste des déclarations à traiter
getDeclarationsEnAttenteLocal(idLocal: number): Observable<Declaration[]> {
  return this.http.get<Declaration[]>(`${this.baseUrl}/local/${idLocal}/declarations-en-attente`);
}

// Envoyer le formulaire de traitement
validerTraitementDeclaration(idDec: number, idChef: number, idGarage: number, type: string, date: string, obs: string): Observable<any> {
  const params = new HttpParams()
    .set('idChef', idChef.toString())
    .set('idGarage', idGarage.toString()) // Ajouté
    .set('typeEntretien', type)          // Ajouté
    .set('datePrevue', date)
    .set('obs', obs);

  return this.http.post(`${this.baseUrl}/declaration/${idDec}/traiter`, null, { params });
}

getGarages(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/garages`);
}
getToutesDeclarationsLocal(idLocal: number): Observable<Declaration[]> {
  return this.http.get<Declaration[]>(`${this.baseUrl}/local/${idLocal}/declarations-toutes`);
}

// 2 gestion des entretienss 
// -------------------------------------------------------

// Récupérer tous les entretiens (Curatifs et Périodiques) du local
getEntretiensByLocal(idLocal: number): Observable<Entretien[]> {
  return this.http.get<Entretien[]>(`${this.baseUrl}/local/${idLocal}/entretiens`);
}

// Planifier un entretien périodique (Préventif)
planifierEntretienPeriodique(entretien: Partial<Entretien>, idVehicule: number, idGarage: number, idChef: number): Observable<Entretien> {
  const params = new HttpParams()
    .set('idVehicule', idVehicule.toString())
    .set('idGarage', idGarage.toString())
    .set('idChef', idChef.toString());
  
  return this.http.post<Entretien>(`${this.baseUrl}/entretien/periodique`, entretien, { params });
}

// Mettre à jour un entretien (ex: changer le statut à TRAITE une fois terminé)
updateEntretien(id: number, entretien: Partial<Entretien>): Observable<Entretien> {
  return this.http.put<Entretien>(`${this.baseUrl}/entretien/${id}`, entretien);
}

// Supprimer un entretien
deleteEntretien(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/entretien/${id}`);
}
/*recuperer les missions d'un chauffeur*/
/* Remplacer l'ancienne méthode par celle-ci */
getMissionsByChauffeur(idChauffeur: number): Observable<Mission[]> {
  // On ajoute bien /missions à la fin pour correspondre au @GetMapping du controller
  return this.http.get<Mission[]>(`${this.baseUrl}/chauffeur/${idChauffeur}/missions`);
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
  // ==================== GESTION DES DÉCLARATIONS ====================

// Créer une déclaration (Chauffeur)
creerDeclaration(idChauffeur: number, type: string, description: string): Observable<Declaration> {
  const payload = {
    idChauffeur: idChauffeur,
    type: type,
    description: description
  };
  return this.http.post<Declaration>(`${this.baseUrl}/declaration/creer`, payload);
}

// Récupérer l'historique des déclarations d'un chauffeur
getDeclarationsByChauffeur(idChauffeur: number): Observable<Declaration[]> {
  return this.http.get<Declaration[]>(`${this.baseUrl}/chauffeur/${idChauffeur}/declarations`);
}

// Mettre à jour le statut (Chef de Parc)
updateStatutDeclaration(idDeclaration: number, statut: string): Observable<Declaration> {
  // Utilisation de HttpParams pour le @RequestParam status
  const params = new HttpParams().set('status', statut);
  return this.http.put<Declaration>(
    `${this.baseUrl}/declaration/${idDeclaration}/statut`, 
    {}, 
    { params }
  );
}// Dans gestion-parc.service.ts
updateDeclaration(id: number, data: any): Observable<any> {
  // L'URL doit être exactement celle-ci pour correspondre au Controller Java
  return this.http.put(`http://localhost:8080/api/gestion-parc/declaration/modifier/${id}`, data);
}
deleteDeclaration(id: number, idChauffeur: number): Observable<any> {
  // On passe l'idChauffeur en paramètre de requête (?idChauffeur=...)
  const params = new HttpParams().set('idChauffeur', idChauffeur.toString());
  
  return this.http.delete(`${this.baseUrl}/declarations/${id}`, { 
    params,
    responseType: 'text' as 'json' // Utile si le backend renvoie un message simple au lieu d'un objet
  });
}
// Récupère les feuilles de route du chauffeur connecté
 getMesFeuilles(idChauffeur: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chauffeur/${idChauffeur}/feuilles`);
  }

  completerMission(idMission: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/mission/${idMission}/completer`, data);
  }
  /**
 * Récupère toutes les missions assignées à un chauffeur spécifique.
 * L'URL correspond au Mapping : /api/gestion-parc/chauffeur/{idChauffeur}/missions
 */

}