import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {

  const http = inject(HttpClient)
  const router = inject(Router)

        let pass = prompt("Please enter the password")

      if (pass != null || pass != '') {
        http.post("/api/admin", {PASSWORD: pass}).subscribe({
          next:value => {
            return true;
          },
          error: err => {
            return router.createUrlTree([''])
            // return false
          }
        })
      }

            return router.createUrlTree([''])
};
