import { Routes } from '@angular/router';
import { adminGuard } from './admin-guard';
import { deactivateAdminGuard } from './deactivate-admin-guard';
import { Home } from './features/home/home';
import { Admin } from './features/admin/admin';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'admin',
    component: Admin,
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    // canActivate: [adminGuard],
    // canDeactivate: [deactivateAdminGuard],
  },
  {
    path: 'recipes',
    loadComponent: () => import('./features/recipes/recipes').then((m) => m.Recipes),
  },

];
