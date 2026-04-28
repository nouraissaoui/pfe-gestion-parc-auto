import { Component, OnInit } from '@angular/core';
import { GestionParcService } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feuille-routechauffeur',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './feuille-routechauffeur.component.html',
  styleUrl: './feuille-routechauffeur.component.css'
})
export class FeuilleRoutechauffeurComponent implements OnInit {

  feuilles: any[] = [];
  idChauffeur!: number;
  chauffeurNom: string = '';
  chauffeurPrenom: string = '';

  missionSelectionnee: any = null;
  showPreloader = true;
  loading = false;

  // ── Erreurs de validation ──
  errors: {
    kmDepart: string;
    kmArrivee: string;
    heureDepartReelle: string;
    heureArriveeReelle: string;
    observations: string;
  } = this.emptyErrors();

  constructor(private chauffeurService: GestionParcService) {}

  /* ════════════════════════════════
      Lifecycle
  ════════════════════════════════ */

  ngOnInit(): void {
    setTimeout(() => this.showPreloader = false, 2500);

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.idChauffeur = user.id;
      this.chauffeurNom = user.nom || '';
      this.chauffeurPrenom = user.prenom || '';
      if (this.idChauffeur) this.chargerDonnees();
    }
  }

  /* ════════════════════════════════
      Data
  ════════════════════════════════ */

  chargerDonnees(): void {
    this.chauffeurService.getMesFeuilles(this.idChauffeur).subscribe({
      next: (res) => { this.feuilles = res; },
      error: (err) => console.error('Erreur lors du chargement des feuilles :', err)
    });
  }

  selectionnerMission(mission: any): void {
    this.missionSelectionnee = { ...mission };
    this.errors = this.emptyErrors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ════════════════════════════════
      Helpers
  ════════════════════════════════ */

  private emptyErrors() {
    return { kmDepart: '', kmArrivee: '', heureDepartReelle: '', heureArriveeReelle: '', observations: '' };
  }

  /* ════════════════════════════════
      Validation
  ════════════════════════════════ */

  validateKmDepart(): boolean {
    const val = this.missionSelectionnee?.kmDepart;
    if (val === null || val === undefined || String(val).trim() === '') {
      this.errors.kmDepart = 'Le kilométrage de départ est obligatoire.';
      return false;
    }
    if (isNaN(Number(val)) || Number(val) < 0) {
      this.errors.kmDepart = 'Valeur numérique positive requise.';
      return false;
    }
    if (!Number.isInteger(Number(val))) {
      this.errors.kmDepart = 'Veuillez saisir un nombre entier.';
      return false;
    }
    this.errors.kmDepart = '';
    return true;
  }

  validateKmArrivee(): boolean {
    const val = this.missionSelectionnee?.kmArrivee;
    const dep = this.missionSelectionnee?.kmDepart;
    if (val === null || val === undefined || String(val).trim() === '') {
      this.errors.kmArrivee = "Le kilométrage d'arrivée est obligatoire.";
      return false;
    }
    if (isNaN(Number(val)) || Number(val) < 0) {
      this.errors.kmArrivee = 'Valeur numérique positive requise.';
      return false;
    }
    if (!Number.isInteger(Number(val))) {
      this.errors.kmArrivee = 'Veuillez saisir un nombre entier.';
      return false;
    }
    if (dep !== null && dep !== undefined && Number(val) <= Number(dep)) {
      this.errors.kmArrivee = 'Le KM arrivée doit être supérieur au KM départ.';
      return false;
    }
    this.errors.kmArrivee = '';
    return true;
  }

  validateHeureDepartReelle(): boolean {
    const val = this.missionSelectionnee?.heureDepartReelle;
    if (!val || !String(val).trim()) {
      this.errors.heureDepartReelle = "L'heure de départ réelle est obligatoire.";
      return false;
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(val)) {
      this.errors.heureDepartReelle = 'Format invalide. Utilisez HH:mm.';
      return false;
    }
    this.errors.heureDepartReelle = '';
    return true;
  }

  validateHeureArriveeReelle(): boolean {
    const val = this.missionSelectionnee?.heureArriveeReelle;
    const dep = this.missionSelectionnee?.heureDepartReelle;
    if (!val || !String(val).trim()) {
      this.errors.heureArriveeReelle = "L'heure d'arrivée réelle est obligatoire.";
      return false;
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(val)) {
      this.errors.heureArriveeReelle = 'Format invalide. Utilisez HH:mm.';
      return false;
    }
    if (dep && val <= dep) {
      this.errors.heureArriveeReelle = "L'heure d'arrivée doit être après l'heure de départ.";
      return false;
    }
    this.errors.heureArriveeReelle = '';
    return true;
  }

  validateObservations(): boolean {
    const val = this.missionSelectionnee?.observations?.trim();
    if (!val) {
      this.errors.observations = 'Les observations sont obligatoires.';
      return false;
    }
    if (/^\d+$/.test(val)) {
      this.errors.observations = 'Veuillez saisir une observation valide (pas uniquement des chiffres).';
      return false;
    }
    if (val.length < 5) {
      this.errors.observations = 'Minimum 5 caractères requis.';
      return false;
    }
    this.errors.observations = '';
    return true;
  }

  isFormValid(): boolean {
    const k1 = this.validateKmDepart();
    const k2 = this.validateKmArrivee();
    const h1 = this.validateHeureDepartReelle();
    const h2 = this.validateHeureArriveeReelle();
    const o  = this.validateObservations();
    return k1 && k2 && h1 && h2 && o;
  }

  get hasAnyError(): boolean {
    return !!(
      this.errors.kmDepart ||
      this.errors.kmArrivee ||
      this.errors.heureDepartReelle ||
      this.errors.heureArriveeReelle ||
      this.errors.observations
    );
  }

  /* ════════════════════════════════
      Sauvegarde
  ════════════════════════════════ */

  sauvegarder(): void {
    if (!this.missionSelectionnee) return;
    if (!this.isFormValid()) return;

    this.loading = true;

    const payload = {
      kmDepart: Number(this.missionSelectionnee.kmDepart),
      kmArrivee: Number(this.missionSelectionnee.kmArrivee),
      heureDepartReelle: this.missionSelectionnee.heureDepartReelle,
      heureArriveeReelle: this.missionSelectionnee.heureArriveeReelle,
      observations: this.missionSelectionnee.observations || ''
    };

    // Formatage HH:mm:ss pour la compatibilité LocalTime Java
    if (payload.heureDepartReelle?.length === 5) payload.heureDepartReelle += ':00';
    if (payload.heureArriveeReelle?.length === 5) payload.heureArriveeReelle += ':00';

    this.chauffeurService.completerMission(this.missionSelectionnee.idMission, payload).subscribe({
      next: () => {
        alert('Mission complétée avec succès !');
        this.missionSelectionnee = null;
        this.errors = this.emptyErrors();
        this.chargerDonnees();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur détaillée :', err);
        alert('Erreur : ' + (err.error?.error || 'Vérifiez les formats de données (Kilométrage ou Heures)'));
      }
    });
  }
}