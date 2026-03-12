import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GestionParcService } from '../gestion-parc.service';

@Component({
  selector: 'app-chauffeur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chauffeur-dashboard.component.html',
  styleUrl: './chauffeur-dashboard.component.css'
})
export class ChauffeurDashboardComponent implements OnInit {
  // Stats spécifiques au chauffeur (ex: ses propres missions)
  stats: any[] = [];
  userId = 0;

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.userId = JSON.parse(userJson).id; // Assurez-vous du nom du champ ID
    }
    this.loadChauffeurStats();
  }

  loadChauffeurStats() {
    // Ici, appelez des méthodes spécifiques pour UN chauffeur 
    // Exemple fictif :
    this.stats = [
      { label: 'Mes Missions', value: 5, icon: '📑', footer: 'En attente', trendClass: '' },
      { label: 'Alertes Véhicule', value: 0, icon: '⚠️', footer: 'Tout est OK', trendClass: 'text-success' }
    ];
  }
}