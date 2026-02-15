import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-espace-chef-du-parc',
  imports: [],
  templateUrl: './espace-chef-du-parc.component.html',
  styleUrl: './espace-chef-du-parc.component.css'
})
export class EspaceChefDuParcComponent {
    constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

}
