import { Routes } from '@angular/router';
import { ChefParcLayoutComponent } from './layouts/chef-parc-layout/chef-parc-layout.component';
import { AuthentificationComponent } from './authentification/authentification.component';
import { CarteCarburantComponent } from './carte-carburant/carte-carburant.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { FaireDeclarationComponent } from './faire-declaration/faire-declaration.component';
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
import { ChatbotComponent } from './chatbot/chatbot.component';
import { authGuard } from './auth.guard';
import { RapportStatistiquesComponent } from './rapport-statistiques/rapport-statistiques.component';
import { ConsultationFeuillesComponent } from './consultation-feuilles/consultation-feuilles.component';
import { PredictionComponent } from './prediction/prediction.component';

export const routes: Routes = [

  // ✅ Login — seule route publique
  { path: '', component: AuthentificationComponent },

  // ✅ ADMIN — protégé
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],        // 👈 AJOUTÉ
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboradComponent },
      { path: 'locaux', component: LocauxadminComponent },
      { path: 'chefsparc', component: ChefParcComponent },
      { path: 'vehicules', component: VehiculeComponent },
      { path: 'chauffeurs', component: ChauffeurGestionComponent },
      { path: 'rapports', component: RapportStatistiquesComponent }
    ]
  },

  // ✅ CHEF DE PARC — protégé
  {
    path: 'chef-parc',
    component: ChefParcLayoutComponent,
    canActivate: [authGuard],        // 👈 AJOUTÉ
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ChefParcDashboardComponent },
      { path: 'vehicules', component: VehiculesChefComponent },
      { path: 'chauffeurs', component: ConsulterChauffeursComponent },
      { path: 'missions', component: AffectationMissionComponent },
      { path: 'carburants', component: CarteCarburantComponent },
      { path: 'declarations', component: DeclarationsListeComponent },
      { path: 'entretiens', component: EntretiensComponent },
      { path: 'chatbot', component: ChatbotComponent },
      { path: 'rapports', component: StatsDashboardComponent },
      { path: 'consultation-feuilles', component: ConsultationFeuillesComponent },
      { path: 'predire', component: PredictionComponent }
    ]
  },

  // ✅ CHAUFFEUR — protégé
  {
    path: 'chauffeur',
    component: DriverLayoutComponent,
    canActivate: [authGuard],        // 👈 AJOUTÉ
    children: [
      { path: '', redirectTo: 'menu', pathMatch: 'full' },
      { path: 'menu', component: DriverMenuComponent },
      { path: 'declarations', component: FaireDeclarationComponent },
      { path: 'feuille-route', component: FeuilleRoutechauffeurComponent },
      { path: 'missions', component: MissionsComponent },
      { path: 'chatbot', component: ChatbotComponent }
    ]
  },

  // Sécurité — route inconnue → login
  { path: '**', redirectTo: '' }
];