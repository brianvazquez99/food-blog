import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Admin } from './features/admin/admin';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'admin', loadComponent:()=> import('./features/admin/admin').then(m => m.Admin) },
  {path: 'recipes', loadComponent:()=> import('./features/recipes/recipes').then(m => m.Recipes) },
  {path: 'recipe', loadComponent:()=> import('./features/recipes/recipe-details/recipe-details').then(m => m.RecipeDetails) },

];
