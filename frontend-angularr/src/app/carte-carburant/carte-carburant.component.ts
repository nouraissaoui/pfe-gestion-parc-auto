import { Component, OnInit } from '@angular/core';
import { GestionParcService } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carte-carburant',
  imports: [FormsModule, CommonModule],
  templateUrl: './carte-carburant.component.html',
  styleUrls: ['./carte-carburant.component.css']
})
export class CarteCarburantComponent implements OnInit {
  isFlipped = false;
  nouveauMontant: number | null = null;

  erreurNumero: string = '';
  erreurMontant: string = '';

  carte: any = {
    numeroCarte: '',
    titulaire: '',
    adresse: '',
    dateExpiration: '',
    montantReel: 0
  };

  constructor(private service: GestionParcService) {}

  ngOnInit() {}

  onNumeroCarte() {
    this.erreurNumero = '';
  }

  onMontantChange() {
    this.erreurMontant = '';
  }

  chargerDonneesCarte() {
    this.erreurNumero = '';
    const num = this.carte.numeroCarte?.replace(/\s/g, '');

    if (!num) {
      this.erreurNumero = 'Le numéro de carte est obligatoire.';
      return;
    }
    if (!/^\d{16}$/.test(num)) {
      this.erreurNumero = 'Numéro invalide — il doit contenir exactement 16 chiffres.';
      return;
    }

    this.service.getCarte(num).subscribe({
      next: (data) => {
        this.carte = data;
        this.erreurNumero = '';
      },
      error: (err) => {
        if (err.status === 404) {
          this.erreurNumero = 'Carte introuvable. Vérifiez le numéro et réessayez.';
        } else {
          this.erreurNumero = 'Une erreur est survenue lors de la recherche.';
        }
      }
    });
  }

  modifierSolde() {
    this.erreurMontant = '';

    if (this.nouveauMontant === null || this.nouveauMontant === undefined || String(this.nouveauMontant).trim() === '') {
      this.erreurMontant = 'Veuillez saisir un montant.';
      return;
    }
    if (isNaN(Number(this.nouveauMontant))) {
      this.erreurMontant = 'Le montant saisi n\'est pas valide.';
      return;
    }
    if (this.nouveauMontant <= 0) {
      this.erreurMontant = 'Le montant doit être un nombre positif supérieur à 0.';
      return;
    }
    if (this.nouveauMontant > 1000) {
  this.erreurMontant = 'Le montant de recharge ne peut pas dépasser 1 000 TND.';
  return;
}
    if (!this.carte.numeroCarte) {
      this.erreurNumero = 'Veuillez d\'abord rechercher une carte valide.';
      return;
    }

    this.service.recharger(this.carte.numeroCarte, this.nouveauMontant).subscribe({
      next: () => {
        this.carte.montantReel += this.nouveauMontant!;
        this.nouveauMontant = null;
        alert('Solde mis à jour avec succès !');
      },
      error: () => {
        this.erreurMontant = 'Erreur lors de la mise à jour. Veuillez réessayer.';
      }
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