import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {

  const http = inject(HttpClient)
  const router = inject(Router)

        let pass = prompt("Please enter the password")

        if (!pass) {
          return router.createUrlTree([''])
        }


        return http.post("/api/admin", {PASSWORD: pass}).pipe(map(value => {return true}),
      catchError((err => {
        return of(router.createUrlTree(['']))
      })))



};
