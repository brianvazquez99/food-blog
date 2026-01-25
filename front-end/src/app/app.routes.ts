import { Routes } from '@angular/router';
import { adminGuard } from './admin-guard';
import { deactivateAdminGuard } from './deactivate-admin-guard';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
    // canActivate: [adminGuard],
    // canDeactivate: [deactivateAdminGuard]
  },
  {
    path: 'recipes',
    loadComponent: () => import('./features/recipes/recipes').then((m) => m.Recipes),
  },

];
