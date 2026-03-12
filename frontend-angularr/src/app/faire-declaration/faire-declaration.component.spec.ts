import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaireDeclarationComponent } from './faire-declaration.component';

describe('FaireDeclarationComponent', () => {
  let component: FaireDeclarationComponent;
  let fixture: ComponentFixture<FaireDeclarationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaireDeclarationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaireDeclarationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
