import { Component, OnInit } from '@angular/core';
import { GestionParcService, Local, Vehicule } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Adminlayoutcomponent } from "../adminlayoutcomponent/adminlayoutcomponent.component";

@Component({
  selector: 'app-vehicule',
  standalone: true, // Ajouté pour la cohérence avec vos imports
  templateUrl: './vehicule.component.html',
  imports: [FormsModule, CommonModule, Adminlayoutcomponent],
  styleUrls: ['./vehicule.component.css']
})
export class VehiculeComponent implements OnInit {
  vehicules: Vehicule[] = [];
  locaux: Local[] = [];
  
  etatsPossibles = [
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'EN_MISSION', label: 'En Mission' },
    { value: 'EN_ENTRETIEN', label: 'En Entretien' },
    { value: 'INDISPONIBLE', label: 'Indisponible' }
  ];

  currentVehicule: any = { 
    matricule: '', 
    marque: '', 
    modele: '', 
    annee: new Date().getFullYear(), 
    carburant: 'Diesel', 
    image: '', 
    etat: 'DISPONIBLE' 
  };
  
  selectedLocalId: number = 0;
  isEdit: boolean = false;
  showForm: boolean | undefined;
  showPreloader = true;
  vehiculeSelectionne: any = null;
  vehiculeEnConsultation: any = null;

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    this.chargerVehicules();
    this.chargerLocaux();
    setTimeout(() => this.showPreloader = false, 2500);
  }

  chargerVehicules() {
    this.service.getAllVehicules().subscribe(data => this.vehicules = data);
  }

  chargerLocaux() {
    this.service.getAllLocaux().subscribe(data => this.locaux = data);
  }

  enregistrer() {
  if (this.isEdit) {
    // --- MODE MODIFICATION ---
    if (!this.validerFormulaire()) return;

    // On autorise le local 0 (Parc Central) uniquement en modification si besoin
    const idLocalFinal = this.selectedLocalId == 0 ? null : this.selectedLocalId;

    this.service.updateVehicule(this.currentVehicule.idVehicule, this.currentVehicule, idLocalFinal as any)
      .subscribe({
        next: () => {
          alert("Modification effectuée avec succès !");
          this.reinitialiser();
        },
        error: (err) => alert("Erreur lors de la modification : " + (err.error?.message || err.status))
      });

  } else {
    // --- MODE AJOUT (Affectation simple) ---
    
    // Vérification : Un véhicule ET un local doivent être choisis
    if (this.vehiculePourAjoutId == 0) {
      alert("Veuillez sélectionner un véhicule.");
      return;
    }
    if (this.selectedLocalId == 0) {
      alert("Veuillez sélectionner un local de destination.");
      return;
    }

    const vehiculeSelectionne = this.vehicules.find(v => v.idVehicule == this.vehiculePourAjoutId);
    
    if (vehiculeSelectionne) {
      // On envoie le véhicule avec l'ID du local sélectionné
      this.service.addVehicule(vehiculeSelectionne, this.selectedLocalId as any)
        .subscribe({
          next: () => {
            alert("Véhicule affecté avec succès au local !");
            this.reinitialiser();
          },
          error: (err) => alert("Erreur d'affectation : " + (err.error?.message || "Conflit d'affectation"))
        });
    }
  }
}
  supprimer(id: number) {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce véhicule ?")) {
      this.service.deleteVehicule(id).subscribe({
        next: () => {
          alert("Suppression effectuée avec succès !"); // Alerte Suppression
          this.chargerVehicules();
        },
        error: (err) => alert("Erreur lors de la suppression")
      });
    }
  }

  // --- Logique d'interface (inchangée) ---

  preparerModif(v: any) {
    this.isEdit = true;
    this.currentVehicule = { ...v };
    this.selectedLocalId = v.local ? v.local.idLocal : 0;
    this.showForm = true;
    setTimeout(() => {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
vehiculePourAjoutId: number = 0;
 reinitialiser() {
  // Reset de l'objet technique
  this.currentVehicule = { 
    matricule: '', 
    marque: '', 
    modele: '', 
    annee: new Date().getFullYear(), 
    carburant: 'Diesel', 
    image: '', 
    etat: 'DISPONIBLE' 
  };

  // Reset des sélections de listes déroulantes
  this.selectedLocalId = 0;
  this.vehiculePourAjoutId = 0;

  // Reset de l'interface
  this.formErrors = {};
  this.isEdit = false;
  this.showForm = false;

  // Actualisation de la liste principale
  this.chargerVehicules();
}
 ouvrirDetails(v: any) { this.vehiculeSelectionne = v; }
  fermerDetails() { this.vehiculeSelectionne = null; }
  ouvrirConsultation(v: any) { this.vehiculeEnConsultation = v; }
  fermerConsultation() { this.vehiculeEnConsultation = null; }
  ouvrirFormulaireAjout() { this.isEdit = false; this.reinitialiser(); this.showForm = true; }

  // --- Getters Statistiques ---
  get pourcentageDispo(): number {
    if (!this.vehicules || this.vehicules.length === 0) return 0;
    return Math.round((this.vehicules.filter(v => v.etat === 'DISPONIBLE').length / this.vehicules.length) * 100);
  }

  get nombreEnMission(): number {
    return this.vehicules ? this.vehicules.filter(v => v.etat === 'EN_MISSION').length : 0;
  }

  get pourcentageMission(): number {
    if (!this.vehicules.length) return 0;
    return Math.round((this.nombreEnMission / this.vehicules.length) * 100);
  }

  get pourcentageMaintenance(): number {
    if (!this.vehicules.length) return 0;
    return Math.round((this.vehicules.filter(v => v.etat === 'EN_ENTRETIEN').length / this.vehicules.length) * 100);
  }
  formErrors: any = {};

validerFormulaire(): boolean {
  this.formErrors = {};
  let valide = true;

  const matriculeRegex = /^\d{3} TN \d{4}$/;
  const lettresRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;

  if (!this.currentVehicule.matricule || !matriculeRegex.test(this.currentVehicule.matricule)) {
    this.formErrors.matricule = 'Format requis : 200-TN-1234';
    valide = false;
  }

  if (!this.currentVehicule.marque || !lettresRegex.test(this.currentVehicule.marque)) {
    this.formErrors.marque = 'La marque ne doit contenir que des lettres.';
    valide = false;
  }

  if (!this.currentVehicule.modele || !lettresRegex.test(this.currentVehicule.modele)) {
    this.formErrors.modele = 'Le modèle ne doit contenir que des lettres.';
    valide = false;
  }

  const annee = Number(this.currentVehicule.annee);
  const anneeActuelle = new Date().getFullYear();
  if (!annee || annee < 1900 || annee > anneeActuelle) {
    this.formErrors.annee = `L'année doit être entre 1900 et ${anneeActuelle}.`;
    valide = false;
  }

  return valide;
}
}