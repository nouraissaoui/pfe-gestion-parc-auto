import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocauxadminComponent } from './locauxadmin.component';

describe('LocauxadminComponent', () => {
  let component: LocauxadminComponent;
  let fixture: ComponentFixture<LocauxadminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocauxadminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocauxadminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
