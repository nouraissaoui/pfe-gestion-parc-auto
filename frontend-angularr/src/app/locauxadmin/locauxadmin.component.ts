  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { HttpClientModule } from '@angular/common/http';
  import { interval, Subscription } from 'rxjs';
 import { Adminlayoutcomponent } from "../adminlayoutcomponent/adminlayoutcomponent.component";
import { GestionParcService } from '../gestion-parc.service';

  @Component({
    selector: 'app-locauxadmin',
    templateUrl: './locauxadmin.component.html',
    styleUrls: ['./locauxadmin.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule, Adminlayoutcomponent],
  })
  export class LocauxadminComponent implements OnInit {

    locals: any[] = [];
    mode = 'list';
    editLocal: any = null;

    newLocal = {
      nomLocal: '',
      adresse: '',
      region: '',
      ville: '',
      images: ''  // chaîne séparée par espaces ou virgules
    };

    // index pour le slider
    imageIndexes: number[] = [];
showPreloader= true;

    constructor(private service: GestionParcService) {}

    ngOnInit() {
      this.load();
            setTimeout(() => this.showPreloader = false, 2500);

    }

    load() {
      this.service.getAll().subscribe(res => {
        this.locals = res.map(l => {
          const imgs: string[] = (l.images || '').split(' ').map(x => x.trim()).filter(x => x);
          return {
            ...l,
            imagesArray: imgs,
            currentImage: imgs[0] || 'https://via.placeholder.com/300x200',
            
          };
        });

        // Initialiser les index pour le slider
        this.imageIndexes = this.locals.map(_ => 0);

        // Lancer le slider automatique
        this.startImageSlider();
      });
    }

    /******** SLIDER AUTOMATIQUE ********/
    startImageSlider() {
      setInterval(() => {
        this.locals.forEach((l, i) => {
          if (l.imagesArray.length > 1) {
            this.imageIndexes[i] = (this.imageIndexes[i] + 1) % l.imagesArray.length;
            l.currentImage = l.imagesArray[this.imageIndexes[i]] + '?t=' + new Date().getTime();
          }
        });
      }, 3000); // changer toutes les 3 secondes
    }

    /******** ADD ********/
    /******** ADD ********/
  add() {
  if (!this.validerAdd()) return;

  const payload = { ...this.newLocal };
  this.service.add(payload).subscribe({
    next: () => {
      alert("Ajout OK");
      this.newLocal = { nomLocal: '', adresse: '', region: '', ville: '', images: '' };
      setTimeout(() => this.load(), 100);
      this.mode = 'list';
    },
    error: err => {
      console.error("Erreur ajout:", err);
      alert("Erreur lors de l'ajout !");
    }
  });
}

saveEdit() {
  if (!this.validerEdit()) return;

  const payload = { ...this.editLocal };
  this.service.update(this.editLocal.idLocal, payload).subscribe({
    next: () => {
      alert("Modifié !");
      this.editLocal = null;
      setTimeout(() => this.load(), 100);
    },
    error: err => {
      console.error("Erreur modification:", err);
      alert("Erreur lors de la modification !");
    }
  });
}

    /******** DELETE ********/
    delete(id: number) {
    if (confirm("Supprimer ?")) {
      this.service.delete(id).subscribe({
        next: () => this.load(),
        error: err => {
          console.error("Erreur DELETE :", err);
          alert(err.error || "Erreur serveur lors de la suppression !");
        }
      });
    }
  }getRegionCount(): number {
    const regions = this.locals.map(l => l.region);
    return new Set(regions).size;
  }

modalTop: number = 0;
modalLeft: number = 0;


startEdit(local: any, event: MouseEvent): void {
  this.editLocal = { ...local };

  setTimeout(() => {
    const panelWidth = 520;
    const panelHeight = 580;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Toujours centré dans la fenêtre
    this.modalLeft = scrollX + (window.innerWidth / 2) - (panelWidth / 2);
    this.modalTop  = scrollY + (window.innerHeight / 2) - (panelHeight / 2);

    // Ne pas dépasser en haut
    if (this.modalTop < scrollY + 20) this.modalTop = scrollY + 20;
  }, 0);
}formErrors: any = {};
editFormErrors: any = {};

validerAdd(): boolean {
  this.formErrors = {};
  let valide = true;
  const lettresRegex = /^[a-zA-ZÀ-ÿ\s\-'0-9]+$/;
const lettresPuresRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;

 if (!this.newLocal.nomLocal || this.newLocal.nomLocal.trim() === '') {
  this.formErrors.nomLocal = 'Le nom est obligatoire.';
  valide = false;
}

if (!this.newLocal.adresse || this.newLocal.adresse.trim().length < 5) {
  this.formErrors.adresse = 'L\'adresse doit contenir au moins 5 caractères.';
  valide = false;
}

 if (!this.newLocal.ville || !lettresPuresRegex.test(this.newLocal.ville.trim())) {
  this.formErrors.ville = 'La ville ne doit contenir que des lettres.';
  valide = false;
}

if (!this.newLocal.region || !lettresPuresRegex.test(this.newLocal.region.trim())) {
  this.formErrors.region = 'La région ne doit contenir que des lettres.';
  valide = false;
}

  if (!this.newLocal.images || this.newLocal.images.trim() === '') {
    this.formErrors.images = 'Au moins une image est obligatoire.';
    valide = false;
  }

  return valide;
}

validerEdit(): boolean {
  this.editFormErrors = {};
  let valide = true;
  const lettresRegex = /^[a-zA-ZÀ-ÿ\s\-'0-9]+$/;
  const lettresPuresRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;

  if (!this.editLocal.nomLocal || !lettresRegex.test(this.editLocal.nomLocal)) {
    this.editFormErrors.nomLocal = 'Le nom est obligatoire.';
    valide = false;
  }

  if (!this.editLocal.adresse || this.editLocal.adresse.trim().length < 5) {
    this.editFormErrors.adresse = 'L\'adresse doit contenir au moins 5 caractères.';
    valide = false;
  }

 if (!this.editLocal.ville || !lettresPuresRegex.test(this.editLocal.ville.trim())) {
  this.editFormErrors.ville = 'La ville ne doit contenir que des lettres.';
  valide = false;
}

if (!this.editLocal.region || !lettresPuresRegex.test(this.editLocal.region.trim())) {
  this.editFormErrors.region = 'La région ne doit contenir que des lettres.';
  valide = false;
}

  if (!this.editLocal.images || this.editLocal.images.trim() === '') {
    this.editFormErrors.images = 'Au moins une image est obligatoire.';
    valide = false;
  }

  return valide;
}}