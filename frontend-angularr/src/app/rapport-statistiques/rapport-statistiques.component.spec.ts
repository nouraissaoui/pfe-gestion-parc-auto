import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportStatistiquesComponent } from './rapport-statistiques.component';

describe('RapportStatistiquesComponent', () => {
  let component: RapportStatistiquesComponent;
  let fixture: ComponentFixture<RapportStatistiquesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportStatistiquesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportStatistiquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
