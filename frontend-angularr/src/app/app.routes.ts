import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { ChefParcDashboardComponent } from './chef-parc-dashboard/chef-parc-dashboard.component';
import { VehiculesChefComponent } from './vehicules-chef/vehicules-chef.component';
import { ChefParcLayoutComponent } from './layouts/chef-parc-layout/chef-parc-layout.component';
import { LocauxadminComponent } from './locauxadmin/locauxadmin.component';
import { Adminlayoutcomponent} from './adminlayoutcomponent/adminlayoutcomponent.component';
import { ConsulterChauffeursComponent } from './consulter-chauffeurs/consulter-chauffeurs.component';
import { ChefParcComponent } from './chef-parc/chef-parc.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VehiculeComponent } from './vehicule/vehicule.component';
import { StatsDashboardComponent } from './stats-dashboard/stats-dashboard.component';
import { CarteCarburantComponent } from './carte-carburant/carte-carburant.component';
import { ChauffeurGestionComponent } from './chauffeur-gestion/chauffeur-gestion.component';

export const routes: Routes = [
{ path: '', component: AuthentificationComponent },
 {
  path: 'admin',
  children: [

    { path: 'dashboard', component: DashboardComponent },
{
  path:'locaux',component:LocauxadminComponent
} 
,{path:'chefsparc',component:ChefParcComponent} 
,{path:'vehicules',component:VehiculeComponent}
,{path:'chauffeurs',component:ChauffeurGestionComponent}
,{path:'rapports',component:StatsDashboardComponent}]
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
    {path:'carburants',component:CarteCarburantComponent}
    

  ]
},
];
