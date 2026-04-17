import { Component, OnInit } from '@angular/core';
import { GestionParcService, Vehicule } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consultation-feuilles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-feuilles.component.html',
  styleUrl: './consultation-feuilles.component.css'
})
export class ConsultationFeuillesComponent implements OnInit {
  selectedFeuille: any;
  chauffeursDispo: any[] = [];
  vehiculesDispo: Vehicule[] = [];
  feuillesDeRoute: any[] = [];
  
  // Variables de vue et recherche
  currentViewDate: Date = new Date();
  showAllMissions: boolean = false;
  editingMissionId: number | null = null;
  searchTerm: string = '';

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

    // 1. Récupérer les Chauffeurs
    this.service.getChauffeursParLocal(idLocal).subscribe({
      next: (res) => {
        this.chauffeursDispo = res.filter(c => 
          c.etatChauffeur === 'DISPONIBLE' || c.etatChauffeur === 'EN_MISSION'
        );
      }
    });

    // 2. Récupérer les Véhicules
    this.service.getVehiculesByLocal(idLocal).subscribe({
      next: (res) => {
        this.vehiculesDispo = res.filter(v => v.etat === 'DISPONIBLE');
      },
      error: (err) => console.error("Erreur Véhicules", err)
    });

    // 3. Charger les feuilles de route
    this.service.getFeuillesDeRoute(idLocal).subscribe(res => {
      this.feuillesDeRoute = res;
    });
  }

  // --- GESTION DE LA CONSULTATION ---

  selectFeuille(feuille: any) {
    this.selectedFeuille = feuille;
    this.currentViewDate = new Date(); 
    this.showAllMissions = false;
  }

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

  // --- MODIFICATION ET SUPPRESSION ---

  isMissionModifiable(m: any): boolean {
    return !m.heureArriveeReelle && !m.kmArrivee;
  }

  modifierMission(m: any) {
    if (!this.isMissionModifiable(m)) {
      alert("Cette mission est déjà terminée et ne peut plus être modifiée.");
      return;
    }
    this.editingMissionId = m.idMission;
  }

  sauvegarderModificationDirecte(m: any) {
    this.service.modifierMission(m.idMission, m).subscribe({
      next: () => {
        this.editingMissionId = null;
        alert("Mission mise à jour !");
        this.chargerDonnees();
      },
      error: (err) => alert("Erreur lors de la mise à jour")
    });
  }

  annulerEditionDirecte() {
    this.editingMissionId = null;
  }

  supprimerMission(id: number): void {
    if (confirm("Supprimer cette mission du carnet ?")) {
      this.service.deleteMission(id).subscribe({
        next: () => {
          if (this.selectedFeuille && this.selectedFeuille.missions) {
            this.selectedFeuille.missions = this.selectedFeuille.missions.filter(
              (m: any) => m.idMission !== id
            );
          }
          this.chargerDonnees();
          alert("Mission supprimée avec succès.");
        },
        error: (err) => alert("Erreur lors de la suppression : " + err.message)
      });
    }
  }

  supprimerFeuilleDeRoute(idFeuille: number): void {
    if (confirm("Attention : Supprimer cette feuille de route supprimera également TOUTES les missions associées. Confirmer ?")) {
      this.service.deleteFeuilleDeRoute(idFeuille).subscribe({
        next: () => {
          this.feuillesDeRoute = this.feuillesDeRoute.filter(f => f.idFeuille !== idFeuille);
          if (this.selectedFeuille && this.selectedFeuille.idFeuille === idFeuille) {
            this.selectedFeuille = null;
          }
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

  ouvrirConsultation(_t75: any) {
    // Logique à implémenter si nécessaire pour ouvrir une vue spécifique
    throw new Error('Method not implemented.');
  }
}