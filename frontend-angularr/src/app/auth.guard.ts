//Ce code définit un Auth Guard Angular.

//Un Guard sert à :

//✅ protéger les routes
//✅ empêcher les utilisateurs non autorisés d’accéder aux pages
//✅ vérifier si l’utilisateur est connecté
//✅ vérifier le rôle (admin, chef parc, chauffeur)
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
//Tu as seulement une fonction :authGuard: CanActivateFn = (route, state) => {
export const authGuard: CanActivateFn = (route, state) => {
  //CanActivateFn→ type d’un guard Angular.
//Router→ utilisé pour rediriger.
//un Guard est une protection pour les routes.
//CanActivateFn signifie :➡️ fonction qui décide :✅ accès autorisé ou ❌ accès refusé.
  const router = inject(Router);

  // 🔍 On vérifie sessionStorage
  const userStr = sessionStorage.getItem('user');//On récupère l’utilisateur connecté stocké dans le navigateur

  // ❌ Si vide (nouvel onglet ou non connecté) -> Direction Login
  if (!userStr) {
    router.navigate(['']);//Retour vers page login.
    return false;
  }

  const user = JSON.parse(userStr);
  const role = user.typeUtilisateur;
  const url  = state.url;

  // Vérification des rôles
  if (url.startsWith('/admin')     && role !== 'ADMIN')     { router.navigate(['']); return false; }
  if (url.startsWith('/chef-parc') && role !== 'CHEF_PARC') { router.navigate(['']); return false; }
  if (url.startsWith('/chauffeur') && role !== 'CHAUFFEUR') { router.navigate(['']); return false; }

  return true; //Angular autorise l’ouverture de la page.
};