import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

import { InfiniteHero } from './infinite-hero';
import { ProjectShowcase } from '../project-showcase/project-showcase';

@Component({
  selector: 'app-project-showcase',
  standalone: true,
  template: '<div data-testid="project-showcase-stub"></div>'
})
class ProjectShowcaseStub {}

describe('InfiniteHero', () => {
  let component: InfiniteHero;
  let fixture: ComponentFixture<InfiniteHero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfiniteHero, ProjectShowcaseStub],
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ ChevronDown }))
      ]
    })
      .overrideComponent(InfiniteHero, {
        remove: { imports: [ProjectShowcase] },
        add: { imports: [ProjectShowcaseStub] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(InfiniteHero);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle showcase visibility state', () => {
    expect(component.showcaseHidden()).toBeFalse();
    component.toggleShowcase();
    expect(component.showcaseHidden()).toBeTrue();
  });
});
