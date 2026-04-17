import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationFeuillesComponent } from './consultation-feuilles.component';

describe('ConsultationFeuillesComponent', () => {
  let component: ConsultationFeuillesComponent;
  let fixture: ComponentFixture<ConsultationFeuillesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultationFeuillesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultationFeuillesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
