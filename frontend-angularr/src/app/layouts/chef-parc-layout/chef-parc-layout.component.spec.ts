import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefParcLayoutComponent } from './chef-parc-layout.component';

describe('ChefParcLayoutComponent', () => {
  let component: ChefParcLayoutComponent;
  let fixture: ComponentFixture<ChefParcLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefParcLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefParcLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
