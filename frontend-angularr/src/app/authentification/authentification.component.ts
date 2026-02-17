import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { GestionParcService, LoginResponse } from '../gestion-parc.service';

@Component({
  selector: 'app-authentification',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
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

  login(): void {

    this.service.login(this.email, this.password).subscribe({
      next: (response: LoginResponse) => {

        // 🔐 Sauvegarde session
        localStorage.setItem('user', JSON.stringify(response));

        console.log("User connecté :", response);

        // 🔹 Redirection selon rôle
        switch(response.role) {

          case 'ADMIN':
            this.router.navigate(['/admin/locaux']);
            break;

          case 'CHAUFFEUR':
            this.router.navigate(['/chauffeur/dashboard']);
            break;

          case 'CHEF_DU_PARC':
            this.router.navigate(['/chef-parc/dashboard']);
            break;

          default:
            alert("Rôle inconnu !");
        }
      },

      error: () => {
        alert("Email ou mot de passe incorrect !");
      }
    });
  }
}