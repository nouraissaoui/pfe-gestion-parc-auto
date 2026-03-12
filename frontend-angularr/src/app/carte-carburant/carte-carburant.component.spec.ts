import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarteCarburantComponent } from './carte-carburant.component';

describe('CarteCarburantComponent', () => {
  let component: CarteCarburantComponent;
  let fixture: ComponentFixture<CarteCarburantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarteCarburantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarteCarburantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
