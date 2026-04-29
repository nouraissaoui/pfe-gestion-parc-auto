import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { GestionParcService } from '../gestion-parc.service';

@Component({
  selector: 'app-driver-menu',
  standalone: true,
  imports: [CommonModule, DatePipe,RouterModule],
  templateUrl: './driver-menu.component.html',
  styleUrl: './driver-menu.component.css'
})
export class DriverMenuComponent implements OnInit {

  // ── Infos chauffeur ──────────────────────────────────────────
  Nom:    string = '';
  Prenom: string = '';
  role:   string = '';
  idChauffeur: number = 0;
  region: string = '';
  etatChauffeur: string = '';

  // ── Données dynamiques ───────────────────────────────────────
  todayDate: Date = new Date();
  missionsCount: number = 0;
  kmParcourus: number = 0;
  missionsActives: number = 0;

  // ── Chargement ───────────────────────────────────────────────
  isLoading: boolean = true;

  // ── Dates formatées manuellement (évite les pb de locale) ────
  private readonly MOIS_FR = [
    'janvier','février','mars','avril','mai','juin',
    'juillet','août','septembre','octobre','novembre','décembre'
  ];

  get todayFormatted(): string {
    const d = this.todayDate;
    const jour  = String(d.getDate()).padStart(2, '0');
    const mois  = this.MOIS_FR[d.getMonth()];
    const annee = d.getFullYear();
    return `${jour} ${mois} ${annee}`;
  }

  get todayShort(): string {
    const d = this.todayDate;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  }

  constructor(
    private router: Router,
    private service: GestionParcService
  ) {}

  ngOnInit(): void {
    this.loadDriverSession();
  }

  loadDriverSession(): void {
    const userJson = sessionStorage.getItem('user');
    if (userJson) {
      const user       = JSON.parse(userJson);
      this.Nom         = user.nom    ?? '';
      this.Prenom      = user.prenom ?? '';
      this.role        = user.role   ?? 'Chauffeur';
      this.idChauffeur = user.id     ?? user.idChauffeur ?? 0;

      if (this.idChauffeur) {
        this.loadMissions();
      } else {
        this.isLoading = false;
      }
    } else {
      this.isLoading = false;
    }
  }

  /**
   * Récupère les missions du chauffeur via le service,
   * puis calcule le nombre total et les km parcourus aujourd'hui.
   */
loadMissions(): void {
  this.service.getMissionsByChauffeur(this.idChauffeur).subscribe({
    next: (res: any) => {
      // On récupère le tableau peu importe le format du backend
      const missions = Array.isArray(res) ? res : (res.missions || []);
      
      // 1. Compteur Total (Affichera 3 d'après ton JSON)
      this.missionsCount = missions.length;

      // 2. Compteur "Aujourd'hui" (On élargit pour le test)
      // Au lieu de filtrer par date stricte, on prend tout pour vérifier l'UI
      this.missionsActives = missions.length; 

      // 3. Calcul des KM (Cumul de toutes les missions terminées)
      this.kmParcourus = missions.reduce((total: number, m: any) => {
        if (m.kmArrivee && m.kmDepart) {
          return total + (m.kmArrivee - m.kmDepart);
        }
        return total;
      }, 0);

      this.isLoading = false;
    },
    error: () => this.isLoading = false
  });
}

  /**
   * Retourne le label de la zone du chauffeur.
   * Priorité : région issue des missions > région stockée en session > défaut
   */
  get zoneLabel(): string {
    return this.region || 'Zone Nord';
  }

  /**
   * Retourne le label d'état de la session chauffeur.
   */
  get sessionLabel(): string {
    return this.etatChauffeur === 'EN_MISSION' ? 'En Mission' : 'Session Active';
  }

  /**
   * Retourne la couleur du badge selon l'état.
   */
  get sessionColor(): string {
    return this.etatChauffeur === 'EN_MISSION' ? 'orange' : 'green';
  }

  /**
   * Retourne les km affichés (arrondi à l'entier).
   */
  get kmDisplay(): string {
    return this.kmParcourus > 0 ? Math.round(this.kmParcourus).toString() : '0';
  }

  /**
   * Retourne le tag missions pour la carte action.
   */
  get missionTag(): string {
    if (this.missionsActives === 0) return 'Aucune mission ce jour';
    if (this.missionsActives === 1) return '1 mission aujourd\'hui';
    return `${this.missionsActives} missions aujourd'hui`;
  }

  navigate(path: string): void {
    this.router.navigate([`/chauffeur/${path}`]);
  }
}