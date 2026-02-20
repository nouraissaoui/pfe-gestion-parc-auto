import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { GestionParcService, Vehicule } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vehicules-chef',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vehicules-chef.component.html',
  styleUrl: './vehicules-chef.component.css'
})
export class VehiculesChefComponent implements OnInit, AfterViewInit {
  // --- Données ---
  vehicules: Vehicule[] = [];
  filteredVehicules: Vehicule[] = [];
  chauffeursFiltres: any[] = [];
  
  // --- Stats ---
  totalVehicules = 0;
  missionsEnCours = 0;
  vehiculesDisponibles = 0;
  vehiculesEnEntretien = 0;
  vehiculesIndisponibles = 0;

  // --- État UI ---
  localId: number = 0;
  currentFilter: string = 'ALL';
  selectedVehicule: Vehicule | null = null;
  selectedChauffeurId: number | null = null;
  nouvelEtat: 'DISPONIBLE' | 'EN_MISSION' | 'EN_ENTRETIEN' | 'INDISPONIBLE' = 'DISPONIBLE';

  // --- Modals ---
  showModal = false;          // Modal Mise à jour état
  showConsultModal = false;   // Modal Consultation
  showAffecterModal = false;  // Modal Affectation chauffeur

  // --- Animation Particles ---
  @ViewChild('particlesCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private particles: any[] = [];
  private W = 0;
  private H = 0;

  constructor(private service: GestionParcService) {}

  ngOnInit(): void {
    this.loadSession();
    if (this.localId) {
      this.refreshData();
    }
  }

  ngAfterViewInit(): void {
    if (this.canvasRef) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
      this.resizeCanvas();
      this.initParticles();
      this.animateParticles();
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }

  // ================= LOAD DATA =================

  loadSession() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      // On s'assure de récupérer l'idLocal correctement
      this.localId = user.idLocal || user.id_local; 
    }
  }

  refreshData() {
    this.loadDashboard();
    this.loadVehicules();
  }

  loadDashboard() {
    this.service.getTotalVehicules(this.localId).subscribe(data => this.totalVehicules = data);
    this.service.getVehiculesEnMission(this.localId).subscribe(data => this.missionsEnCours = data);
    this.service.getVehiculesDisponibles(this.localId).subscribe(data => this.vehiculesDisponibles = data);
    this.service.getVehiculesEnEntretien(this.localId).subscribe(data => this.vehiculesEnEntretien = data);
    this.service.getVehiculesIndisponibles(this.localId).subscribe(data => this.vehiculesIndisponibles = data);
  }

  loadVehicules() {
    this.service.getVehiculesByLocal(this.localId).subscribe({
      next: (data) => {
        this.vehicules = data;
        this.filterByEtat(this.currentFilter);
      },
      error: (err) => console.error("Erreur chargement véhicules", err)
    });
  }

  filterByEtat(etat: string) {
    this.currentFilter = etat;
    if (etat === 'ALL') {
      this.filteredVehicules = [...this.vehicules];
    } else {
      this.filteredVehicules = this.vehicules.filter(v => v.etat === etat);
    }
  }

  // ================= LOGIQUE AFFECTATION =================

  verifierDisponibilite(v: Vehicule) {
    if (v.etat !== 'DISPONIBLE') {
      this.playNotificationSound();
      Swal.fire({
        title: 'VÉHICULE NON DISPONIBLE',
        html: `
          <div style="text-align: center; font-family: 'Rajdhani', sans-serif;">
            <p style="color: #ccc; margin-bottom: 10px;">L'affectation est impossible pour le matricule :</p>
            <p style="color: #F5C800; font-weight: bold; font-size: 1.2rem;">${v.matricule}</p>
            <p style="font-size: 0.9rem; margin-top: 15px; color: #ff4d4d;">ÉTAT ACTUEL : ${v.etat}</p>
          </div>
        `,
        icon: 'warning',
        background: '#141414',
        confirmButtonColor: '#F5C800',
        confirmButtonText: 'COMPRIS'
      });
    } else {
      this.ouvrirModalAffectation(v);
    }
  }

  ouvrirModalAffectation(v: Vehicule) {
    this.selectedVehicule = v;
    this.service.getChauffeursParLocal(this.localId).subscribe({
      next: (data) => {
        this.chauffeursFiltres = data;
        this.showAffecterModal = true;
      },
      error: (err) => {
        console.error("Erreur chargement chauffeurs", err);
        Swal.fire('Erreur', 'Impossible de charger la liste des chauffeurs', 'error');
      }
    });
  }

