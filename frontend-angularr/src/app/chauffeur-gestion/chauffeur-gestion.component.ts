import { Component, OnInit } from '@angular/core';
import { Chauffeur, Local, GestionParcService } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Adminlayoutcomponent } from "../adminlayoutcomponent/adminlayoutcomponent.component";

@Component({
  selector: 'app-chauffeur-gestion',
  standalone: true,
  imports: [FormsModule, CommonModule, Adminlayoutcomponent],
  templateUrl: './chauffeur-gestion.component.html',
  styleUrls: ['./chauffeur-gestion.component.css']
})
export class ChauffeurGestionComponent implements OnInit {
  // ... (vos propriétés existantes)
  chauffeurs: Chauffeur[] = [];
  locaux: Local[] = [];
  showPreloader = true; 
  isEditMode = false;
  showConsultModal = false;
  showForm = false;
  selectedChauffeur: any = null;
  searchTerm: string = '';
  chauffeurForm: any = this.resetModel();
  showFicheModal: any;
  showFormModal = false;

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    this.chargerDonnees();
    setTimeout(() => { this.showPreloader = false; }, 3000); 
  }

  chargerDonnees() {
    this.service.getAllChauffeurs().subscribe(data => this.chauffeurs = data);
    this.service.getAllLocaux().subscribe(data => this.locaux = data);
  }

  // --- Actions avec alertes de succès ---
enregistrer() {
  if (!this.validerFormulaire()) return;

  console.log("Données envoyées au backend :", this.chauffeurForm);

  if (this.isEditMode && this.chauffeurForm.idChauffeur) {
    this.service.updateChauffeur(this.chauffeurForm.idChauffeur, this.chauffeurForm).subscribe({
      next: () => {
        alert('Modification effectuée avec succès !');
        this.finirAction();
      },
      error: (err) => {
        console.error("Erreur Backend :", err);
        alert("Erreur lors de la modification. Vérifiez les champs.");
      }
    });
  } else {
    this.service.addChauffeur(this.chauffeurForm).subscribe({
      next: () => {
        alert('Ajout effectué avec succès !');
        this.finirAction();
      },
      error: (err) => {
        console.error("Erreur Backend :", err);
        alert("Erreur lors de l'ajout. Un champ obligatoire est peut-être vide.");
      }
    });
  }
}
  supprimer(id: number | undefined) {
    if (id && confirm('Confirmer la suppression ?')) {
      this.service.deleteChauffeur(id).subscribe(() => {
        alert('Suppression effectuée avec succès !'); // Alerte Suppression
        this.chargerDonnees();
      });
    }
  }

  // --- Reste de votre logique (inchangée) ---

  get totalDisponible(): number {
    return this.chauffeurs.filter(c => c.etatChauffeur === 'DISPONIBLE').length;
  }

  get totalEnMission(): number {
    return this.chauffeurs.filter(c => c.etatChauffeur === 'EN_MISSION').length;
  }

  get pourcentageDispo(): number {
    if (this.chauffeurs.length === 0) return 0;
    return Math.round((this.totalDisponible / this.chauffeurs.length) * 100);
  }

  get chauffeursFiltres() {
    const search = this.searchTerm.toLowerCase().trim();
    return this.chauffeurs.filter(c => {
      if (!search) return true;
      return (
        (c.nom?.toLowerCase() || '').includes(search) || 
        (c.prenom?.toLowerCase() || '').includes(search) || 
        (c.region?.toLowerCase() || '').includes(search) || 
        (c.typeVehiculePermis?.toLowerCase() || '').includes(search)
      );
    });
  }

  resetModel() {
    return {
      nom: '', prenom: '', mail: '', motDePasse: '', region: '',
      anciennete: 0, datePriseLicense: '', dateExpirationPermis: '',
      typeVehiculePermis: 'B', etatChauffeur: 'DISPONIBLE', local: null
    };
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.isEditMode = false;
      this.chauffeurForm = this.resetModel();
    }
  }

  editer(c: Chauffeur) {
    this.isEditMode = true;
    this.showForm = true;
    this.chauffeurForm = { ...c };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  consulter(id: number | undefined) {
    if (id) {
      this.service.getChauffeurById(id).subscribe(data => {
        this.selectedChauffeur = data;
        this.showConsultModal = true;
      });
    }
  }

  finirAction() {
    this.showForm = false;
    this.isEditMode = false;
    this.chauffeurForm = this.resetModel();
    this.chargerDonnees();
    this.closeFormModal();
  }

  isPermisEnDanger(dateExpiration: string | undefined | null): boolean {
    if (!dateExpiration) return false;
    const exp = new Date(dateExpiration);
    if (isNaN(exp.getTime())) return false;
    const aujourdhui = new Date();
    const diffTime = exp.getTime() - aujourdhui.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }

  exporterDonnees() {
    const entetes = ["Nom", "Prenom", "Region", "Permis", "Expiration", "Statut"];
    const lignes = this.chauffeursFiltres.map(c => [
      c.nom, c.prenom, c.region, c.typeVehiculePermis, c.dateExpirationPermis, c.etatChauffeur
    ]);
    let csvContent = "data:text/csv;charset=utf-8," 
      + entetes.join(",") + "\n" 
      + lignes.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `flotte_agil.csv`);
    link.click();
  }

  openFormModal() { this.showFormModal = true; }
  closeFormModal() { this.showFormModal = false; this.isEditMode = false; }
  openFicheModal() { throw new Error('Method not implemented.'); }
  formErrors: any = {};

