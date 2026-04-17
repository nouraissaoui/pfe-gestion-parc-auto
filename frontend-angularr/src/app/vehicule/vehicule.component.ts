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
    if (!this.currentVehicule.matricule) {
      alert("Le matricule est obligatoire.");
      return;
    }

    const idLocalFinal = this.selectedLocalId == 0 ? null : this.selectedLocalId;

    if (this.isEdit) {
      // --- MODIFICATION ---
      if (idLocalFinal === null) {
        (this.service as any).http.put(`http://localhost:8080/api/gestion-parc/vehicule/${this.currentVehicule.idVehicule}`, this.currentVehicule)
          .subscribe({
            next: () => {
              alert("Modification effectuée avec succès !"); // Alerte Modif
              this.reinitialiser();
            },
            error: (err: any) => alert("Erreur : " + (err.error?.message || err.error))
          });
      } else {
        this.service.updateVehicule(this.currentVehicule.idVehicule, this.currentVehicule, idLocalFinal as any)
          .subscribe({
            next: () => {
              alert("Modification effectuée avec succès !"); // Alerte Modif
              this.reinitialiser();
            },
            error: (err) => alert("Erreur : " + (err.error?.message || err.error))
          });
      }
    } else {
      // --- AJOUT ---
      if (idLocalFinal === null) {
        (this.service as any).http.post(`http://localhost:8080/api/gestion-parc/vehicule`, this.currentVehicule)
          .subscribe({
            next: () => {
              alert("Ajout effectué avec succès !"); // Alerte Ajout
              this.reinitialiser();
            },
            error: (err: any) => alert("Erreur : " + (err.error?.message || err.error))
          });
      } else {
        this.service.addVehicule(this.currentVehicule, idLocalFinal as any)
          .subscribe({
            next: () => {
              alert("Ajout effectué avec succès !"); // Alerte Ajout
              this.reinitialiser();
            },
            error: (err) => alert("Erreur : " + (err.error?.message || err.error))
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

  reinitialiser() {
    this.currentVehicule = { 
      matricule: '', marque: '', modele: '', 
      annee: new Date().getFullYear(), carburant: 'Diesel', 
      image: '', etat: 'DISPONIBLE' 
    };
    this.selectedLocalId = 0;
    this.isEdit = false;
    this.showForm = false;
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
}