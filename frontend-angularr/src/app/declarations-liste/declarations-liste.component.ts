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

  // ── Validation errors ──
  typeEntretienError: string = '';
  observationsError: string = '';
  datePrevueError: string = '';

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
    const idLocalStr = sessionStorage.getItem('idLocal');
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

  /* ════════════════════════════════
      Validation
  ════════════════════════════════ */

  getTomorrowDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  validateTypeEntretien(): boolean {
    const val = this.typeEntretien?.trim();
    if (!val) {
      this.typeEntretienError = 'Ce champ est obligatoire.';
      return false;
    }
    if (/^\d+$/.test(val)) {
      this.typeEntretienError = 'Veuillez saisir un type valide (pas uniquement des chiffres).';
      return false;
    }
    if (val.length < 3) {
      this.typeEntretienError = 'Minimum 3 caractères requis.';
      return false;
    }
    if (!/^[a-zA-ZÀ-ÿ0-9\s\-',./()+]+$/.test(val)) {
      this.typeEntretienError = 'Caractères spéciaux non autorisés.';
      return false;
    }
    this.typeEntretienError = '';
    return true;
  }

  validateObservations(): boolean {
    const val = this.observations?.trim();
    if (!val) {
      this.observationsError = 'Ce champ est obligatoire.';
      return false;
    }
    if (/^\d+$/.test(val)) {
      this.observationsError = 'Veuillez saisir une observation valide (pas uniquement des chiffres).';
      return false;
    }
    if (val.length < 10) {
      this.observationsError = 'Minimum 10 caractères requis.';
      return false;
    }
    this.observationsError = '';
    return true;
  }

  validateDatePrevue(): boolean {
    if (!this.datePrevue) {
      this.datePrevueError = 'La date est obligatoire.';
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(this.datePrevue);
    if (selected <= today) {
      this.datePrevueError = 'La date doit être strictement dans le futur.';
      return false;
    }
    this.datePrevueError = '';
    return true;
  }

  isFormValid(): boolean {
    if (this.selectedDec?.type === 'AMENDE') return true;
    const t = this.validateTypeEntretien();
    const o = this.validateObservations();
    const d = this.validateDatePrevue();
    return t && o && d && !!this.idGarage;
  }

  /* ════════════════════════════════
      Traitement
  ════════════════════════════════ */

  confirmerTraitement(): void {
    if (!this.selectedDec) {
      this.showNotification('Aucune déclaration sélectionnée.');
      return;
    }

    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      this.showNotification('Erreur : session utilisateur introuvable.');
      return;
    }

    const user = JSON.parse(userStr);
    const userId = user.id || user.idChefParc;
    if (!userId) {
      this.showNotification('Erreur : ID utilisateur introuvable.');
      return;
    }

    const isAmende = this.selectedDec.type === 'AMENDE';

    if (!isAmende && !this.isFormValid()) {
      this.showNotification('Veuillez corriger les erreurs avant de continuer.');
      return;
    }

    this.service.validerTraitementDeclaration(
      this.selectedDec.idDeclaration!,
      userId,
      isAmende ? 0 : this.idGarage!,
      this.typeEntretien || this.selectedDec.type,
      isAmende ? '' : this.datePrevue!,
      this.observations || ''
    ).subscribe({
      next: () => {
        this.fermerModale();
        this.chargerDeclarations();
        this.showNotification(isAmende
          ? 'Amende confirmée avec succès !'
          : "Ordre de maintenance généré avec succès !"
        );
        this.resetForm();
      },
      error: (err) => {
        console.error('Erreur traitement:', err);
        this.showNotification('Erreur lors du traitement : ' + (err.error?.message || 'Échec'));
      }
    });
  }

  private resetForm(): void {
    this.idGarage = null;
    this.datePrevue = '';
    this.typeEntretien = '';
    this.observations = '';
    this.selectedDec = null;
    this.typeEntretienError = '';
    this.observationsError = '';
    this.datePrevueError = '';
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
      base = base.filter(dec =>
        dec.vehicule?.matricule?.toLowerCase().includes(query) ||
        dec.vehicule?.marque?.toLowerCase().includes(query) ||
        dec.chauffeur?.nom?.toLowerCase().includes(query) ||
        dec.description?.toLowerCase().includes(query) ||
        dec.type?.toLowerCase().includes(query)
      );
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
    this.resetForm();
    this.selectedDec = dec; // re-assign après reset
    this.showModal = true;
  }

  fermerModale(): void {
    this.showModal = false;
    this.selectedDec = null;
    this.resetForm();
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
      Particle System (Canvas)
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
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'diamond') {
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size * 1.5);
        this.ctx.lineTo(p.size, 0);
        this.ctx.lineTo(0, p.size * 1.5);
        this.ctx.lineTo(-p.size, 0);
        this.ctx.fill();
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