import { Component, OnInit } from '@angular/core';
import { Entretien, GestionParcService, Vehicule } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entretiens',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  submitted = false;

  idLocal!: number;
  idChef!: number;
  today = new Date();

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

  chargerDonnees() {
    this.service.getEntretiensByLocal(this.idLocal).subscribe(data => {
      this.entretiens = data.sort((a, b) => (a.idEntretien ?? 0) - (b.idEntretien ?? 0));
      this.filtrer(this.categorieFiltre);
    });
    this.service.getVehiculesByLocal(this.idLocal).subscribe(v => this.listeVehicules = v);
    this.service.getGarages().subscribe(g => this.garages = g);
  }

  filtrer(cat: string) {
    this.categorieFiltre = cat;
    const base = cat === 'TOUT'
      ? this.entretiens
      : this.entretiens.filter(e => e.categorie === cat);
    this.filteredEntretiens = base.sort((a, b) => (a.idEntretien ?? 0) - (b.idEntretien ?? 0));
  }

  // ── Helpers de validation ──
  isDateInvalid(): boolean {
    if (!this.nouveauEntretien.datePrevue) return true;
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return new Date(this.nouveauEntretien.datePrevue) < aujourdhui;
  }

  get errVehicule(): boolean {
    return this.submitted && !this.nouveauEntretien.idVehicule;
  }

  get errGarage(): boolean {
    return this.submitted && !this.nouveauEntretien.idGarage;
  }

  get errTypeTravaux(): boolean {
    return this.submitted && (!this.nouveauEntretien.typeEntretien || this.nouveauEntretien.typeEntretien.trim().length < 3);
  }

  get errDateVide(): boolean {
    return this.submitted && !this.nouveauEntretien.datePrevue;
  }

  get errDatePassee(): boolean {
    return this.submitted && !!this.nouveauEntretien.datePrevue && this.isDateInvalid();
  }

  get errObservations(): boolean {
    return this.submitted && (!this.nouveauEntretien.observations || this.nouveauEntretien.observations.trim().length < 5);
  }

  ouvrirModale() {
    this.submitted = false;
    this.isEditMode = false;
    this.nouveauEntretien = {
      idEntretien: null, typeEntretien: '', datePrevue: '',
      observations: '', idVehicule: null, idGarage: null,
      categorie: 'ENTRETIEN_PERIODIQUE'
    };
    this.showModal = true;
  }

  ouvrirModification(ent: Entretien) {
    this.submitted = false;
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

  fermerModal() {
    this.submitted = false;
    this.showModal = false;
  }

  enregistrerEntretien() {
    this.submitted = true;

    const formulaireValide =
      this.nouveauEntretien.idVehicule &&
      this.nouveauEntretien.idGarage &&
      this.nouveauEntretien.typeEntretien?.trim().length >= 3 &&
      !this.isDateInvalid() &&
      this.nouveauEntretien.observations?.trim().length >= 5;

    if (!formulaireValide) {
      return; // Les erreurs s'affichent inline sous chaque champ
    }

    if (this.isEditMode) {
      const vehiculeComplet = this.listeVehicules.find(v => v.idVehicule == this.nouveauEntretien.idVehicule);
      const garageComplet   = this.garages.find(g => g.idGarage == this.nouveauEntretien.idGarage);

      const entretienMaj: Partial<Entretien> = {
        idEntretien:   this.nouveauEntretien.idEntretien,
        typeEntretien: this.nouveauEntretien.typeEntretien,
        datePrevue:    this.nouveauEntretien.datePrevue,
        observations:  this.nouveauEntretien.observations,
        categorie:     this.nouveauEntretien.categorie as 'ENTRETIEN_PERIODIQUE' | 'ENTRETIEN_SUITE_DECLARATION',
        status:        'EN_ATTENTE' as 'EN_ATTENTE' | 'TRAITE' | 'REJETE',
        vehicule:      vehiculeComplet as Vehicule,
        garage:        garageComplet,
        chefDuParc:    { idChefParc: this.idChef }
      };

      this.service.updateEntretien(this.nouveauEntretien.idEntretien, entretienMaj).subscribe({
        next: () => {
          this.showModal = false;
          this.submitted = false;
          this.chargerDonnees();
          alert("✅ Modification effectuée avec succès.");
        },
        error: (err) => {
          console.error("Erreur détaillée :", err);
          alert("❌ Erreur lors de la modification.");
        }
      });

    } else {
      const payload = {
        typeEntretien: this.nouveauEntretien.typeEntretien,
        datePrevue:    this.nouveauEntretien.datePrevue,
        observations:  this.nouveauEntretien.observations,
        categorie:     'ENTRETIEN_PERIODIQUE'
      };

      this.service.planifierEntretienPeriodique(
        payload as any,
        this.nouveauEntretien.idVehicule!,
        this.nouveauEntretien.idGarage!,
        this.idChef
      ).subscribe({
        next: () => {
          this.showModal = false;
          this.submitted = false;
          this.chargerDonnees();
          alert("✅ Entretien périodique créé avec succès.");
        },
        error: (err) => {
          console.error("Erreur détaillée :", err);
          alert("❌ Erreur lors de la création.");
        }
      });
    }
  }

  ouvrirConsultation(ent: Entretien) { this.selectedEntretien = ent; this.showConsultModal = true; }
  fermerConsultation() { this.showConsultModal = false; }
  supprimer(id: number) {
    if (confirm("Supprimer?")) {
      this.service.deleteEntretien(id).subscribe(() => {
        this.chargerDonnees();
        alert("✅ Suppression effectuée avec succès.");
      });
    }
  }
  imprimerFiche() { window.print(); }
}