import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GestionParcService } from '../gestion-parc.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

@Component({
  selector: 'app-chef-parc-dashboard',
  imports: [CommonModule,FormsModule],
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
    const userJson = localStorage.getItem('user');
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
    this.service.getTotalVehicules(this.localId).subscribe(data => {
      this.totalVehicules = data;
      this.updateStats();
    });

    this.service.getMissionsEnCours(this.localId).subscribe(data => {
      this.missionsEnCours = data;
      this.updateStats();
    });

    this.service.getVehiculesDisponibles(this.localId).subscribe(data => {
      this.vehiculesDisponibles = data;
      this.updateStats();
    });

    this.service.getDeclarationsEnAttente(this.chefId).subscribe(data => {
      this.declarationsEnAttente = data;
      this.updateStats();
    });

    this.service.getEntretiensEnAttente(this.chefId).subscribe(data => {
      this.maintenanceEnAttente = data;
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
        label: 'Maintenance en Attente',
        value: this.maintenanceEnAttente,
        icon: '🔧',
        footer: 'Programmées',
        trend: '',
        trendClass: ''
      }
    ];
  }

  navigate(page: string) {
    this.router.navigate([`/${page}`]);
  }

  logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      localStorage.clear();
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
}