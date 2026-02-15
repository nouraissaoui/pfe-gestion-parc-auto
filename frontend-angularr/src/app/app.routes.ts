import { Routes } from '@angular/router';
import { EspaceChefDuParcComponent } from './espace-chef-du-parc/espace-chef-du-parc.component';

export const routes: Routes = [
    { path: '', redirectTo: 'espacechef', pathMatch: 'full' },
    {path:'espacechef',component:EspaceChefDuParcComponent},
];