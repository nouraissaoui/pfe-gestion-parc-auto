import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

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
  }
}
