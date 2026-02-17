import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GestionParcService } from '../../gestion-parc.service';

@Component({
  selector: 'app-chef-parc-layout',
  imports: [CommonModule,FormsModule,RouterModule],
  templateUrl: './chef-parc-layout.component.html',
  styleUrl: './chef-parc-layout.component.css'
})

export class ChefParcLayoutComponent implements OnInit {
  Nom: string = '';
  Prenom: string = '';
  localNom: string = '';
  role: string = '';

  userId = 0;   // récupéré depuis la session
  localId = 0;  // récupéré depuis la session
  stats: any[] = [];

  activePage: string = 'chef-parc';

  constructor(
    private router: Router,
    private service: GestionParcService
  ) {}

  ngOnInit(): void {
    this.loadSession();
  }

  loadSession() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.Nom = user.nom;
      this.Prenom = user.prenom;
      this.userId = user.idChefParc;
      this.localId = user.idLocal;
      this.role = user.role;
    }
  }

  navigate(page: string) {
    this.activePage = page;
    this.router.navigate([`/${page}`]);
  }

  logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      localStorage.clear();
      this.router.navigate(['/']);
    }
  }

  toggleMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar?.classList.toggle('active');
  }
}