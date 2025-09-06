import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Oauth } from './oauth';

describe('Oauth', () => {
  let component: Oauth;
  let fixture: ComponentFixture<Oauth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Oauth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Oauth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
