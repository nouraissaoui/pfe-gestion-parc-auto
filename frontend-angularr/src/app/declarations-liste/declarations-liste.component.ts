import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { Declaration, GestionParcService } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/* ─────────────────────────────────────────
    Particle System Interface
───────────────────────────────────────── */
interface Particle {
  x: number; y: number;
  size: number; speedX: number; speedY: number;
  opacity: number; maxOpacity: number;
  color: string; shape: 'circle' | 'diamond' | 'cross';
  life: number; maxLife: number;
  rotation: number; rotSpeed: number;
  oscillateX: number; oscillateOffset: number;
}

@Component({
  selector: 'app-declarations-liste',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './declarations-liste.component.html',
  styleUrl: './declarations-liste.component.css'
})
export class DeclarationsListeComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Data ──
  allDeclarations: Declaration[] = [];
  filteredDeclarations: Declaration[] = [];
  filtreActuel: string = 'EN_ATTENTE';
  searchQuery: string = '';

  // ── Modal & Maintenance ──
  selectedDec: Declaration | null = null;
  datePrevue: string = '';
  observations: string = '';
  showModal: boolean = false;
  
  idGarage: number | null = null;
  typeEntretien: string = '';
  listeGarages: any[] = [];

  // ── UI feedback ──
  showToast: boolean = false;
  toastMessage: string = '';
  private toastTimer: any;

  // ── Section labels ──
  sectionLabel: string = 'Déclarations en attente de traitement';
  private readonly sectionLabels: Record<string, string> = {
    EN_ATTENTE: 'Déclarations en attente de traitement',
    TRAITE:     'Déclarations traitées',
    REJETE:     'Déclarations rejetées',
    TOUT:       'Historique complet des déclarations'
  };

  // ── Canvas particles ──
  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animFrameId: number = 0;
  private canvasW: number = 0;
  private canvasH: number = 0;

  // ── Floating icons animation ──
  private floatAnimId: number = 0;
  private floatT: number = 0;

  private readonly COLORS = [
    'rgba(180,130,10,',
    'rgba(200,150,26,',
    'rgba(140,100,5,',
    'rgba(212,160,23,'
  ];

  constructor(private service: GestionParcService) {}

  /* ════════════════════════════════
      Lifecycle
  ════════════════════════════════ */

  ngOnInit(): void {
    this.chargerDeclarations();
    this.chargerGarages();
  }

  ngAfterViewInit(): void {
    this.initParticles();
    this.animateFloatingIcons();
  }

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.floatAnimId) cancelAnimationFrame(this.floatAnimId);
    clearTimeout(this.toastTimer);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
  }

  /* ════════════════════════════════
      Data & API
  ════════════════════════════════ */

  chargerGarages(): void {
    this.service.getGarages().subscribe({
      next: (data) => this.listeGarages = data,
      error: (err) => console.error('Erreur chargement garages', err)
    });
  }

  chargerDeclarations(): void {
    const idLocalStr = localStorage.getItem('idLocal');
    if (!idLocalStr) return;

    const idLocal = Number(idLocalStr);
    this.service.getToutesDeclarationsLocal(idLocal).subscribe({
      next: (data) => {
        this.allDeclarations = data;
        this.appliquerFiltre(this.filtreActuel);
      },
      error: (err) => console.error('Erreur de chargement', err)
    });
  }

  confirmerTraitement(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.showNotification("Erreur : Session utilisateur introuvable.");
      return;
    }
    const user = JSON.parse(userStr);
    
    // Sécurité : Récupération de l'ID selon votre ProfileResponse (id ou idChefParc)
    const userId = user.id || user.idChefParc;

    if (!this.selectedDec || !this.datePrevue || !this.idGarage || !this.typeEntretien || !userId) {
      this.showNotification("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    this.service.validerTraitementDeclaration(
      this.selectedDec.idDeclaration!,
      userId,
      this.idGarage,
      this.typeEntretien,
      this.datePrevue,
      this.observations || ''
    ).subscribe({
      next: () => {
        this.fermerModale();
        this.chargerDeclarations();
        this.showNotification('Ordre de maintenance généré avec succès !');
      },
      error: (err) => {
        console.error('Erreur traitement:', err);
        this.showNotification('Erreur : ' + (err.error?.message || 'Échec de la validation'));
      }
    });
  }

  /* ════════════════════════════════
      Filtres & Recherche
  ════════════════════════════════ */

  appliquerFiltre(statut: string): void {
    this.filtreActuel = statut;
    this.sectionLabel = this.sectionLabels[statut] ?? 'Déclarations';
    this.applySearchAndFilter();
  }

  onSearch(): void {
    this.applySearchAndFilter();
  }

  private applySearchAndFilter(): void {
    let base = this.filtreActuel === 'TOUT'
      ? [...this.allDeclarations]
      : this.allDeclarations.filter(d => d.status === this.filtreActuel);

    const query = this.searchQuery.trim().toLowerCase();
    
    if (query) {
      base = base.filter(dec => {
        return (
          dec.vehicule?.matricule?.toLowerCase().includes(query) ||
          dec.vehicule?.marque?.toLowerCase().includes(query) ||
          dec.chauffeur?.nom?.toLowerCase().includes(query) ||
          dec.description?.toLowerCase().includes(query) ||
          dec.type?.toLowerCase().includes(query)
        );
      });
    }
    this.filteredDeclarations = base;
  }

  countByStatus(status: string): number {
    return this.allDeclarations.filter(d => d.status === status).length;
  }

  /* ════════════════════════════════
      Modal Control
  ════════════════════════════════ */

  ouvrirModale(dec: Declaration): void {
    this.selectedDec = dec;
    this.datePrevue = '';
    this.observations = '';
    this.idGarage = null;
    this.typeEntretien = '';
    this.showModal = true;
  }

  fermerModale(): void {
    this.showModal = false;
    this.selectedDec = null;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.fermerModale();
    }
  }

  /* ════════════════════════════════
      UI Helpers
  ════════════════════════════════ */

  showNotification(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.showToast = false), 3500);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { EN_ATTENTE: 'attente', TRAITE: 'traite', REJETE: 'rejete' };
    return map[status] ?? '';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { EN_ATTENTE: 'En attente', TRAITE: 'Traité', REJETE: 'Rejeté' };
    return map[status] ?? status;
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = { PANNE: 'fa-bolt', ACCIDENT: 'fa-car-crash', ENTRETIEN: 'fa-tools' };
    return map[type] ?? 'fa-exclamation-circle';
  }

  /* ════════════════════════════════
      Particle System logic (Canvas)
  ════════════════════════════════ */

  private initParticles(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    for (let i = 0; i < 60; i++) this.particles.push(this.createParticle(true));
    this.renderParticles();
  }

  private resizeCanvas(): void {
    if (!this.canvasRef) return;
    this.canvasW = this.canvasRef.nativeElement.width = window.innerWidth;
    this.canvasH = this.canvasRef.nativeElement.height = window.innerHeight;
  }

  private createParticle(initial = false): Particle {
    const shapes: Array<'circle' | 'diamond' | 'cross'> = ['circle', 'diamond', 'cross'];
    const opacity = Math.random() * 0.4 + 0.05;
    return {
      x: Math.random() * this.canvasW,
      y: initial ? Math.random() * this.canvasH : this.canvasH + 20,
      size: Math.random() * 4 + 1.5,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: -(Math.random() * 0.6 + 0.2),
      opacity,
      maxOpacity: opacity,
      color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      life: 0,
      maxLife: Math.random() * 300 + 150,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      oscillateX: Math.random() * 0.5,
      oscillateOffset: Math.random() * Math.PI * 2
    };
  }

  private renderParticles(): void {
    this.animFrameId = requestAnimationFrame(() => this.renderParticles());
    this.ctx.clearRect(0, 0, this.canvasW, this.canvasH);
    this.particles.forEach((p, i) => {
      p.life++;
      p.x += p.speedX + Math.sin(p.life * 0.02 + p.oscillateOffset) * p.oscillateX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;
      const lr = p.life / p.maxLife;
      p.opacity = p.maxOpacity * (lr < 0.1 ? lr / 0.1 : lr > 0.8 ? (1 - lr) / 0.2 : 1);

      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color + p.opacity + ')';
      
      if (p.shape === 'circle') {
        this.ctx.beginPath(); this.ctx.arc(0, 0, p.size, 0, Math.PI * 2); this.ctx.fill();
      } else if (p.shape === 'diamond') {
        this.ctx.beginPath(); this.ctx.moveTo(0, -p.size * 1.5); this.ctx.lineTo(p.size, 0);
        this.ctx.lineTo(0, p.size * 1.5); this.ctx.lineTo(-p.size, 0); this.ctx.fill();
      }
      this.ctx.restore();

      if (p.life >= p.maxLife || p.y < -20) this.particles[i] = this.createParticle(false);
    });
  }

  private animateFloatingIcons(): void {
    const loop = () => {
      this.floatT++;
      [1, 2, 3, 4].forEach(id => {
        const el = document.querySelector(`.float-icon-${id}`) as HTMLElement;
        if (el) {
          const dy = Math.sin(this.floatT * 0.002 * 1000 + id) * 10;
          el.style.transform = `translateY(${dy}px) rotate(${dy * 0.5}deg)`;
        }
      });
      this.floatAnimId = requestAnimationFrame(loop);
    };
    this.floatAnimId = requestAnimationFrame(loop);
  }
}