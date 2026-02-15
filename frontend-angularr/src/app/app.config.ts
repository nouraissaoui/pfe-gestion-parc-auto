import { provideRouter } from '@angular/router';
import { routes } from './app.routes';  // maintenant ça fonctionne

export const appConfig = {
  providers: [
    provideRouter(routes)
  ]
};
