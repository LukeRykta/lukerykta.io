import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CenterCard } from './center-card';

describe('CenterCard', () => {
  let component: CenterCard;
  let fixture: ComponentFixture<CenterCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CenterCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CenterCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
