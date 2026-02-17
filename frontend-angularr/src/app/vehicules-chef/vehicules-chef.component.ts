/*import { Component } from '@angular/core';

@Component({
  selector: 'app-vehicules-chef',
  imports: [],
  templateUrl: './vehicules-chef.component.html',
  styleUrl: './vehicules-chef.component.css'
})
export class VehiculesChefComponent {

}
*/
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Vehicule {
  matricule: string;
  marque: string;
  modele: string;
  annee: number;
  carburant: string;
  etat: 'DISPONIBLE' | 'EN_MISSION' | 'EN_ENTRETIEN' | 'INDISPONIBLE';
}

@Component({
  selector: 'app-vehicules-chef',
  imports: [],
  templateUrl: './vehicules-chef.component.html',
  styleUrl: './vehicules-chef.component.css'
})
export class VehiculesChefComponent implements OnInit {

totalVehicules = 0;
  missionsEnCours = 0;
  vehiculesDisponibles = 0;
  declarationsEnAttente = 0;
  maintenanceEnAttente = 0;
  chefNom: string = '';
  chefPrenom: string = '';
  localNom: string = '';
  niveau_responsabilite: string='';

  chefId = 0;   // récupéré depuis la session
  localId = 0;  // récupéré depuis la session

  constructor(
    private router: Router,
  ) {}
  ngOnInit(): void {
    this.loadSession();

  }

  loadSession() {
    const userJson = localStorage.getItem('user');
    if(userJson) {
      const user = JSON.parse(userJson);
      this.chefNom = user.nom;
      this.chefPrenom = user.prenom;
      this.chefId = user.idChefParc;
      this.localId = user.idLocal;
      this.localNom =user.  niveau_responsabilite; // tu peux récupérer dynamiquement si besoin
    }
  }


  vehicules: Vehicule[] = [
    { matricule: '123ABC', marque: 'Toyota', modele: 'Corolla', annee: 2020, carburant: 'Essence', etat: 'DISPONIBLE' },
    { matricule: '456DEF', marque: 'Ford', modele: 'Focus', annee: 2019, carburant: 'Diesel', etat: 'EN_MISSION' },
    { matricule: '789GHI', marque: 'BMW', modele: 'X5', annee: 2021, carburant: 'Essence', etat: 'EN_ENTRETIEN' },
  ];

  navigate(page: string) {
    this.router.navigate([`/${page}`]);
  }
  logout() {
    // Rediriger vers page login
    this.router.navigate(['/']);
  }

  getEtatClass(etat: string) {
    switch (etat) {
      case 'DISPONIBLE': return 'badge-success';
      case 'EN_MISSION': return 'badge-primary';
      case 'EN_ENTRETIEN': return 'badge-warning';
      case 'INDISPONIBLE': return 'badge-danger';
      default: return '';
    }
  }

  consulterVehicule(v: Vehicule) {
    alert(`Détails du véhicule ${v.matricule} - ${v.marque} ${v.modele}`);
  }

  affecterChauffeur(v: Vehicule) {
    alert(`Affecter un chauffeur au véhicule ${v.matricule}`);
  }

  changerEtat(v: Vehicule) {
    const nouveauxEtats = ['DISPONIBLE', 'EN_MISSION', 'EN_ENTRETIEN', 'INDISPONIBLE'];
    const nextIndex = (nouveauxEtats.indexOf(v.etat) + 1) % nouveauxEtats.length;
    v.etat = nouveauxEtats[nextIndex] as Vehicule['etat'];
  }
}