import { Component, OnInit } from '@angular/core';
import { Entretien, GestionParcService, Vehicule } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entretiens',
  standalone: true,
  imports: [CommonModule, FormsModule], // Ajoutez les imports nécessaires
  templateUrl: './entretiens.component.html',
  styleUrl: './entretiens.component.css'
})
export class EntretiensComponent implements OnInit {
  entretiens: Entretien[] = [];
  filteredEntretiens: Entretien[] = [];
  listeVehicules: Vehicule[] = [];
  garages: any[] = [];
  
  showModal = false;
  showConsultModal = false;
  isEditMode = false;
  selectedEntretien: Entretien | null = null;
  categorieFiltre = 'TOUT';
  
  idLocal!: number;
  idChef!: number;
  today = new Date();

  // Objet de formulaire
  nouveauEntretien: any = {
    idEntretien: null,
    typeEntretien: '',
    datePrevue: '',
    observations: '',
    idVehicule: null,
    idGarage: null,
    categorie: 'ENTRETIEN_PERIODIQUE'
  };

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    this.idLocal = user.idLocal;
    this.idChef = user.id;
    this.chargerDonnees();
  }

 /* chargerDonnees() {
    this.service.getEntretiensByLocal(this.idLocal).subscribe(data => {
      this.entretiens = data;
      this.filtrer(this.categorieFiltre);
    });
    this.service.getVehiculesByLocal(this.idLocal).subscribe(v => this.listeVehicules = v);
    this.service.getGarages().subscribe(g => this.garages = g);
  }*/
chargerDonnees() {
  this.service.getEntretiensByLocal(this.idLocal).subscribe(data => {
    // Tri par idEntretien croissant → le plus récent en dernier
    this.entretiens = data.sort((a, b) => (a.idEntretien ?? 0) - (b.idEntretien ?? 0));
    this.filtrer(this.categorieFiltre);
  });
  this.service.getVehiculesByLocal(this.idLocal).subscribe(v => this.listeVehicules = v);
  this.service.getGarages().subscribe(g => this.garages = g);
}

 /* filtrer(cat: string) {
    this.categorieFiltre = cat;
    this.filteredEntretiens = cat === 'TOUT' ? this.entretiens : this.entretiens.filter(e => e.categorie === cat);
  }*/
filtrer(cat: string) {
  this.categorieFiltre = cat;
  const base = cat === 'TOUT' 
    ? this.entretiens 
    : this.entretiens.filter(e => e.categorie === cat);
  
  this.filteredEntretiens = base.sort((a, b) => (a.idEntretien ?? 0) - (b.idEntretien ?? 0));
}

  ouvrirModale() {
    this.isEditMode = false;
    this.nouveauEntretien = { idEntretien: null, typeEntretien: '', datePrevue: '', observations: '', idVehicule: null, idGarage: null, categorie: 'ENTRETIEN_PERIODIQUE' };
    this.showModal = true;
  }

  ouvrirModification(ent: Entretien) {
    this.isEditMode = true;
    this.nouveauEntretien = {
      idEntretien: ent.idEntretien,
      typeEntretien: ent.typeEntretien,
      datePrevue: ent.datePrevue,
      observations: ent.observations,
      idVehicule: ent.vehicule?.idVehicule,
      idGarage: ent.garage?.idGarage,
      categorie: ent.categorie
    };
    this.showModal = true;
  }

enregistrerEntretien() {

    console.log("Vehicule:", this.nouveauEntretien.idVehicule);
  console.log("Garage:", this.nouveauEntretien.idGarage);

  if(!this.nouveauEntretien.idGarage){
    alert("Veuillez sélectionner un garage");
    return;
  }
  if (this.isEditMode) {
    // --- MODE MODIFICATION ---
    
    // 1. On retrouve les objets complets car le Backend attend l'entité, pas juste l'ID
    const vehiculeComplet = this.listeVehicules.find(v => v.idVehicule == this.nouveauEntretien.idVehicule);
    const garageComplet = this.garages.find(g => g.idGarage == this.nouveauEntretien.idGarage);

    // 2. On construit l'objet Entretien tel que défini dans votre entité Java
    /*const entretienMaj = {
      idEntretien: this.nouveauEntretien.idEntretien,
      typeEntretien: this.nouveauEntretien.typeEntretien,
      datePrevue: this.nouveauEntretien.datePrevue,
      observations: this.nouveauEntretien.observations,
      categorie: this.nouveauEntretien.categorie,
      
      // TRÈS IMPORTANT : Correction de l'erreur "status cannot be null"
      status: 'EN_ATTENTE', 
      
      // Relations objets
      vehicule: vehiculeComplet,
      garage: garageComplet,
      
      // On garde le lien avec le chef (Vérifiez si l'ID dans l'entité est idChefParc)
      chefDuParc: { idChefParc: this.idChef } 
    };*/
    const entretienMaj: Partial<Entretien> = {
  idEntretien: this.nouveauEntretien.idEntretien,
  typeEntretien: this.nouveauEntretien.typeEntretien,
  datePrevue: this.nouveauEntretien.datePrevue,
  observations: this.nouveauEntretien.observations,
  categorie: this.nouveauEntretien.categorie as 'ENTRETIEN_PERIODIQUE' | 'ENTRETIEN_SUITE_DECLARATION',
  status: 'EN_ATTENTE' as 'EN_ATTENTE' | 'TRAITE' | 'REJETE',  // ← cast explicite
  vehicule: vehiculeComplet as Vehicule,
  garage: garageComplet,
  chefDuParc: { idChefParc: this.idChef }
};

    this.service.updateEntretien(this.nouveauEntretien.idEntretien, entretienMaj).subscribe({
      next: () => {
        this.showModal = false;
        this.chargerDonnees();
        alert("modification avec succes"); // Message de modification
      },
      error: (err) => {
        console.error("Erreur détaillée :", err);
        alert("Erreur lors de la modification. Vérifiez que tous les champs sont remplis.");
      }
    });

  } else {
    // --- MODE CRÉATION ---
    const payload = {
      typeEntretien: this.nouveauEntretien.typeEntretien,
      datePrevue: this.nouveauEntretien.datePrevue,
      observations: this.nouveauEntretien.observations,
      categorie: 'ENTRETIEN_PERIODIQUE'
    };

    this.service.planifierEntretienPeriodique(
      payload as any, 
      this.nouveauEntretien.idVehicule!, 
      this.nouveauEntretien.idGarage!, 
      this.idChef
    ).subscribe(() => {
      this.showModal = false;
      this.chargerDonnees();
      alert("insertion de entretien periodique avec succees"); // Message d'insertion
    });
  }
}

  // ... (ouvrirConsultation, supprimer, imprimerFiche restent identiques)
  ouvrirConsultation(ent: Entretien) { this.selectedEntretien = ent; this.showConsultModal = true; }
  fermerConsultation() { this.showConsultModal = false; }
  supprimer(id: number) { if(confirm("Supprimer?")) this.service.deleteEntretien(id).subscribe(() => this.chargerDonnees());alert("suppression avec succees"); }
  imprimerFiche() { window.print(); }
}