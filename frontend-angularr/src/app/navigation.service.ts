import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  constructor(private router: Router) {}

  navigate(commands: any[]): void {
    this.router.navigate(commands, { skipLocationChange: true });
  }
}