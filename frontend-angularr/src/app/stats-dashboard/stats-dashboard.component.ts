import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionParcService, Vehicule } from '../gestion-parc.service';
import { Adminlayoutcomponent } from "../adminlayoutcomponent/adminlayoutcomponent.component";

Chart.register(...registerables);

@Component({
  selector: 'app-stats-dashboard',
  templateUrl: './stats-dashboard.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, Adminlayoutcomponent],
  styleUrls: ['./stats-dashboard.component.css']
})
export class StatsDashboardComponent implements OnInit {
  vehicules: Vehicule[] = [];
  
  // On centralise les stats pour plus de clarté
  stats = {
    total: 0,
    dispo: 0,
    mission: 0,
    entretien: 0,
    indisponible: 0,
    sansLocal: 0
  };

  selectedVehicule?: Vehicule;
  rapportIA = "";
  today: Date = new Date(); // Initialisation de la date
  idLocal = "PRÉFECTURE-01"; // Exemple pour le template

  private chartInstance?: Chart; // Pour éviter les bugs de superposition

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    this.showSplash();
    this.loadVehicules();
  }

  showSplash() {
    const splash = document.getElementById('splash');
    if (splash) {
      setTimeout(() => { 
        splash.style.opacity = '0'; 
        setTimeout(() => splash.style.display = 'none', 1000); 
      }, 2000);
    }
  }

  loadVehicules() {
    this.service.getAllVehicules().subscribe(data => {
      this.vehicules = data;
      this.calculateStats(data);
      setTimeout(() => this.createLuxuryChart(), 300);
    });
  }

  calculateStats(data: Vehicule[]) {
    this.stats.total = data.length;
    this.stats.dispo = data.filter(v => v.etat === 'DISPONIBLE').length;
    this.stats.mission = data.filter(v => v.etat === 'EN_MISSION').length;
    this.stats.entretien = data.filter(v => v.etat === 'EN_ENTRETIEN').length;
    this.stats.indisponible = data.filter(v => v.etat === 'INDISPONIBLE').length;
    this.stats.sansLocal = data.filter(v => !v.local).length;
  }

  createLuxuryChart() {
    const ctx = document.getElementById('luxuryDoughnutChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Détruire l'ancien graphique si il existe
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Disponible', 'Mission', 'Entretien', 'Indisponible', 'Sans Local'],
        datasets: [{
          data: [
            this.stats.dispo, 
            this.stats.mission, 
            this.stats.entretien, 
            this.stats.indisponible, 
            this.stats.sansLocal
          ],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'],
          hoverOffset: 30,
          borderWidth: 0,
          borderRadius: 10,
          spacing: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '82%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#4a0404',
            titleColor: '#c5a059',
            padding: 15,
            displayColors: true
          }
        },
        animation: { animateScale: true, animateRotate: true }
      }
    });
  }

  // Action pour le bouton Actualiser
  refreshData() {
    this.loadVehicules();
  }

  openReport(v: Vehicule) {
    this.selectedVehicule = v;
    if (!v.local) this.rapportIA = "CRITIQUE : Véhicule non assigné. Risque de perte de traçabilité élevé.";
    else if (v.etat === 'DISPONIBLE') this.rapportIA = "ANALYSE : Rendement optimal. Prochaine révision suggérée dans 5000km.";
    else if (v.etat === 'EN_MISSION') this.rapportIA = "SUIVI : Trajet en cours. Télémétrie moteur stable.";
    else if (v.etat === 'EN_ENTRETIEN') this.rapportIA = "MAINTENANCE : Intervention sur système hydraulique. Fin prévue : 18h.";
    else this.rapportIA = "ALERTE : Panne système détectée. Diagnostic expert requis immédiatement.";
  }

  closeReport() { this.selectedVehicule = undefined; }
  printReport() { window.print(); }
  highlight(index: number) { /* Optionnel : pour animer le chart au survol de la légende */ }
}