import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspaceChefDuParcComponent } from './espace-chef-du-parc.component';

describe('EspaceChefDuParcComponent', () => {
  let component: EspaceChefDuParcComponent;
  let fixture: ComponentFixture<EspaceChefDuParcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaceChefDuParcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspaceChefDuParcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
