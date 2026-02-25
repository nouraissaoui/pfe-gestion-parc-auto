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

  constructor(private chauffeurService: GestionParcService) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.idLocal = user.idLocal;
    if (this.idLocal) {
      this.fetchDrivers();
    }
  }

  fetchDrivers() {
    this.chauffeurService.getChauffeursByLocal(this.idLocal!).subscribe(res => {
      this.chauffeurs = res;
      this.filteredChauffeurs = res;
      this.updateStats();
    });
  }

  changeEtat(id: number, event: any) {
    const nextEtat = event.target.value;
    this.chauffeurService.updateEtatChauffeur(id, nextEtat).subscribe(() => {
      this.fetchDrivers();
    });
  }

 /* onSearch(event: any) {
    const val = event.target.value.toLowerCase();
    this.filteredChauffeurs = this.chauffeurs.filter(c => 
      c.user.nom.toLowerCase().includes(val) || c.user.prenom.toLowerCase().includes(val)
    );
  }*/
 onSearch(event: any) {
  const val = event.target.value.toLowerCase();
  this.filteredChauffeurs = this.chauffeurs.filter(c => 
    // Correction ici : on retire ".user"
    c.nom.toLowerCase().includes(val) || c.prenom.toLowerCase().includes(val)
  );
}

  filterTable(etat: string) {
    this.filteredChauffeurs = etat === 'TOUS' 
      ? this.chauffeurs 
      : this.chauffeurs.filter(c => c.etatChauffeur === etat);
  }

  updateStats() {
    this.stats.total = this.chauffeurs.length;
    this.stats.dispo = this.chauffeurs.filter(c => c.etatChauffeur === 'DISPONIBLE').length;
    this.stats.mission = this.chauffeurs.filter(c => c.etatChauffeur === 'EN_MISSION').length;
    this.stats.conge = this.chauffeurs.filter(c => c.etatChauffeur === 'EN_CONGE').length;
  }
}