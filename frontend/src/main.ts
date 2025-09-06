import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {importProvidersFrom} from '@angular/core';
import {ThumbsUp , LucideAngularModule} from 'lucide-angular';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(
      LucideAngularModule.pick({ ThumbsUp  }) // 👈 registers the "house" icon
    ),
  ],
}).catch((err) => console.error(err));
