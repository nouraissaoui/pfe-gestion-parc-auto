import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { GestionParcService, LoginResponse } from '../gestion-parc.service';
import { Adminlayoutcomponent } from '../adminlayoutcomponent/adminlayoutcomponent.component';

@Component({
  selector: 'app-authentification',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, Adminlayoutcomponent],
  templateUrl: './authentification.component.html',
  styleUrls: ['./authentification.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AuthentificationComponent {
  email: string = '';
  password: string = '';
  emailInvalid: boolean = false;
  passwordInvalid: boolean = false;
  emailErrorMessage: string = '';
  passwordErrorMessage: string = '';
  showAlert: boolean = false;
  alertMessage: string = '';
  isLoading: boolean = false;//connexion en cours

  constructor(
    private service: GestionParcService,
    private router: Router,//sert à naviguer entre pages :
    private cdr: ChangeDetectorRef//forcer angular a rafraichir linterfcae

  ) {}

  login(): void {
    // Reset immédiat
    this.emailInvalid = false;
    this.passwordInvalid = false;
    this.emailErrorMessage = '';
    this.passwordErrorMessage = '';
    this.showAlert = false;
    this.alertMessage = '';

const emailRegex = /^[a-zA-ZÀ-ÿ]+\.[a-zA-ZÀ-ÿ]+@agil\.com\.tn$|^admin@parc\.com$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;//.*cad nimporte quelle caractere

    let hasError = false;

    if (!this.email || !emailRegex.test(this.email)) {
      this.emailInvalid = true;
      this.emailErrorMessage = 'Format requis : prenom.nom@agil.com.tn';
      hasError = true;
    }
    if (!this.password || !passwordRegex.test(this.password)|| this.password.trim() === '') {
  this.passwordInvalid = true;
  this.passwordErrorMessage =
    'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.';
  hasError = true;
}


    if (hasError) {
      this.showAlert = true;
      this.alertMessage = 'Veuillez remplir correctement tous les champs.';
      this.cdr.detectChanges(); // Force l'affichage immédiat
      return;
    }

    // Désactiver le bouton pendant l'appel
    this.isLoading = true;
    this.cdr.detectChanges();//forcer Angular à mettre à jour l’interface

    this.service.login(this.email, this.password).subscribe({
      next: (response: LoginResponse) => {
        sessionStorage.clear();
        sessionStorage.setItem('user', JSON.stringify(response));
        //sauvegarde le usesr garde id user et id lcoal
        if (response.idLocal) {
          sessionStorage.setItem('idLocal', response.idLocal.toString());
        }
        sessionStorage.setItem('userId', response.id.toString());

        const role = response.typeUtilisateur;
        if (role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'CHEF_PARC') {
          this.router.navigate(['/chef-parc/dashboard']);
        } else if (role === 'CHAUFFEUR') {
          this.router.navigate(['/chauffeur/menu']);
        } else {
          alert("Rôle non reconnu : " + role);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
  console.error("Erreur d'authentification :", err);
  this.isLoading = false;

  if (err.status === 0) {//si le serveur inaccessible
    this.showAlert = true;
    this.alertMessage = "Impossible de contacter le serveur. Vérifiez que le backend est démarré.";

  } else if (err.status === 404) {
    // Email introuvable
    this.emailInvalid = true;
    this.emailErrorMessage = 'Aucun compte trouvé avec cet email.';
    this.showAlert = true;
    this.alertMessage = "Aucun compte trouvé avec cet email.";

  } else {
  // Les deux rouges avec messages distincts
  this.emailInvalid = true;
  this.passwordInvalid = true;
  this.emailErrorMessage = 'Email incorrect ou introuvable.';
  this.passwordErrorMessage = 'Mot de passe incorrect ou introuvable.';
  this.showAlert = true;
  this.alertMessage = "L'email et/ou le mot de passe que vous avez saisi est incorrect.";
}

  this.cdr.detectChanges();
}
    });
  }
}