import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // On récupère l'objet utilisateur stocké lors du login
  const userData = localStorage.getItem('user');

  if (userData) {
    const user = JSON.parse(userData);
    
    // On vérifie si c'est bien un ADMIN
    if (user.typeUtilisateur === 'ADMIN') {
      return true; // Accès autorisé
    }
  }

  // Si pas de user ou pas ADMIN, redirection vers login
  console.warn("Accès refusé : Utilisateur non connecté ou non Administrateur");
  router.navigate(['/']); 
  return false;
};