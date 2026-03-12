import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { importProvidersFrom } from '@angular/core';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronDown,
  ExternalLink,
  Github,
  House,
  Linkedin,
  LucideAngularModule,
  ShieldCheck,
  ThumbsUp,
  Trophy,
  UserRound
} from 'lucide-angular';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(
      LucideAngularModule.pick({
        ThumbsUp,
        ExternalLink,
        ChevronDown,
        House,
        BriefcaseBusiness,
        UserRound,
        ShieldCheck,
        Linkedin,
        Github,
        ArrowUpRight,
        Trophy
      })
    ),
  ],
}).catch((err) => console.error(err));
