import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcbotComponent } from './parcbot.component';

describe('ParcbotComponent', () => {
  let component: ParcbotComponent;
  let fixture: ComponentFixture<ParcbotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcbotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParcbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
