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
      localStorage.setItem('user', JSON.stringify(response));
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
  this.service.login(this.email, this.password).subscribe({
    next: (response: LoginResponse) => {
      // 🔐 Sauvegarde l'objet complet
      localStorage.setItem('user', JSON.stringify(response));
            localStorage.setItem('userProfile', JSON.stringify({
        id:      response.id,
        nom:     response.nom,
        prenom:  response.prenom,
        mail:    response.mail,
        role:    response.typeUtilisateur,   // "CHAUFFEUR", "CHEF_PARC", "ADMIN"
        localId: response.idLocal ?? null
      }));
      
      // 📍 SAUVEGARDE INDIVIDUELLE (Crucial pour votre composant Affectation)
      if (response.idLocal) {
        localStorage.setItem('idLocal', response.idLocal.toString());
      }
      localStorage.setItem('id', response.id.toString()); // Utile pour idChef

      console.log("User connecté et idLocal stocké :", response.idLocal);

      // Redirection...
      switch(response.typeUtilisateur) {
        case 'ADMIN': this.router.navigate(['/admin/dashboard']); break;
        case 'CHAUFFEUR': this.router.navigate(['/chauffeur/menu']); break;
        case 'CHEF_PARC': this.router.navigate(['/chef-parc/dashboard']); break;
      }
    },
    error: (err) => {       
      console.error("Erreur login :", err);
      alert("Email ou mot de passe incorrect !"); }
  });
}
  
}