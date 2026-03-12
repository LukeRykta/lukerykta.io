import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let authStub: { isAdmin: WritableSignal<boolean> };

  beforeEach(async () => {
    authStub = {
      isAdmin: signal(false)
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide dashboard link for non-admin users', () => {
    const links = fixture.nativeElement.textContent as string;
    expect(links).not.toContain('Dashboard');
  });

  it('should show dashboard link for admin users', () => {
    authStub.isAdmin.set(true);
    fixture.detectChanges();

    const links = fixture.nativeElement.textContent as string;
    expect(links).toContain('Dashboard');
  });
});
