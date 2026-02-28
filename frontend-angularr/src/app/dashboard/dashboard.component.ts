// src/app/dashboard/dashboard.component.ts
import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Adminlayoutcomponent } from "../adminlayoutcomponent/adminlayoutcomponent.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, Adminlayoutcomponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class DashboardComponent {

  cards = [
    // Ajout de /admin/ devant chaque route
    { id: '01', title: 'Chefs de Parc', subtitle: 'Mobilité AGIL', icon: 'fa-solid fa-user-shield', route: '/admin/chefsparc', gold: false },
    { id: '02', title: 'Gérer les chauffeurs', subtitle: 'Gouvernance Élite', icon: 'fa-solid fa-user-tie', route: '/admin/chauffeurs', gold: false },
    { id: '03', title: 'Flotte Véhicules', subtitle: 'Actifs Stratégiques', icon: 'fa-solid fa-car-side', route: '/admin/vehicules', gold: false },
    { id: '04', title: 'Unités & Locaux', subtitle: 'Infrastructures', icon: 'fa-solid fa-city', route: '/admin/locaux', gold: false },
    { id: '05', title: 'Rapports Généraux', subtitle: 'Intelligence Data', icon: 'fa-solid fa-chart-line', route: '/admin/rapports', gold: true }
  ];

  moveBg(e: MouseEvent) {
    const bg = document.getElementById('bgLayer');
    if (!bg) return;
    const x = (window.innerWidth - e.pageX) / 60;
    const y = (window.innerHeight - e.pageY) / 60;
    bg.style.transform = `translateX(${x}px) translateY(${y}px) scale(1.02)`;
  }

  resetBg() {
    const bg = document.getElementById('bgLayer');
    if (!bg) return;
    bg.style.transform = 'translateX(0) translateY(0) scale(1)';
  }

  updateHeaderLight(e: MouseEvent) {
    const header = document.querySelector('header') as HTMLElement;
    if (!header) return;
    const rect = header.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    header.style.setProperty('--x', `${x}%`);
    header.style.setProperty('--y', `${y}%`);
  }

  moveCursor(e: MouseEvent) {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursorFollower');
    if (!cursor || !follower) return;
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    follower.style.left = e.clientX + 'px';
    follower.style.top = e.clientY + 'px';
  }
}