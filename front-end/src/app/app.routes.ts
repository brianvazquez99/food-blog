import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Admin } from './features/admin/admin';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'admin', component: Admin }
];
