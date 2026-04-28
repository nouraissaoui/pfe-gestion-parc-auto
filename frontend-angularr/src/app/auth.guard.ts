import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // 🔍 On vérifie sessionStorage
  const userStr = sessionStorage.getItem('user');

  // ❌ Si vide (nouvel onglet ou non connecté) -> Direction Login
  if (!userStr) {
    router.navigate(['']);
    return false;
  }

  const user = JSON.parse(userStr);
  const role = user.typeUtilisateur;
  const url  = state.url;

  // Vérification des rôles
  if (url.startsWith('/admin')     && role !== 'ADMIN')     { router.navigate(['']); return false; }
  if (url.startsWith('/chef-parc') && role !== 'CHEF_PARC') { router.navigate(['']); return false; }
  if (url.startsWith('/chauffeur') && role !== 'CHAUFFEUR') { router.navigate(['']); return false; }

  return true; 
};