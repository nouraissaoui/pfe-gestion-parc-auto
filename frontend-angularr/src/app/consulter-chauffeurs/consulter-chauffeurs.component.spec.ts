import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterChauffeursComponent } from './consulter-chauffeurs.component';

describe('ConsulterChauffeursComponent', () => {
  let component: ConsulterChauffeursComponent;
  let fixture: ComponentFixture<ConsulterChauffeursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsulterChauffeursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterChauffeursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
