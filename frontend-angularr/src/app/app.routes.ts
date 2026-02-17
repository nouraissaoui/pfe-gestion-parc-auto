import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { ChefParcDashboardComponent } from './chef-parc-dashboard/chef-parc-dashboard.component';
import { VehiculesChefComponent } from './vehicules-chef/vehicules-chef.component';



export const routes: Routes = [
    {path:'',component:AuthentificationComponent},
    {path:'chef-parc',component:ChefParcDashboardComponent},
    {path:'vehicules',component:VehiculesChefComponent},
    

];