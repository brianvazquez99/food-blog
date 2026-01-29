import { Routes } from "@angular/router";
import { AdminDash } from "./admin-dash/admin-dash";
import { Admin } from "./admin";


export const ADMIN_ROUTES:Routes = [
  // {component: Admin, path:''},
  {component:AdminDash, path: ''}
]
