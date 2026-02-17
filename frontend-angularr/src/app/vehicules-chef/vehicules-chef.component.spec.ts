import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculesChefComponent } from './vehicules-chef.component';

describe('VehiculesChefComponent', () => {
  let component: VehiculesChefComponent;
  let fixture: ComponentFixture<VehiculesChefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculesChefComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculesChefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
