import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GestionParcService } from '../gestion-parc.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChefParcLayoutComponent } from "../layouts/chef-parc-layout/chef-parc-layout.component";

@Component({
  selector: 'app-chef-parc-dashboard',
  imports: [CommonModule, FormsModule, RouterModule, ChefParcLayoutComponent],
  templateUrl: './chef-parc-dashboard.component.html',
  styleUrls: ['./chef-parc-dashboard.component.css']
})
export class ChefParcDashboardComponent implements OnInit {

  totalVehicules = 0;
  missionsEnCours = 0;
  vehiculesDisponibles = 0;
  declarationsEnAttente = 0;
  maintenanceEnAttente = 0;
  chefNom: string = '';
  chefPrenom: string = '';
  localNom: string = '';
  role: string='';

  chefId = 0;   // récupéré depuis la session
  localId = 0;  // récupéré depuis la session
  stats: any[] = [];

  constructor(
    private router: Router,
    private service: GestionParcService
  ) {}

 

  ngOnInit(): void {
    this.loadSession();
    this.loadStats();
  }

  loadSession() {
    const userJson = sessionStorage.getItem('user');
    if(userJson) {
      const user = JSON.parse(userJson);
      this.chefNom = user.nom;
      this.chefPrenom = user.prenom;
      this.chefId = user.idChefParc;
      this.localId = user.idLocal;
      this.role=user.role;
    }
  }

loadStats() {
  // 1. Total Véhicules (OK)
  this.service.getTotalVehicules(this.localId).subscribe(data => {
    this.totalVehicules = data;
    this.updateStats();
  });

  // 2. Missions en cours (OK)
  this.service.getMissionsEnCours(this.localId).subscribe(data => {
    this.missionsEnCours = data;
    this.updateStats();
  });

  // 3. Véhicules disponibles (OK)
  this.service.getVehiculesDisponibles(this.localId).subscribe(data => {
    this.vehiculesDisponibles = data;
    this.updateStats();
  });

  /**
   * CORRECTION : Déclarations en Attente
   * Note : Votre service possède 'getDeclarationsEnAttenteLocal(idLocal)' 
   * qui renvoie un tableau d'objets []. C'est plus fiable pour compter.
   */
  this.service.getDeclarationsEnAttenteLocal(this.localId).subscribe(data => {
    // Si data est un tableau, on prend sa longueur
    this.declarationsEnAttente = Array.isArray(data) ? data.length : data;
    this.updateStats();
  });

  /**
   * CORRECTION : Entretiens Programmés
   * Note : Votre service possède 'getEntretiensByLocal(idLocal)'
   * On compte combien d'entretiens sont programmés dans le local.
   */
  this.service.getEntretiensByLocal(this.localId).subscribe(data => {
    this.maintenanceEnAttente = Array.isArray(data) ? data.length : data;
    this.updateStats();
  });
}

  updateStats() {
    this.stats = [
      {
        label: 'Total Véhicules',
        value: this.totalVehicules,
        icon: '🚗',
        footer: 'Flotte complète',
        trend: '',
        trendClass: ''
      },
      {
        label: 'Missions en Cours',
        value: this.missionsEnCours,
        icon: '📍',
        footer: 'Actives aujourd\'hui',
        trend: '',
        trendClass: ''
      },
      {
        label: 'Véhicules Disponibles',
        value: this.vehiculesDisponibles,
        icon: '✅',
        footer: 'Prêts à l\'emploi',
        trend: '',
        trendClass: ''
      },
      {
        label: 'Déclarations en Attente',
        value: this.declarationsEnAttente,
        icon: '⚠️',
        footer: 'À traiter',
        trend: '',
        trendClass: ''
      },
      {
        label: 'Entretien Programmées',
        value: this.maintenanceEnAttente,
        icon: '🔧',
        footer: 'Programmées',
        trend: '',
        trendClass: ''
      }
    ];
  }
  activePage: string = 'dashboard';
  navigate(page: string) {
    this.activePage = page;
    this.router.navigate([`/${page}`]);
  }

  logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      sessionStorage.clear();
      this.router.navigate(['/']);
    }
  }
    goToVehicules() {
    this.router.navigate(['/vehicules']);
  }

  toggleMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar?.classList.toggle('active');
  }
  goToChatbot() {
  this.router.navigate(['chef-parc/chatbot']); // la route de ton composant chatbot
}
goToFuelPrediction() {
  this.router.navigate(['chef-parc/predire']); // route vers l'interface correspondante
}
}