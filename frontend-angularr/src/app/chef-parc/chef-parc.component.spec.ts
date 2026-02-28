import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefParcComponent } from './chef-parc.component';

describe('ChefParcComponent', () => {
  let component: ChefParcComponent;
  let fixture: ComponentFixture<ChefParcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefParcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefParcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
