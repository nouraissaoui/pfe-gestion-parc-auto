import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Adminlayoutcomponent } from './adminlayoutcomponent.component';

describe('AdminlayoutcomponentComponent', () => {
  let component: Adminlayoutcomponent;
  let fixture: ComponentFixture<Adminlayoutcomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adminlayoutcomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Adminlayoutcomponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
