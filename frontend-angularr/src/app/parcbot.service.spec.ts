import { TestBed } from '@angular/core/testing';

import { ParcbotService } from './parcbot.service';

describe('ParcbotService', () => {
  let service: ParcbotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParcbotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
