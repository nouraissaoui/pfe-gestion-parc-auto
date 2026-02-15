import { TestBed } from '@angular/core/testing';

import { GestionParcService } from './gestion-parc.service';

describe('GestionParcService', () => {
  let service: GestionParcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionParcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
