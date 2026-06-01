import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
//Import du système de navigation Angular. Router permet :
//changer de page,naviguer entre composants,gérer les routes.
@Injectable({ providedIn: 'root' })// Déclare ce service comme disponible globalement dans toute l’application.
export class NavigationService {
  constructor(private router: Router) {}

  navigate(commands: any[]): void {//onction personnalisée pour naviguer vers une route.
    this.router.navigate(commands, { skipLocationChange: true });
  }
  //commands représente le chemin (route) vers lequel Angular doit naviguer.
  //skipLocationChange Angular change de composant SANS modifier l’URL visible dans le navigateur
}