validerFormulaire(): boolean {
  this.formErrors = {};
  let valide = true;

  const nomRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  const emailRegex = /^[a-zA-ZÀ-ÿ]+\.[a-zA-ZÀ-ÿ]+@agil\.com\.tn$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^()\-_])[A-Za-z\d@$!%*?&.#^()\-_]{8,}$/;

  if (!this.chauffeurForm.nom || !nomRegex.test(this.chauffeurForm.nom)) {
    this.formErrors.nom = 'Le nom ne doit contenir que des lettres.';
    valide = false;
  }

  if (!this.chauffeurForm.prenom || !nomRegex.test(this.chauffeurForm.prenom)) {
    this.formErrors.prenom = 'Le prénom ne doit contenir que des lettres.';
    valide = false;
  }

  if (!this.chauffeurForm.mail || !emailRegex.test(this.chauffeurForm.mail)) {
    this.formErrors.mail = 'Format requis : prenom.nom@agil.com.tn';
    valide = false;
  }

  if (!this.isEditMode) {
    if (!this.chauffeurForm.motDePasse || !passwordRegex.test(this.chauffeurForm.motDePasse)) {
      this.formErrors.motDePasse = 'Min. 8 caractères avec majuscule, minuscule, chiffre et caractère spécial.';
      valide = false;
    }
  }

  if (!this.chauffeurForm.region || !this.chauffeurForm.region.trim()) {
    this.formErrors.region = 'La région est obligatoire.';
    valide = false;
  }

  const anciennete = Number(this.chauffeurForm.anciennete);
  if (!Number.isInteger(anciennete) || anciennete < 0) {
    this.formErrors.anciennete = 'L\'ancienneté doit être un nombre entier positif ou zéro.';
    valide = false;
  }

  if (!this.chauffeurForm.datePriseLicense) {
    this.formErrors.datePriseLicense = 'La date d\'obtention du permis est obligatoire.';
    valide = false;
  }

  if (!this.chauffeurForm.dateExpirationPermis) {
    this.formErrors.dateExpirationPermis = 'La date d\'expiration du permis est obligatoire.';
    valide = false;
  }

  if (
    this.chauffeurForm.datePriseLicense &&
    this.chauffeurForm.dateExpirationPermis &&
    new Date(this.chauffeurForm.dateExpirationPermis) <= new Date(this.chauffeurForm.datePriseLicense)
  ) {
    this.formErrors.dateExpirationPermis = 'La date d\'expiration doit être après la date d\'obtention.';
    valide = false;
  }

  return valide;
}
}