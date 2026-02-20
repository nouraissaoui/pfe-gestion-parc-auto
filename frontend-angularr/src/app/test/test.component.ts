import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  imports: [],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {
  isActive = true;

  // Données du véhicule (à remplacer par tes données dynamiques si nécessaire)
  vehicule = {
    marque: 'Toyota',
    modele: 'Land Cruiser 200',
    matricule: 'TN-247-AB',
    annee: 2021,
    carburant: 'Diesel',
    etat: 'Bon',
    id: '#VH-2021-0042',
    updated: '20/02/2026',
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80'
  };

  constructor() { }

  ngOnInit(): void { }

  closeModal() {
    this.isActive = false;
  }
}
