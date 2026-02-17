import { Routes } from '@angular/router';
import { AuthentificationComponent } from './authentification/authentification.component';
import { ChefParcDashboardComponent } from './chef-parc-dashboard/chef-parc-dashboard.component';
import { VehiculesChefComponent } from './vehicules-chef/vehicules-chef.component';
import { ChefParcLayoutComponent } from './layouts/chef-parc-layout/chef-parc-layout.component';
import { LocauxadminComponent } from './locauxadmin/locauxadmin.component';
import { Adminlayoutcomponent} from './adminlayoutcomponent/adminlayoutcomponent.component';



/*export const routes: Routes = [
    {path:'',component:AuthentificationComponent},
    {path:'chef-parc',component:ChefParcDashboardComponent},
    {path:'vehicules',component:VehiculesChefComponent},
    {path:'layout',component:ChefParcLayoutComponent},
    

];*/
export const routes: Routes = [
{ path: '', component: AuthentificationComponent },
 {
  path: 'admin',
  children: [

    { path: 'locaux', component: LocauxadminComponent }  // ← Page locaux pour admin
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

  ]
},
];
