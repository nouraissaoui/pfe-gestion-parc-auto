import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationMissionComponent } from './affectation-mission.component';

describe('AffectationMissionComponent', () => {
  let component: AffectationMissionComponent;
  let fixture: ComponentFixture<AffectationMissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationMissionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffectationMissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
