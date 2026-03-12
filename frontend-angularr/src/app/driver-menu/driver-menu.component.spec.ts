import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverMenuComponent } from './driver-menu.component';

describe('DriverMenuComponent', () => {
  let component: DriverMenuComponent;
  let fixture: ComponentFixture<DriverMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
