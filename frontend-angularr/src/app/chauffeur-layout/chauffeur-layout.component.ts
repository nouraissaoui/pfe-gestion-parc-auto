import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chauffeur-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './chauffeur-layout.component.html',
  styleUrl: './chauffeur-layout.component.css'
})
export class ChauffeurLayoutComponent implements OnInit {
  Nom: string = '';
  Prenom: string = '';
  role: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadSession();
  }

  loadSession() {
    const userJson = sessionStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.Nom = user.nom;
      this.Prenom = user.prenom;
      this.role = user.role;
    }
  }

  logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      sessionStorage.clear();
      this.router.navigate(['/']);
    }
  }
}