import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { GestionParcService } from '../gestion-parc.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-driver-layout',
  imports: [RouterOutlet,CommonModule,FormsModule,RouterModule],
  templateUrl: './driver-layout.component.html',
  styleUrl: './driver-layout.component.css'
})
export class DriverLayoutComponent implements OnInit {
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
      const userJson = sessionStorage.getItem('user');
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
        sessionStorage.clear();
        this.router.navigate(['/']);
      }
    }
  
    toggleMenu() {
      const sidebar = document.querySelector('.sidebar');
      sidebar?.classList.toggle('active');
    }

}
