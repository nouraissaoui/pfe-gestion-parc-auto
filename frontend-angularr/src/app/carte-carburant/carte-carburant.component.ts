import { Component, OnInit } from '@angular/core';
import { GestionParcService } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carte-carburant',
  imports:[FormsModule,CommonModule],
  templateUrl: './carte-carburant.component.html',
  styleUrls: ['./carte-carburant.component.css']
})
export class CarteCarburantComponent implements OnInit {
  isFlipped = false;
  nouveauMontant: number = 0;
  
  // Cette variable contiendra l'objet venant de la BDD
  carte: any = {
    numeroCarte: '',
    titulaire: '',
    adresse: '',
    dateExpiration: '',
    montantReel: 0
  };

  constructor(private service: GestionParcService) {}

  ngOnInit() {
    // On peut charger une carte par défaut au démarrage si besoin
    // this.chargerDonneesCarte('7083000001234567');
  }

  // Action pour charger les infos depuis la BDD
  chargerDonneesCarte() {
    if (!this.carte.numeroCarte) return;

    this.service.getCarte(this.carte.numeroCarte).subscribe({
      next: (data) => {
        this.carte = data; // On mappe directement l'objet de la BDD
      },
      error: (err) => console.error("Carte non trouvée", err)
    });
  }

  // Action pour recharger en BDD
  modifierSolde() {
    if (this.nouveauMontant <= 0 || !this.carte.numeroCarte) return;

    this.service.recharger(this.carte.numeroCarte, this.nouveauMontant).subscribe({
      next: (res) => {
        // Après recharge, on rafraîchit les données pour voir le nouveau solde
        this.carte.montantReel += this.nouveauMontant;
        this.nouveauMontant = 0;
        alert("Solde mis à jour en base de données !");
      },
      error: (err) => alert("Erreur lors de la recharge")
    });
  }

  flipCard() {
    this.isFlipped = !this.isFlipped;
  }

  formatNumero(num: string) {
    if (!num) return '**** **** **** ****';
    return num.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  }
}