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
  chauffeurs: Chauffeur[] = [];
  locaux: Local[] = [];
  
  isEditMode = false;
  showConsultModal = false;
  showForm = false;
  selectedChauffeur: any = null;

  chauffeurForm: any = this.resetModel();

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees() {
    this.service.getAllChauffeurs().subscribe(data => this.chauffeurs = data);
    this.service.getAllLocaux().subscribe(data => this.locaux = data);
  }

  // --- Getters pour les statistiques ---
  get totalDisponible(): number {
    return this.chauffeurs.filter(c => c.etatChauffeur === 'DISPONIBLE').length;
  }

  get totalEnMission(): number {
    return this.chauffeurs.filter(c => c.etatChauffeur === 'EN_MISSION').length;
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

  enregistrer() {
    if (this.isEditMode && this.chauffeurForm.idChauffeur) {
      this.service.updateChauffeur(this.chauffeurForm.idChauffeur, this.chauffeurForm).subscribe(() => this.finirAction());
    } else {
      this.service.addChauffeur(this.chauffeurForm).subscribe(() => this.finirAction());
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

  supprimer(id: number | undefined) {
    if (id && confirm('Confirmer la suppression ?')) {
      this.service.deleteChauffeur(id).subscribe(() => this.chargerDonnees());
    }
  }

  finirAction() {
    this.showForm = false;
    this.isEditMode = false;
    this.chauffeurForm = this.resetModel();
    this.chargerDonnees();
  }
  // Vérifie si la date d'expiration est proche (moins de 30 jours)
isPermisEnDanger(dateExpiration: string | undefined | null): boolean {
  // 1. Sécurité : Si la date n'existe pas, on ne déclenche pas d'alerte
  if (!dateExpiration) {
    return false;
  }

  // 2. À ce stade, TS sait que dateExpiration est forcément une string
  const exp = new Date(dateExpiration);
  
  // Vérification si la date est valide (au cas où la string soit mal formatée)
  if (isNaN(exp.getTime())) {
    return false;
  }

  const aujourdhui = new Date();
  const diffTime = exp.getTime() - aujourdhui.getTime();
  
  // Conversion en jours
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Retourne vrai si l'expiration est dans 30 jours ou déjà passée (<= 30)
  return diffDays <= 30;
}
}