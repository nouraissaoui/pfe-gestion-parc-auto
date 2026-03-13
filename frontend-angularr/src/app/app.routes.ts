import { Routes } from '@angular/router';
// Layouts
import { ChefParcLayoutComponent } from './layouts/chef-parc-layout/chef-parc-layout.component';

// Composants Communs
import { AuthentificationComponent } from './authentification/authentification.component';

import { CarteCarburantComponent } from './carte-carburant/carte-carburant.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { ChauffeurLayoutComponent } from './chauffeur-layout/chauffeur-layout.component';
import { ChauffeurDashboardComponent } from './chauffeur-dashboard/chauffeur-dashboard.component';
import { FaireDeclarationComponent } from './faire-declaration/faire-declaration.component';
import { MissionListComponent } from './mission-list/mission-list.component';
import { FeuilleRoutechauffeurComponent } from './feuille-routechauffeur/feuille-routechauffeur.component';
import { AdminDashboradComponent } from './admin-dashborad/admin-dashborad.component';
import { LocauxadminComponent } from './locauxadmin/locauxadmin.component';
import { ChefParcComponent } from './chef-parc/chef-parc.component';
import { VehiculeComponent } from './vehicule/vehicule.component';
import { ChauffeurGestionComponent } from './chauffeur-gestion/chauffeur-gestion.component';
import { StatsDashboardComponent } from './stats-dashboard/stats-dashboard.component';
import { ChefParcDashboardComponent } from './chef-parc-dashboard/chef-parc-dashboard.component';
import { VehiculesChefComponent } from './vehicules-chef/vehicules-chef.component';
import { ConsulterChauffeursComponent } from './consulter-chauffeurs/consulter-chauffeurs.component';
import { AffectationMissionComponent } from './affectation-mission/affectation-mission.component';
import { DeclarationsListeComponent } from './declarations-liste/declarations-liste.component';
import { EntretiensComponent } from './entretiens/entretiens.component';
import { DriverMenuComponent } from './driver-menu/driver-menu.component';
import { MissionsComponent } from './missions/missions.component';
import { DriverLayoutComponent } from './driver-layout/driver-layout.component';

export const routes: Routes = [
  // 1. Point d'entrée (Login)
  { path: '', component: AuthentificationComponent },

  // 2. Espace ADMINISTRATEUR
  {
    path: 'admin',
    component: AdminLayoutComponent, // Le "cadre" avec le menu Admin
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboradComponent },
      { path: 'locaux', component: LocauxadminComponent },
      { path: 'chefsparc', component: ChefParcComponent },
      { path: 'vehicules', component: VehiculeComponent },
      { path: 'chauffeurs', component: ChauffeurGestionComponent },
    ]
  },

  // 3. Espace CHEF DE PARC
  {
    path: 'chef-parc',
    component: ChefParcLayoutComponent, // Le "cadre" avec le menu Chef de Parc
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ChefParcDashboardComponent },
      { path: 'vehicules', component: VehiculesChefComponent },
      { path: 'chauffeurs', component: ConsulterChauffeursComponent },
      { path: 'missions', component: AffectationMissionComponent },
      { path: 'carburants', component: CarteCarburantComponent },
      {path:'declarations',component:DeclarationsListeComponent},
      {path:'entretiens',component:EntretiensComponent},
    ]
  },
  {
    path: 'chauffeur',
    component: DriverLayoutComponent, 
    children: [
      { path: '', redirectTo: 'menu', pathMatch: 'full' },
      { path: 'menu', component: DriverMenuComponent },
      {path:'declarations',component:FaireDeclarationComponent},
      {path:'feuille-route',component:FeuilleRoutechauffeurComponent},
      { path: 'missions', component: MissionsComponent },
    ]
  }
,
  // 4. Redirection de sécurité (si la route n'existe pas)
  { path: '**', redirectTo: '' }
];
