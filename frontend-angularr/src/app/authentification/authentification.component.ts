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
 /* email: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login(): void {
    console.log("Email:", this.email, "Password:", this.password);

    // 🔹 POST vers le backend
    this.http.post<string>('http://localhost:8080/api/auth/login', {
      mail: this.email,
      motDePasse: this.password
    }, { responseType: 'text' as 'json' })  // 👈 Type pour éviter any
      .subscribe({
        next: (res: string) => {
          if(res.startsWith("SUCCESS")) {
            const role = res.split(":")[1];
            alert("Login success! Role: " + role);
            // 🔹 Rediriger selon rôle
            if(role === "ADMIN") {
              this.router.navigate(['/admin']);
            } else if(role === "CHAUFFEUR") {
              this.router.navigate(['/chauffeur']);
            } else {
              this.router.navigate(['/chef-parc']);
            }
          } else {
            alert("Login failed! Check email and password.");
          }
        },
        error: (err) => {
          console.error(err);
          alert("Error connecting to backend!");
        }
      });
  }*/
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
            this.router.navigate(['/admin-dashboard']);
            break;

          case 'CHAUFFEUR':
            this.router.navigate(['/chauffeur-dashboard']);
            break;

          case 'CHEF_DU_PARC':
            this.router.navigate(['/chef-parc']);
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