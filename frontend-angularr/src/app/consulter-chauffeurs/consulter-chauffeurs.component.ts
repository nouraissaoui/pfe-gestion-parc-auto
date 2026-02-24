import { Component, OnInit } from '@angular/core'; // Ajuste le chemin
import { GestionParcService } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consulter-chauffeurs',
  templateUrl: './consulter-chauffeurs.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./consulter-chauffeurs.component.css']
})
export class ConsulterChauffeursComponent implements OnInit {
  chauffeurs: any[] = [];
  filteredChauffeurs: any[] = [];
  idLocal: number | null = null;
  stats = { total: 0, dispo: 0, mission: 0, conge: 0 };

  constructor(private chauffeurService: GestionParcService) {} // Injection du service

  ngOnInit(): void {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    this.idLocal = userData.idLocal;
    
    if (this.idLocal) {
      this.loadData();
    }
  }

  loadData() {
    this.chauffeurService.getChauffeursByLocal(this.idLocal!).subscribe({
      next: (data) => {
        this.chauffeurs = data;
        this.filteredChauffeurs = data;
        this.calculateStats();
      },
      error: (err) => console.error('Erreur lors du chargement des chauffeurs', err)
    });
  }

  changeEtat(id: number, event: any) {
    const nouvelEtat = event.target.value;
    this.chauffeurService.updateEtatChauffeur(id, nouvelEtat).subscribe({
      next: () => {
        // Optionnel : afficher une petite notification de succès ici
        this.loadData(); // Rafraîchissement automatique
      },
      error: (err) => console.error('Erreur lors de la mise à jour', err)
    });
  }

  calculateStats() {
    this.stats.total = this.chauffeurs.length;
    this.stats.dispo = this.chauffeurs.filter(c => c.etatChauffeur === 'DISPONIBLE').length;
    this.stats.mission = this.chauffeurs.filter(c => c.etatChauffeur === 'EN_MISSION').length;
    this.stats.conge = this.chauffeurs.filter(c => c.etatChauffeur === 'EN_CONGE').length;
  }

  filterTable(etat: string) {
    this.filteredChauffeurs = etat === 'TOUS' 
      ? this.chauffeurs 
      : this.chauffeurs.filter(c => c.etatChauffeur === etat);
  }
}