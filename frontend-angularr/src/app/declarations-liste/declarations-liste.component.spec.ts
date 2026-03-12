import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclarationsListeComponent } from './declarations-liste.component';

describe('DeclarationsListeComponent', () => {
  let component: DeclarationsListeComponent;
  let fixture: ComponentFixture<DeclarationsListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarationsListeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeclarationsListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
