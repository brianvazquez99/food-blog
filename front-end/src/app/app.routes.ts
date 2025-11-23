import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Admin } from './features/admin/admin';
import { adminGuard } from './admin-guard';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
    canActivate: [adminGuard],
  },
  {
    path: 'recipes',
    loadComponent: () => import('./features/recipes/recipes').then((m) => m.Recipes),
  },
  {
    path: 'recipe/:slug',
    loadComponent: () =>
      import('./features/recipes/recipe-details/recipe-details').then((m) => m.RecipeDetails),
  },
  { path: 'about', loadComponent: () => import('./features/about/about').then((m) => m.About) },
];
