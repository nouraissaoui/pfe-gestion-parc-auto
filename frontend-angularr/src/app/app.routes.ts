import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { ChefParcDashboardComponent } from './chef-parc-dashboard/chef-parc-dashboard.component';
import { VehiculesChefComponent } from './vehicules-chef/vehicules-chef.component';
import { ChefParcLayoutComponent } from './layouts/chef-parc-layout/chef-parc-layout.component';



/*export const routes: Routes = [
    {path:'',component:AuthentificationComponent},
    {path:'chef-parc',component:ChefParcDashboardComponent},
    {path:'vehicules',component:VehiculesChefComponent},
    {path:'layout',component:ChefParcLayoutComponent},
    

];*/
export const routes: Routes = [
{ path: '', component: AuthentificationComponent },
{
  path: 'chef-parc',
  component: ChefParcLayoutComponent,
  children: [
    // par défaut, redirige vers le dashboard
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: ChefParcDashboardComponent },
    { path: 'vehicules', component: VehiculesChefComponent },

  ]
},
];
