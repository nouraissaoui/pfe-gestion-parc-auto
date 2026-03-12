import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverLayoutComponent } from './driver-layout.component';

describe('DriverLayoutComponent', () => {
  let component: DriverLayoutComponent;
  let fixture: ComponentFixture<DriverLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
