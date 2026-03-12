import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { ChefParcDashboardComponent } from './chef-parc-dashboard/chef-parc-dashboard.component';
import { VehiculesChefComponent } from './vehicules-chef/vehicules-chef.component';
import { ChefParcLayoutComponent } from './layouts/chef-parc-layout/chef-parc-layout.component';
import { LocauxadminComponent } from './locauxadmin/locauxadmin.component';
import { Adminlayoutcomponent} from './adminlayoutcomponent/adminlayoutcomponent.component';
import { ConsulterChauffeursComponent } from './consulter-chauffeurs/consulter-chauffeurs.component';
import { AffectationMissionComponent } from './affectation-mission/affectation-mission.component';
import { ChefParcComponent } from './chef-parc/chef-parc.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VehiculeComponent } from './vehicule/vehicule.component';
import { DeclarationsListeComponent } from './declarations-liste/declarations-liste.component';
import { EntretiensComponent } from './entretiens/entretiens.component';
import { DriverLayoutComponent } from './driver-layout/driver-layout.component';
import { DriverMenuComponent } from './driver-menu/driver-menu.component';
import { MissionsComponent } from './missions/missions.component';


export const routes: Routes = [
{ path: '', component: AuthentificationComponent },
 {
  path: 'admin',
  children: [
      { path: 'dashboard', component: DashboardComponent },
      {path:'locaux',component:LocauxadminComponent},
      {path:'chefsparc',component:ChefParcComponent},
      {path:'vehicules',component:VehiculeComponent},
]
}
,
{
  path: 'chef-parc',
  component: ChefParcLayoutComponent,
  children: [
    // par défaut, redirige vers le dashboard
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: ChefParcDashboardComponent },
    { path: 'vehicules', component: VehiculesChefComponent },
    { path: 'chauffeurs', component: ConsulterChauffeursComponent },
    { path: 'missions', component: AffectationMissionComponent },
    {path:'declarations',component:DeclarationsListeComponent},
    {path:'entretiens',component:EntretiensComponent},
    

  ]
},
{
  path: 'chauffeur',
  component: DriverLayoutComponent,
  children: [
    // par défaut, redirige vers le dashboard
    { path: '', redirectTo: 'menu', pathMatch: 'full' },
    { path: 'menu', component: DriverMenuComponent },
    { path: 'missions', component: MissionsComponent },
  ]
}
];
