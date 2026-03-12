import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChauffeurGestionComponent } from './chauffeur-gestion.component';

describe('ChauffeurGestionComponent', () => {
  let component: ChauffeurGestionComponent;
  let fixture: ComponentFixture<ChauffeurGestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChauffeurGestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChauffeurGestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
