import { Component, OnInit } from '@angular/core';
import { GestionParcService, Vehicule } from '../gestion-parc.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-affectation-mission',
  imports: [CommonModule, FormsModule],
  templateUrl: './affectation-mission.component.html',
  styleUrl: './affectation-mission.component.css'
})
export class AffectationMissionComponent implements OnInit {

  // ── Données ────────────────────────────────────────────────────────────────
  chauffeursDispo: any[]    = [];
  vehiculesDispo: Vehicule[] = [];
  feuillesDeRoute: any[]    = [];
  selectedFeuille: any      = null;

  selectedChauffeur!: number;
  selectedVehicule!: number;
  typeMission: 'EMPLOYE' | 'MATERIEL' = 'EMPLOYE';
  vehiculeVerrouille = false;

  missionData = {
    dateMission:        new Date().toISOString().split('T')[0],
    pointDepart:        '',
    destination:        '',
    heureDepartPrevue:  '',
    description:        '',
    bandePrelevement:   '',
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  /** true si le formulaire a été soumis au moins une fois (active les messages d'erreur) */
  formSubmitted = false;

  /** Erreurs métier personnalisées (en plus des validateurs Angular) */
  errors: Record<string, string> = {};

  // ── Navigation feuilles ────────────────────────────────────────────────────
  currentViewDate = new Date();
  showAllMissions  = false;
  searchTerm       = '';
  editingMissionId: number | null = null;

  constructor(private service: GestionParcService) {}

  ngOnInit(): void { this.chargerDonnees(); }

  // ── Chargement ─────────────────────────────────────────────────────────────
  chargerDonnees(): void {
    const idLocalStr = localStorage.getItem('idLocal');
    if (!idLocalStr) { console.error('Aucun idLocal trouvé'); return; }
    const idLocal = Number(idLocalStr);

    this.service.getChauffeursParLocal(idLocal).subscribe({
      next: (res) => {
        this.chauffeursDispo = res.filter(
          c => c.etatChauffeur === 'DISPONIBLE' || c.etatChauffeur === 'EN_MISSION'
        );
      }
    });

    this.service.getVehiculesByLocal(idLocal).subscribe({
      next: (res) => { this.vehiculesDispo = res.filter(v => v.etat === 'DISPONIBLE'); },
      error: (err) => console.error('Erreur Véhicules', err)
    });

    this.service.getFeuillesDeRoute(idLocal).subscribe(
      res => this.feuillesDeRoute = res
    );
  }

  // ── Validation métier ──────────────────────────────────────────────────────

  /** Valide tous les champs et remplit this.errors. Retourne true si valide. */
  private validate(): boolean {
    this.errors = {};

    // Chauffeur
    if (!this.selectedChauffeur) {
      this.errors['chauffeur'] = 'Veuillez sélectionner un chauffeur.';
    }

    // Véhicule
    if (!this.selectedVehicule) {
      this.errors['vehicule'] = 'Veuillez sélectionner un véhicule.';
    }

    // Point de départ
    const depart = this.missionData.pointDepart.trim();
    if (!depart) {
      this.errors['pointDepart'] = 'Le point de départ est obligatoire.';
    } else if (depart.length < 3) {
      this.errors['pointDepart'] = 'Le point de départ doit contenir au moins 3 caractères.';
    }

    // Destination
    const dest = this.missionData.destination.trim();
    if (!dest) {
      this.errors['destination'] = 'La destination est obligatoire.';
    } else if (dest.length < 3) {
      this.errors['destination'] = 'La destination doit contenir au moins 3 caractères.';
    } else if (dest.toLowerCase() === depart.toLowerCase()) {
      this.errors['destination'] = 'La destination doit être différente du point de départ.';
    }

    // Heure de départ
    if (!this.missionData.heureDepartPrevue) {
      this.errors['heure'] = "L'heure de départ est obligatoire.";
    }

    // Bande de prélèvement (si MATERIEL)
    if (this.typeMission === 'MATERIEL') {
      const bande = this.missionData.bandePrelevement.trim();
      if (!bande) {
        this.errors['bande'] = 'La bande de prélèvement est obligatoire pour un transport matériel.';
      } else if (bande.length < 5) {
        this.errors['bande'] = 'Veuillez détailler le contenu (minimum 5 caractères).';
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  /** Appelé à chaque changement de champ pour mise à jour instantanée des erreurs */
  validateField(field: string): void {
    if (!this.formSubmitted) return;
    this.validate(); // revalide tout et met à jour this.errors
  }

  hasError(field: string): boolean {
    return this.formSubmitted && !!this.errors[field];
  }

  // ── Soumission ─────────────────────────────────────────────────────────────
  validerAffectation(): void {
    this.formSubmitted = true;

    if (!this.validate()) return; // stoppe si erreurs

    const idChef = Number(localStorage.getItem('id'));

    this.service.affecterMission(
      this.missionData,
      this.selectedChauffeur,
      this.selectedVehicule,
      idChef
    ).subscribe({
      next: () => {
        this.formSubmitted = false;
        this.errors = {};
        this.resetForm();
        this.chargerDonnees();
        // Remplace alert() par un feedback visuel (voir HTML)
        this.showSuccessToast('Mission affectée avec succès !');
      },
      error: (err) => this.showErrorToast('Erreur : ' + (err.error?.message || err.message))
    });
  }

  // ── Toast feedback ─────────────────────────────────────────────────────────
  toast: { msg: string; type: 'success' | 'error' } | null = null;

  showSuccessToast(msg: string): void {
    this.toast = { msg, type: 'success' };
    setTimeout(() => this.toast = null, 3500);
  }

  showErrorToast(msg: string): void {
    this.toast = { msg, type: 'error' };
    setTimeout(() => this.toast = null, 4000);
  }

  // ── Chauffeur change ───────────────────────────────────────────────────────
  onChauffeurChange(idChauffeur: number): void {
    const chauffeur = this.chauffeursDispo.find(c => c.idChauffeur == idChauffeur);
    if (chauffeur?.etatChauffeur === 'EN_MISSION') {
      const garder = confirm(
        `${chauffeur.nom} est en mission avec ${chauffeur.vehicule.matricule}.\n` +
        `Conserver ce véhicule ? (OK = oui, Annuler = choisir un autre)`
      );
      this.vehiculeVerrouille = garder;
      this.selectedVehicule   = garder ? chauffeur.vehicule.idVehicule : undefined!;
    } else {
      this.vehiculeVerrouille = false;
    }
    // Révalide si formulaire déjà soumis
    if (this.formSubmitted) this.validate();
  }

  onTypeChange(): void {
    if (this.typeMission === 'EMPLOYE') this.missionData.bandePrelevement = '';
    if (this.formSubmitted) this.validate();
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  resetForm(): void {
    this.missionData = {
      dateMission:       new Date().toISOString().split('T')[0],
      pointDepart:       '',
      destination:       '',
      heureDepartPrevue: '',
      description:       '',
      bandePrelevement:  '',
    };
    this.typeMission        = 'EMPLOYE';
    this.selectedChauffeur  = undefined!;
    this.selectedVehicule   = undefined!;
    this.vehiculeVerrouille = false;
    this.formSubmitted      = false;
    this.errors             = {};
  }

  // ── Feuilles de route ──────────────────────────────────────────────────────
  selectFeuille(feuille: any): void {
    this.selectedFeuille = feuille;
    this.currentViewDate = new Date();
    this.showAllMissions = false;
  }

  get filteredMissions() {
    if (!this.selectedFeuille?.missions) return [];
    if (this.showAllMissions) return this.selectedFeuille.missions;
    return this.selectedFeuille.missions.filter(
      (m: any) => new Date(m.dateMission).toDateString() === this.currentViewDate.toDateString()
    );
  }

  get feuillesFiltrees() {
    if (!this.searchTerm.trim()) return this.feuillesDeRoute;
    const t = this.searchTerm.toLowerCase();
    return this.feuillesDeRoute.filter(f =>
      f.chauffeur.nom.toLowerCase().includes(t) ||
      f.chauffeur.prenom.toLowerCase().includes(t)
    );
  }

  navigateDate(days: number): void {
    const d = new Date(this.currentViewDate);
    d.setDate(d.getDate() + days);
    this.currentViewDate = d;
    this.showAllMissions = false;
  }

  toggleAllMissions(): void { this.showAllMissions = !this.showAllMissions; }

  supprimerMission(id: number): void {
    if (!confirm('Supprimer cette mission du carnet ?')) return;
    this.service.deleteMission(id).subscribe({
      next: () => {
        if (this.selectedFeuille?.missions) {
          this.selectedFeuille.missions = this.selectedFeuille.missions.filter(
            (m: any) => m.idMission !== id
          );
        }
        this.chargerDonnees();
        this.showSuccessToast('Mission supprimée.');
      },
      error: () => this.showErrorToast('Erreur lors de la suppression.')
    });
  }

  supprimerFeuilleDeRoute(idFeuille: number): void {
    if (!confirm('Supprimer cette feuille et toutes ses missions ?')) return;
    this.service.deleteFeuilleDeRoute(idFeuille).subscribe({
      next: () => {
        this.feuillesDeRoute = this.feuillesDeRoute.filter(f => f.idFeuille !== idFeuille);
        if (this.selectedFeuille?.idFeuille === idFeuille) this.selectedFeuille = null;
        this.chargerDonnees();
        this.showSuccessToast('Feuille de route supprimée.');
      },
      error: () => this.showErrorToast('Erreur lors de la suppression.')
    });
  }

  isMissionModifiable(m: any): boolean { return !m.heureArriveeReelle && !m.kmArrivee; }

  modifierMission(m: any): void {
    if (!this.isMissionModifiable(m)) {
      this.showErrorToast('Cette mission est terminée et ne peut plus être modifiée.');
      return;
    }
    this.editingMissionId = m.idMission;
  }

  sauvegarderModificationDirecte(m: any): void {
    this.service.modifierMission(m.idMission, m).subscribe({
      next: () => {
        this.editingMissionId = null;
        this.chargerDonnees();
        this.showSuccessToast('Mission mise à jour !');
      },
      error: () => this.showErrorToast('Erreur lors de la mise à jour.')
    });
  }

  annulerEditionDirecte(): void { this.editingMissionId = null; }

  ouvrirConsultation(feuille: any): void { this.selectFeuille(feuille); }
}