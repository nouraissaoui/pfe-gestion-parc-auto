import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { LocauxadminService } from './locauxadmin.service';
import { Adminlayoutcomponent } from "../adminlayoutcomponent/adminlayoutcomponent.component";

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

  constructor(private service: LocauxadminService) {}

  ngOnInit() {
    this.load();
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
  // Vérifier que tous les champs sont remplis
  const { nomLocal, adresse, region, ville, images } = this.newLocal;
  if (!nomLocal || !adresse || !region || !ville || !images) {
    alert("Veuillez remplir tous les champs avant d'ajouter un local !");
    return; // arrêter la fonction si un champ est vide
  }

  const payload = { ...this.newLocal };
  this.service.add(payload).subscribe({
    next: () => {
      alert("Ajout OK");
      // Réinitialiser le formulaire
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

  /******** EDIT ********/
  startEdit(l: any) {
    this.editLocal = { ...l };
  }

  saveEdit() {
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



}
