import { Component, OnInit } from '@angular/core';
import { GestionParcService, Local, Vehicule } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Adminlayoutcomponent } from "../adminlayoutcomponent/adminlayoutcomponent.component";

@Component({
  selector: 'app-vehicule',
  templateUrl: './vehicule.component.html',
  imports: [FormsModule, CommonModule, Adminlayoutcomponent],
  styleUrls: ['./vehicule.component.css'] // Assurez-vous d'avoir le fichier CSS
})
export class VehiculeComponent implements OnInit {
  vehicules: Vehicule[] = [];
  locaux: Local[] = [];
  
  // Liste des états pour le menu déroulant
  etatsPossibles = [
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'EN_MISSION', label: 'En Mission' },
    { value: 'EN_ENTRETIEN', label: 'En Entretien' },
    { value: 'INDISPONIBLE', label: 'Indisponible' }
  ];

  // Objet pour le formulaire (Ajout/Modif) avec image et etat par défaut
  currentVehicule: any = { 
    matricule: '', 
    marque: '', 
    modele: '', 
    annee: new Date().getFullYear(), 
    carburant: 'Diesel', 
    image: '', // Champ Image ajouté
    etat: 'DISPONIBLE' // État par défaut
  };
  
  selectedLocalId: number = 0;
  isEdit: boolean = false;
  showForm: boolean | undefined;
  showPreloader= true;

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

  // Si selectedLocalId est 0, on considère que c'est NULL
  const idLocalFinal = this.selectedLocalId == 0 ? null : this.selectedLocalId;

  if (this.isEdit) {
    // ASTUCE: Si idLocal est null, on appelle le service SANS le paramètre 
    // Pour contourner le 400 Bad Request sans changer le service.ts
    if (idLocalFinal === null) {
      // On utilise une petite ruse pour appeler l'URL sans ?idLocal=null
      // On cast en 'any' pour manipuler l'appel
      (this.service as any).http.put(`http://localhost:8080/api/gestion-parc/vehicule/${this.currentVehicule.idVehicule}`, this.currentVehicule)
        .subscribe({
          next: () => this.reinitialiser(),
          error: (err: any) => alert("Erreur : " + err.error)
        });
    } else {
      this.service.updateVehicule(this.currentVehicule.idVehicule, this.currentVehicule, idLocalFinal as any)
        .subscribe({
          next: () => this.reinitialiser(),
          error: (err) => alert("Erreur : " + err.error)
        });
    }
  } else {
    // Même logique pour l'ajout
    if (idLocalFinal === null) {
      (this.service as any).http.post(`http://localhost:8080/api/gestion-parc/vehicule`, this.currentVehicule)
        .subscribe({
          next: () => this.reinitialiser(),
          error: (err: any) => alert("Erreur : " + err.error)
        });
    } else {
      this.service.addVehicule(this.currentVehicule, idLocalFinal as any)
        .subscribe({
          next: () => this.reinitialiser(),
          error: (err) => alert("Erreur : " + err.error)
        });
    }
  }
}
preparerModif(v: any) {
  this.isEdit = true;
  this.currentVehicule = { ...v };
  this.selectedLocalId = v.local ? v.local.idLocal : 0;
  this.showForm = true; // Affiche le formulaire
  
  // Petit bonus : défiler automatiquement vers le formulaire
  setTimeout(() => {
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}
  supprimer(id: number) {
    if(confirm("Êtes-vous sûr de vouloir supprimer définitivement ce véhicule ?")) {
      this.service.deleteVehicule(id).subscribe(() => this.chargerVehicules());
    }
  }

  reinitialiser() {
    this.currentVehicule = { 
      matricule: '', 
      marque: '', 
      modele: '', 
      annee: new Date().getFullYear(), 
      carburant: 'Diesel', 
      image: '', 
      etat: 'DISPONIBLE' 
    };
    this.selectedLocalId = 0;
    this.isEdit = false;
    this.chargerVehicules();
  }
  // Ajoutez cette variable dans votre classe
vehiculeSelectionne: any = null;

// Ajoutez ces deux méthodes
ouvrirDetails(v: any) {
  this.vehiculeSelectionne = v;
}

fermerDetails() {
  this.vehiculeSelectionne = null;
}
// Dans votre classe VehiculeComponent :

vehiculeEnConsultation: any = null; // Stocke le véhicule à afficher

ouvrirConsultation(v: any) {
  this.vehiculeEnConsultation = v;
}

fermerConsultation() {
  this.vehiculeEnConsultation = null;
}


ouvrirFormulaireAjout() {
  this.isEdit = false;
  this.reinitialiser();
  this.showForm = true;
}
// Calcul du pourcentage de véhicules disponibles
get pourcentageDispo(): number {
  if (!this.vehicules || this.vehicules.length === 0) return 0;
  
  const dispo = this.vehicules.filter(v => v.etat === 'DISPONIBLE').length;
  const total = this.vehicules.length;
  
  // Calcul : (Nombre Dispo / Total) * 100
  return Math.round((dispo / total) * 100);
}

// Calcul du nombre de missions en cours
get nombreEnMission(): number {
  if (!this.vehicules) return 0;
  return this.vehicules.filter(v => v.etat === 'EN_MISSION').length;
}
get pourcentageMission(): number {
  if (!this.vehicules.length) return 0;
  return Math.round((this.vehicules.filter(v => v.etat === 'EN_MISSION').length / this.vehicules.length) * 100);
}

get pourcentageMaintenance(): number {
  if (!this.vehicules.length) return 0;
  return Math.round((this.vehicules.filter(v => v.etat === 'EN_ENTRETIEN').length / this.vehicules.length) * 100);
}
}