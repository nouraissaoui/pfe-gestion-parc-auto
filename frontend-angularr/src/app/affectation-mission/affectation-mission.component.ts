import { Component, OnInit } from '@angular/core';
import { GestionParcService, Vehicule } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-affectation-mission',
  imports: [CommonModule, FormsModule],
  templateUrl: './affectation-mission.component.html',
  styleUrl: './affectation-mission.component.css'
})
export class AffectationMissionComponent implements OnInit {
ouvrirConsultation(_t75: any) {
throw new Error('Method not implemented.');
}
selectedFeuille: any;
chauffeursDispo: any[] = [];
vehiculesDispo: Vehicule[] = [];
feuillesDeRoute: any[] = [];
selectedChauffeur!: number;
selectedVehicule!: number;
typeMission: 'EMPLOYE' | 'MATERIEL' = 'EMPLOYE';

  // Modèle de la mission
  missionData = {
    dateMission: new Date().toISOString().split('T')[0],
    pointDepart: '',
    destination: '',
    heureDepartPrevue: '',
    description: '',
    bandePrelevement: ''
  };

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

chargerDonnees(): void {
const idLocalStr = localStorage.getItem('idLocal');
  if (!idLocalStr) {
     console.error("Aucun idLocal trouvé");
     return;
  }

  const idLocal = Number(idLocalStr);
  // 1. Récupérer les Chauffeurs proprement
 this.service.getChauffeursParLocal(idLocal).subscribe({
  next: (res) => {
    // MODIFICATION : On filtre pour garder DISPONIBLE et EN_MISSION
    this.chauffeursDispo = res.filter(c => 
      c.etatChauffeur === 'DISPONIBLE' || c.etatChauffeur === 'EN_MISSION'
    );
  }
});

  // 2. Récupérer les Véhicules via l'appel API direct (beaucoup plus fiable)
  this.service.getVehiculesByLocal(idLocal).subscribe({
    next: (res) => {
      console.log("Véhicules reçus :", res);
      this.vehiculesDispo = res.filter(v => v.etat === 'DISPONIBLE');
    },
    error: (err) => console.error("Erreur Véhicules", err)
  });

  // 3. Charger les feuilles de route
  this.service.getFeuillesDeRoute(idLocal).subscribe(res => {
    this.feuillesDeRoute = res;
  });
}

  onTypeChange(): void {
    if (this.typeMission === 'EMPLOYE') {
      this.missionData.bandePrelevement = '';
    }
  }

  validerAffectation(): void {
    const idChef = Number(localStorage.getItem('id'));

    // Sécurité supplémentaire
    if (this.typeMission === 'MATERIEL' && !this.missionData.bandePrelevement) {
      alert("Veuillez saisir la liste du matériel (Bande de prélèvement)");
      return;
    }

    this.service.affecterMission(this.missionData, this.selectedChauffeur, this.selectedVehicule, idChef)
      .subscribe({
        next: () => {
          alert("Mission affectée avec succès !");
          this.resetForm();
          this.chargerDonnees();
        },
        error: (err) => alert("Erreur : " + err.message)
      });
  }

supprimerMission(id: number): void {
  if (confirm("Supprimer cette mission du carnet ?")) {
    this.service.deleteMission(id).subscribe({
      next: () => {
        // 1. Mise à jour visuelle immédiate dans la modal ouverte
        if (this.selectedFeuille && this.selectedFeuille.missions) {
          this.selectedFeuille.missions = this.selectedFeuille.missions.filter(
            (m: any) => m.idMission !== id
          );
        }

        // 2. Rafraîchir les données globales en arrière-plan
        this.chargerDonnees();
        
        alert("Mission supprimée avec succès.");
      },
      error: (err) => alert("Erreur lors de la suppression : " + err.message)
    });
  }
}

