import { CanDeactivateFn } from '@angular/router';
import { Admin } from './features/admin/admin';



export const deactivateAdminGuard: CanDeactivateFn<Admin> = (component, currentRoute, currentState, nextState) => {
  if(!component.isSaved) {
    return confirm('If you navigate away all progress will be lost')
  }
  return component.isSaved;
};
