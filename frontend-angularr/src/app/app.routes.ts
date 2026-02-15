import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';

export const routes: Routes = [
  { path: '', component: AuthentificationComponent }, // page par défaut
  // tu peux ajouter d'autres routes ici, par exemple :
  // { path: 'dashboard', component: DashboardComponent }
];