  resetForm(): void {
    this.missionData = {
      dateMission: new Date().toISOString().split('T')[0],
      pointDepart: 'Local Central',
      destination: '',
      heureDepartPrevue: '',
      description: '',
      bandePrelevement: ''
    };
    this.typeMission = 'EMPLOYE';
    this.selectedChauffeur = undefined!;
    this.selectedVehicule = undefined!;
  }
  // Dans affectation-mission.component.ts

vehiculeVerrouille: boolean = false;

onChauffeurChange(idChauffeur: number) {
  const chauffeur = this.chauffeursDispo.find(c => c.idChauffeur == idChauffeur);
  
  if (chauffeur && chauffeur.etatChauffeur === 'EN_MISSION') {
    const confirmation = confirm(`Le chauffeur ${chauffeur.nom} est déjà en mission avec le véhicule ${chauffeur.vehicule.matricule}. Voulez-vous changer de véhicule pour cette nouvelle mission ?`);
    
    if (confirmation) {
      this.vehiculeVerrouille = false; // Accessible
      this.selectedVehicule = undefined!; // On force à rechoisir
    } else {
      this.vehiculeVerrouille = true; // Verrouillé
      this.selectedVehicule = chauffeur.vehicule.idVehicule; // On auto-sélectionne le sien
    }
  } else {
    this.vehiculeVerrouille = false;
  }
}

currentViewDate: Date = new Date();
showAllMissions: boolean = false;

selectFeuille(feuille: any) {
  this.selectedFeuille = feuille;
  this.currentViewDate = new Date(); // Reset à aujourd'hui à l'ouverture
  this.showAllMissions = false;
}

// Filtrage des missions pour la vue actuelle
get filteredMissions() {
  if (!this.selectedFeuille || !this.selectedFeuille.missions) return [];
  
  if (this.showAllMissions) return this.selectedFeuille.missions;

  return this.selectedFeuille.missions.filter((m: any) => {
    const missionDate = new Date(m.dateMission).toDateString();
    return missionDate === this.currentViewDate.toDateString();
  });
}

navigateDate(days: number) {
  const newDate = new Date(this.currentViewDate);
  newDate.setDate(newDate.getDate() + days);
  this.currentViewDate = newDate;
  this.showAllMissions = false;
}

toggleAllMissions() {
  this.showAllMissions = !this.showAllMissions;
}
editingMissionId: number | null = null; // Stocke l'ID de la mission en cours d'édition


// Annule l'édition
annulerEditionDirecte() {
    this.editingMissionId = null;
}

// Sauvegarde les modifications directement depuis la modal
sauvegarderModificationDirecte(m: any) {
    this.service.modifierMission(m.idMission, m).subscribe({
        next: () => {
            this.editingMissionId = null; // Repasse en mode lecture
            alert("Mission mise à jour !");
            this.chargerDonnees(); // Rafraîchit les données en arrière-plan
        },
        error: (err) => alert("Erreur lors de la mise à jour")
    });
}
// Vérifie si la mission est modifiable (pas encore terminée)
isMissionModifiable(m: any): boolean {
    // Une mission est considérée terminée si l'heure d'arrivée ou le KM d'arrivée est saisi
    return !m.heureArriveeReelle && !m.kmArrivee;
}

modifierMission(m: any) {
    if (!this.isMissionModifiable(m)) {
        alert("Cette mission est déjà terminée et ne peut plus être modifiée.");
        return;
    }
    this.editingMissionId = m.idMission;
}
// ... (reste du code existant)

/**
 * Supprime une feuille de route complète
 * @param idFeuille ID de la feuille à supprimer
 */
supprimerFeuilleDeRoute(idFeuille: number): void {
  // 1. Demande de confirmation par sécurité
  if (confirm("Attention : Supprimer cette feuille de route supprimera également TOUTES les missions associées. Confirmer ?")) {
    
    this.service.deleteFeuilleDeRoute(idFeuille).subscribe({
      next: () => {
        // 2. Mise à jour instantanée de l'affichage (UI)
        // On filtre la liste locale pour enlever la feuille supprimée
        this.feuillesDeRoute = this.feuillesDeRoute.filter(f => f.idFeuille !== idFeuille);
        
        // 3. Si la feuille supprimée était celle en cours de consultation, on ferme la vue
        if (this.selectedFeuille && this.selectedFeuille.idFeuille === idFeuille) {
          this.selectedFeuille = null;
        }

        // 4. Notification et rafraîchissement des compteurs/disponibilités
        alert("Feuille de route et ressources libérées avec succès.");
        this.chargerDonnees(); 
      },
      error: (err) => {
        console.error("Erreur suppression feuille:", err);
        alert("Erreur lors de la suppression de la feuille de route.");
      }
    });
  }
}
// A. Ajoutez cette propriété en haut de votre classe
searchTerm: string = '';

// B. Ajoutez ce getter pour obtenir la liste filtrée
get feuillesFiltrees() {
  if (!this.searchTerm.trim()) {
    return this.feuillesDeRoute;
  }
  const term = this.searchTerm.toLowerCase();
  return this.feuillesDeRoute.filter(f => 
    f.chauffeur.nom.toLowerCase().includes(term) || 
    f.chauffeur.prenom.toLowerCase().includes(term)
  );
}




}


