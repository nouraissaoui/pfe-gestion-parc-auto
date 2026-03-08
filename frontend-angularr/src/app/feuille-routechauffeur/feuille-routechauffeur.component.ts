import { Component, OnInit } from '@angular/core';
import { GestionParcService } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feuille-routechauffeur',
  standalone: true, // Ajouté pour la cohérence avec votre deuxième exemple
  imports: [FormsModule, CommonModule],
  templateUrl: './feuille-routechauffeur.component.html',
  styleUrl: './feuille-routechauffeur.component.css'
})
export class FeuilleRoutechauffeurComponent implements OnInit {
  feuilles: any[] = [];
  idChauffeur!: number; // Devient dynamique
  chauffeurNom: string = '';
  chauffeurPrenom: string = '';
  
  missionSelectionnee: any = null;
  showPreloader = true;
  loading = false; // Pour gérer les états de chargement des boutons

  constructor(private chauffeurService: GestionParcService) {}

  ngOnInit() {
    // 1. Gestion du préchargeur
    setTimeout(() => this.showPreloader = false, 2500);

    // 2. Récupération de l'utilisateur connecté via localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.idChauffeur = user.id;
      this.chauffeurNom = user.nom || '';
      this.chauffeurPrenom = user.prenom || '';

      // 3. Chargement des données uniquement si l'ID existe
      if (this.idChauffeur) {
        this.chargerDonnees();
      }
    }
  }

  chargerDonnees() {
    this.chauffeurService.getMesFeuilles(this.idChauffeur).subscribe({
      next: (res) => {
        this.feuilles = res;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des feuilles :", err);
      }
    });
  }

  selectionnerMission(mission: any) {
    // On crée une copie pour éviter de modifier la liste en direct avant sauvegarde
    this.missionSelectionnee = { ...mission };
    // Scroll fluide vers le formulaire si nécessaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  sauvegarder() {
    if (!this.missionSelectionnee) return;

    this.loading = true;

    // Préparation des données propres
    const payload = {
      kmDepart: Number(this.missionSelectionnee.kmDepart),
      kmArrivee: Number(this.missionSelectionnee.kmArrivee),
      heureDepartReelle: this.missionSelectionnee.heureDepartReelle,
      heureArriveeReelle: this.missionSelectionnee.heureArriveeReelle,
      observations: this.missionSelectionnee.observations || ""
    };

    // Formatage HH:mm:ss pour la compatibilité LocalTime Java
    if (payload.heureDepartReelle?.length === 5) payload.heureDepartReelle += ":00";
    if (payload.heureArriveeReelle?.length === 5) payload.heureArriveeReelle += ":00";

    this.chauffeurService.completerMission(this.missionSelectionnee.idMission, payload).subscribe({
      next: (res) => {
        alert("Mission complétée avec succès !");
        this.missionSelectionnee = null;
        this.chargerDonnees(); // Rafraîchir la liste après modification
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error("Erreur détaillée :", err);
        alert("Erreur : " + (err.error?.error || "Vérifiez les formats de données (Kilométrage ou Heures)"));
      }
    });
  }
}