import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { ChefParcDashboardComponent } from './chef-parc-dashboard/chef-parc-dashboard.component';



export const routes: Routes = [
    {path:'',component:AuthentificationComponent},
    {path:'chef-parc',component:ChefParcDashboardComponent},

    

];