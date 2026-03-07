import { Component } from '@angular/core';
import { GestionParcService, Mission } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feuille-routechauffeur',
  imports: [FormsModule,CommonModule],
  templateUrl: './feuille-routechauffeur.component.html',
  styleUrl: './feuille-routechauffeur.component.css'
})
export class FeuilleRoutechauffeurComponent {
feuilles: any[] = [];
  idChauffeur = 7; // ID du chauffeur Ahmed
  missionSelectionnee: any = null;
    showPreloader = true;


  constructor(private chauffeurService: GestionParcService) {}

  ngOnInit() { this.chargerDonnees(); 
          setTimeout(() => this.showPreloader = false, 2500);

  }

  chargerDonnees() {
    this.chauffeurService.getMesFeuilles(this.idChauffeur).subscribe(res => this.feuilles = res);
  }

  selectionnerMission(mission: any) {
    this.missionSelectionnee = { ...mission };
  }
sauvegarder() {
  if (!this.missionSelectionnee) return;

  // Préparation des données propres
  const payload = {
    kmDepart: Number(this.missionSelectionnee.kmDepart),
    kmArrivee: Number(this.missionSelectionnee.kmArrivee),
    heureDepartReelle: this.missionSelectionnee.heureDepartReelle,
    heureArriveeReelle: this.missionSelectionnee.heureArriveeReelle,
    observations: this.missionSelectionnee.observations || ""
  };

  // Formatage HH:mm:ss pour LocalTime de Java
  if (payload.heureDepartReelle?.length === 5) payload.heureDepartReelle += ":00";
  if (payload.heureArriveeReelle?.length === 5) payload.heureArriveeReelle += ":00";

  this.chauffeurService.completerMission(this.missionSelectionnee.idMission, payload).subscribe({
    next: (res) => {
      alert("Mission complétée !");
      // Logique de rafraîchissement ici
    },
    error: (err) => {
      console.error("Erreur détaillée :", err);
      alert("Erreur : " + (err.error?.error || "Vérifiez les formats de données"));
    }
  });
}}