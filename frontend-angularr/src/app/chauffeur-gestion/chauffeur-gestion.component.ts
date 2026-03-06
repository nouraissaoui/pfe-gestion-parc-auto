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
openFicheModal() {
throw new Error('Method not implemented.');
}
  chauffeurs: Chauffeur[] = [];
  locaux: Local[] = [];
  showPreloader = true; 
  isEditMode = false;
  showConsultModal = false;
  showForm = false;
  selectedChauffeur: any = null;
  searchTerm: string = ''; // Pour la recherche

  chauffeurForm: any = this.resetModel();
showFicheModal: any;

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    this.chargerDonnees();

    // Simulation du temps de chargement pour le preloader prestige
    setTimeout(() => {
      this.showPreloader = false;
    }, 3000); 
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

  get pourcentageDispo(): number {
    if (this.chauffeurs.length === 0) return 0;
    return Math.round((this.totalDisponible / this.chauffeurs.length) * 100);
  }

  // Getter pour filtrer la table sans accents pour éviter les erreurs Lexer
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
  showFormModal = false;

openFormModal() {
  this.showFormModal = true;
  // éventuellement réinitialiser le formulaire si ce n'est pas une édition
}

closeFormModal() {
  this.showFormModal = false;
  this.isEditMode = false; // reset du mode édition
  // réinitialiser le formulaire si besoin
}


}