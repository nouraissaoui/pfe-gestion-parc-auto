import { Component, OnInit } from '@angular/core';
import { GestionParcService, Mission } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type FilterType = 'all' | 'live' | 'done';
type SortType   = 'date-desc' | 'date-asc' | 'depart-asc';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './missions.component.html',
  styleUrls: ['./missions.component.css']
})
export class MissionsComponent implements OnInit {

  missions: any[]  = [];
  filtered:  any[]  = [];
  loading:   boolean = true;

  // Toolbar state
  searchQuery:   string     = '';
  activeFilter:  FilterType = 'all';
  sortOrder:     SortType   = 'date-desc';
  searchFocused: boolean    = false;

  private readonly MOIS = [
    'Jan','Fév','Mar','Avr','Mai','Jun',
    'Jul','Aoû','Sep','Oct','Nov','Déc'
  ];

  constructor(private missionService: GestionParcService) {}
 showPreloader = true;
ngOnInit(): void {
  setTimeout(() => this.showPreloader = false, 2500);
  console.log("1. Initialisation du composant Missions...");
  const userData = sessionStorage.getItem('user');
  console.log("2. Données sessionStorage.getItem :", userData);

  if (userData) {
    const user = JSON.parse(userData);
    // On vérifie toutes les possibilités d'ID
    const id = user.id || user.idChauffeur || user.idLocal; 
    console.log("3. ID Chauffeur identifié :", id);

    if (id) {
      this.loadMissions(id);
    } else {
      console.error("ERREUR : ID introuvable dans l'objet user");
      this.loading = false;
    }
  } else {
    console.error("ERREUR : Aucun utilisateur dans le sessionStorage.getItem");
    this.loading = false;
  }
}

  // ── Chargement ──────────────────────────────────────────────
loadMissions(id: number): void {
  this.loading = true; // Déclenche le spinner si tu en as un
  
  this.missionService.getMissionsByChauffeur(id).subscribe({
    next: (res: Mission[]) => {
      console.log("7. Missions reçues du backend :", res);
      
      // Le backend renvoie maintenant directement le tableau [ {mission1}, ... ]
      // Plus besoin de chercher dans res.missions ou res.feuilleDeRoute
      this.missions = res;

      this.applyFilters();
      this.loading = false;
    },
    error: (err) => {
      console.error("Erreur lors de la récupération :", err);
      this.missions = [];
      this.filtered = [];
      this.loading = false;
    }
  });
}

  // ── Statut d'une mission ────────────────────────────────────
  // Logique : si heureArriveeReelle → Terminée, sinon → En cours
  getStatus(m: any): 'live' | 'done' {
    if (m.heureArriveeReelle) return 'done';
    return 'live';
  }

  getStatusLabel(m: any): string {
    return this.getStatus(m) === 'done' ? 'Terminée' : 'En Cours';
  }

  // ── Progression trajet (pour la barre connecteur) ──────────
  getProgress(m: any): number {
    return this.getStatus(m) === 'done' ? 100 : 55;
  }

  // ── Mois formaté ───────────────────────────────────────────
  getMonthLabel(dateStr: string): string {
    if (!dateStr) return '';
    const idx = parseInt(dateStr.substring(5, 7), 10) - 1;
    return this.MOIS[idx] ?? '';
  }

  // ── Compteurs ───────────────────────────────────────────────
  countByStatus(s: 'wait' | 'live' | 'done'): number {
    return this.missions.filter(m => this.getStatus(m) === s).length;
  }

  // ── Filtres + Recherche + Tri ───────────────────────────────
  setFilter(f: FilterType): void {
    this.activeFilter = f;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.missions];

    // Filtre statut
    if (this.activeFilter !== 'all') {
      result = result.filter(m => this.getStatus(m) === this.activeFilter);
    }

    // Recherche texte
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(m =>
        m.pointDepart?.toLowerCase().includes(q)         ||
        m.destination?.toLowerCase().includes(q)         ||
        m.vehicule?.matricule?.toLowerCase().includes(q) ||
        m.vehicule?.marque?.toLowerCase().includes(q)    ||
        m.bandePrelevement?.toLowerCase().includes(q)    ||
        String(m.idMission).includes(q)
      );
    }

    // Tri
    switch (this.sortOrder) {
      case 'date-desc':
        result.sort((a, b) => (b.dateMission ?? '').localeCompare(a.dateMission ?? ''));
        break;
      case 'date-asc':
        result.sort((a, b) => (a.dateMission ?? '').localeCompare(b.dateMission ?? ''));
        break;
      case 'depart-asc':
        result.sort((a, b) => (a.pointDepart ?? '').localeCompare(b.pointDepart ?? ''));
        break;
    }

    this.filtered = result;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery  = '';
    this.activeFilter = 'all';
    this.sortOrder    = 'date-desc';
    this.applyFilters();
  }
}