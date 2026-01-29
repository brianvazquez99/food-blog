import { CanDeactivateFn } from '@angular/router';
import { AdminBlogDetail } from './features/admin/admin-blog-detail/admin-blog-detail';



export const deactivateAdminGuard: CanDeactivateFn<AdminBlogDetail> = (component, currentRoute, currentState, nextState) => {
  if(!component.isSaved) {
    return confirm('If you navigate away all progress will be lost')
  }
  return component.isSaved;
};
