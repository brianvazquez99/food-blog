import { Routes } from "@angular/router";
import { AdminDash } from "./admin-dash/admin-dash";
import { Admin } from "./admin";
import { AdminBlogDetail } from "./admin-blog-detail/admin-blog-detail";


export const ADMIN_ROUTES:Routes = [
  // {component: Admin, path:''},
  {component:AdminDash, path: ''},
  {component:AdminBlogDetail, path: 'edit'},

]
