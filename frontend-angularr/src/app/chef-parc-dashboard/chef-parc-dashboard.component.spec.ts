import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefParcDashboardComponent } from './chef-parc-dashboard.component';

describe('ChefParcDashboardComponent', () => {
  let component: ChefParcDashboardComponent;
  let fixture: ComponentFixture<ChefParcDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefParcDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefParcDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
