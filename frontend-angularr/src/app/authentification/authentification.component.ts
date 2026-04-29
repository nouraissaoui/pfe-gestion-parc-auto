import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { GestionParcService, LoginResponse } from '../gestion-parc.service';
import { Adminlayoutcomponent } from '../adminlayoutcomponent/adminlayoutcomponent.component';

@Component({
  selector: 'app-authentification',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule,Adminlayoutcomponent],
  templateUrl: './authentification.component.html',
  styleUrls: ['./authentification.component.css']
})
export class AuthentificationComponent {
  email: string = '';
  password: string = '';

  constructor(
    private service: GestionParcService,
    private router: Router
  ) {}

  /*login(): void {
  this.service.login(this.email, this.password).subscribe({
    next: (response: LoginResponse) => {
      // 🔐 Sauvegarde session
      sessionStorage.setItem('user', JSON.stringify(response));
      console.log("User connecté :", response);

      // 🔹 Redirection selon typeUtilisateur (et non plus role)
      switch(response.typeUtilisateur) {
        case 'ADMIN': // Si tu comptes ajouter un Admin plus tard
          this.router.navigate(['/admin/dashboard']);
          break;

        case 'CHAUFFEUR':
          this.router.navigate(['/chauffeur/dashboard']);
          break;

        case 'CHEF_PARC': // Doit correspondre exactement à la String Java
          this.router.navigate(['/chef-parc/dashboard']);
          break;

        default:
          console.warn("Type utilisateur inconnu reçu :", response.typeUtilisateur);
          alert("Rôle inconnu : " + response.typeUtilisateur);
      }
    },
    error: (err) => {
      console.error("Erreur login :", err);
      alert("Email ou mot de passe incorrect !");
    }
  });
}*/
login(): void {
  // 1. Vérification de sécurité locale
  if (!this.email || !this.password) {
    alert("Veuillez saisir votre email et mot de passe.");
    return;
  }

  this.service.login(this.email, this.password).subscribe({
    next: (response: LoginResponse) => {
      console.log("Connexion réussie :", response);

      // 2. Nettoyage de toute trace ancienne
      sessionStorage.clear(); 

      // 3. Stockage en sessionStorage (Isolation par onglet)
      sessionStorage.setItem('user', JSON.stringify(response));
      
      // Stockage des IDs pour vos futurs composants
      if (response.idLocal) {
        sessionStorage.setItem('idLocal', response.idLocal.toString());
      }
      sessionStorage.setItem('userId', response.id.toString());

      // 4. Redirection avec logs pour debugger
      const role = response.typeUtilisateur;
      console.log("Redirection vers l'espace :", role);

      if (role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else if (role === 'CHEF_PARC') {
        this.router.navigate(['/chef-parc/dashboard']);
      } else if (role === 'CHAUFFEUR') {
        this.router.navigate(['/chauffeur/menu']);
      } else {
        alert("Rôle non reconnu : " + role);
      }
    },
    error: (err) => {
      console.error("Erreur d'authentification :", err);
      alert("Email ou mot de passe incorrect !");
    }
  });
}}