confirmerAffectation() {
  if (this.selectedChauffeurId && this.selectedVehicule) {
    
    // 1. Vérification locale avant l'appel API
    const chauffeurSelectionne = this.chauffeursFiltres.find(c => c.idChauffeur === this.selectedChauffeurId);
    
    if (chauffeurSelectionne && chauffeurSelectionne.vehicule) {
      this.playNotificationSound(); // Son d'alerte
      Swal.fire({
        title: 'ACTION IMPOSSIBLE',
        text: `Le chauffeur ${chauffeurSelectionne.user?.nom} possède déjà un véhicule.`,
        icon: 'warning',
        background: '#141414',
        color: '#fff',
        confirmButtonColor: '#F5C200'
      });
      return; // On arrête l'exécution ici
    }

    // 2. Si le chauffeur est libre, on lance l'appel API
    this.service.affecterVehicule(this.selectedChauffeurId, this.selectedVehicule.idVehicule)
      .subscribe({
        next: (response) => {
          this.playSuccessSound();
          Swal.fire({
            title: 'AFFECTATION RÉUSSIE',
            text: `Le véhicule est désormais assigné à ${chauffeurSelectionne?.user?.nom}`,
            icon: 'success',
            background: '#141414',
            color: '#fff',
            confirmButtonColor: '#F5C200'
          });
          this.showAffecterModal = false;
          this.selectedChauffeurId = null; // Reset de la sélection
          this.refreshData(); // Rafraîchir les compteurs et la liste
        },
        error: (err) => {
          console.error("Erreur Backend:", err);
          
          // Récupération du message d'erreur envoyé par le throw new RuntimeException du Java
          const errorMsg = typeof err.error === 'string' ? err.error : "Erreur technique lors de l'affectation.";
          
          Swal.fire({
            title: 'ÉCHEC DE L\'OPÉRATION',
            text: errorMsg,
            icon: 'error',
            background: '#141414',
            color: '#fff',
            confirmButtonColor: '#ff4d4d'
          });
        }
      });
  }
}
  // ================= AUTRES ACTIONS =================

  consulterVehicule(v: Vehicule) {
    this.selectedVehicule = v;
    this.showConsultModal = true;
  }

  modifierVehicule(v: Vehicule) {
    this.selectedVehicule = v;
    this.nouvelEtat = v.etat;
    this.showModal = true;
  }

  confirmerMiseAJour() {
    if (this.selectedVehicule) {
      this.service.updateEtatVehicule(this.selectedVehicule.idVehicule, this.nouvelEtat)
        .subscribe({
          next: () => {
            this.showModal = false;
            this.refreshData();
          },
          error: (err) => console.error("Erreur mise à jour", err)
        });
    }
  }

  // ================= UTILS UI =================

  closeModal() { this.showModal = false; }
  closeConsultModal() { this.showConsultModal = false; }
  closeAffecterModal() { 
    this.showAffecterModal = false; 
    this.selectedChauffeurId = null;
  }

  private playNotificationSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  }

  private playSuccessSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    audio.play().catch(() => {});
  }

  // ================= PARTICLES ENGINE =================

  private resizeCanvas() {
    if (!this.canvasRef) return;
    this.W = this.canvasRef.nativeElement.width = this.canvasRef.nativeElement.offsetWidth;
    this.H = this.canvasRef.nativeElement.height = this.canvasRef.nativeElement.offsetHeight;
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        r: Math.random() * 2.2 + 0.4,
        alpha: Math.random() * 0.5 + 0.08,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35 - 0.2,
        gold: Math.random() > 0.45
      });
    }
  }

  private animateParticles() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.W, this.H);
    for (let p of this.particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10) p.y = this.H + 10;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = p.gold ? `rgba(245,194,0,${p.alpha})` : `rgba(200,190,160,${p.alpha})`;
      this.ctx.fill();
    }
    requestAnimationFrame(() => this.animateParticles());
  }
}