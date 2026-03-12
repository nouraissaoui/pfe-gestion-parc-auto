import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Plus besoin de Router si on ne fait pas de navigation manuelle complexe
import { GestionParcService } from '../gestion-parc.service';

@Component({
  selector: 'app-admin-dashborad',
  standalone: true, // Ajoutez standalone: true
  imports: [CommonModule, FormsModule, RouterModule], // Retrait du Layout ici !
  templateUrl: './admin-dashborad.component.html',
  styleUrl: './admin-dashborad.component.css'
})
export class AdminDashboradComponent implements OnInit {
  // Vos variables restent identiques
  totalVehicules = 0;
  missionsEnCours = 0;
  vehiculesDisponibles = 0;
  declarationsEnAttente = 0;
  maintenanceEnAttente = 0;
  
  chefId = 0;
  localId = 0;
  stats: any[] = [];

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    this.loadSession();
    this.loadStats();
  }

  loadSession() {
    const userJson = localStorage.getItem('user');
    if(userJson) {
      const user = JSON.parse(userJson);
      this.chefId = user.idChefParc;
      this.localId = user.idLocal;
    }
  }

  loadStats() {
    // Note : Pour un ADMIN, vous voudrez peut-être passer null ou 0 
    // pour récupérer les stats de TOUS les locaux à l'avenir.
    this.service.getTotalVehicules(this.localId).subscribe(data => {
      this.totalVehicules = data;
      this.updateStats();
    });
    // ... Gardez le reste de vos appels service ici ...
  }

  updateStats() {
    this.stats = [
      { label: 'Total Véhicules', value: this.totalVehicules, icon: '🚗', footer: 'Flotte complète' },
      { label: 'Missions en Cours', value: this.missionsEnCours, icon: '📍', footer: 'Actives aujourd\'hui' },
      { label: 'Véhicules Disponibles', value: this.vehiculesDisponibles, icon: '✅', footer: 'Prêts à l\'emploi' },
      { label: 'Déclarations', value: this.declarationsEnAttente, icon: '⚠️', footer: 'À traiter' },
      { label: 'Maintenances', value: this.maintenanceEnAttente, icon: '🔧', footer: 'Programmées' }
    ];
  }
}