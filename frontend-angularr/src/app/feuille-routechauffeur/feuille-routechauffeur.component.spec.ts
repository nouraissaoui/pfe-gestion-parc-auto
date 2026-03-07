import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeuilleRoutechauffeurComponent } from './feuille-routechauffeur.component';

describe('FeuilleRoutechauffeurComponent', () => {
  let component: FeuilleRoutechauffeurComponent;
  let fixture: ComponentFixture<FeuilleRoutechauffeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeuilleRoutechauffeurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeuilleRoutechauffeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
