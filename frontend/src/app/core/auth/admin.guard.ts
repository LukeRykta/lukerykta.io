import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureSession().pipe(
    map((session) => {
      if (session.authenticated && session.roles.includes('ADMIN')) {
        return true;
      }

      if (session.authenticated) {
        return router.createUrlTree(['/']);
      }

      return router.createUrlTree(['/oauth'], {
        queryParams: { redirect: state.url }
      });
    })
  );
};
