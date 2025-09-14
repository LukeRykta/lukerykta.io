import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InfiniteHero} from './infinite-hero';

describe('InfiniteHero', () => {
  let component: InfiniteHero;
  let fixture: ComponentFixture<InfiniteHero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfiniteHero]
    }).compileComponents();

    fixture = TestBed.createComponent(InfiniteHero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
