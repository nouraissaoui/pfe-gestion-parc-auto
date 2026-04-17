import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  timestamp: string;
  message: string;
  lu: boolean;
  urlSecurisee: SafeResourceUrl;
}

@Component({
  selector: 'app-rapport-statistiques',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rapport-statistiques.component.html',
  styleUrls: ['./rapport-statistiques.component.css']
})
export class RapportStatistiquesComponent implements OnInit, OnDestroy {

  etat: 'attente' | 'liste' | 'rapport' = 'attente';

  // Historique de toutes les notifications reçues
  notifications: Notification[] = [];

  // Rapport actuellement ouvert
  rapportOuvert: Notification | null = null;

  private pollInterval: any;
  private storageListener: any;
  private dernierId: number = 0;

  // ✅ pageName = d201cd92aae14c7d1956 (page "Rapport Exécutif" détectée dans l'URL)
  // navContentPaneEnabled=false cache les boutons de navigation du bas
  // filterPaneEnabled=false cache les filtres
  private readonly EMBED_URL =
    'https://app.powerbi.com/reportEmbed' +
    '?reportId=094d005a-d3a8-417f-bc41-231bd57a84e2' +
    '&autoAuth=true' +
    '&ctid=1ecd776d-d57f-4de0-a67a-eca9809e8d8d' +
    '&pageName=d201cd92aae14c7d1956' +   // ← force la page Rapport Exécutif
    '&navContentPaneEnabled=false' +      // ← cache les boutons du bas
    '&filterPaneEnabled=false';           // ← cache les filtres

  constructor(private sanitizer: DomSanitizer, private ngZone: NgZone) {}

  ngOnInit(): void {
    // Charger l'historique sauvegardé
    const saved = localStorage.getItem('notificationsAdmin');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.notifications = parsed.map((n: any) => ({
        ...n,
        urlSecurisee: this.sanitizer.bypassSecurityTrustResourceUrl(this.EMBED_URL)
      }));
      if (this.notifications.length > 0) this.etat = 'liste';
    }

    this.verifierRapport();

    this.pollInterval = setInterval(() => {
      this.ngZone.run(() => this.verifierRapport());
    }, 2000);

    this.storageListener = (event: StorageEvent) => {
      if (event.key === 'rapportPret') {
        this.ngZone.run(() => this.verifierRapport());
      }
    };
    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
    window.removeEventListener('storage', this.storageListener);
  }

  private verifierRapport(): void {
    const raw = localStorage.getItem('rapportPret');
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      if (payload?.pret === true && payload.id !== this.dernierId) {
        this.dernierId = payload.id;

        // Ajouter la nouvelle notification à l'historique
        const nouvelleNotif: Notification = {
          id: payload.id,
          timestamp: payload.timestamp,
          message: payload.message,
          lu: false,
          urlSecurisee: this.sanitizer.bypassSecurityTrustResourceUrl(this.EMBED_URL)
        };

        this.notifications.unshift(nouvelleNotif); // Ajoute en tête de liste
        this.etat = 'liste';

        // Sauvegarder l'historique (sans urlSecurisee qui n'est pas sérialisable)
        this.sauvegarderHistorique();

        // Supprimer le signal pour que le chef puisse renvoyer
        localStorage.removeItem('rapportPret');
      }
    } catch {}
  }

  private sauvegarderHistorique(): void {
    const toSave = this.notifications.map(n => ({
      id: n.id,
      timestamp: n.timestamp,
      message: n.message,
      lu: n.lu
    }));
    localStorage.setItem('notificationsAdmin', JSON.stringify(toSave));
  }

  ouvrirRapport(notif: Notification): void {
    notif.lu = true;
    this.rapportOuvert = notif;
    this.etat = 'rapport';
    this.sauvegarderHistorique();
  }

  fermerRapport(): void {
    this.rapportOuvert = null;
    this.etat = 'liste';
  }

  supprimerNotif(notif: Notification, event: Event): void {
    event.stopPropagation();
    this.notifications = this.notifications.filter(n => n.id !== notif.id);
    this.sauvegarderHistorique();
    if (this.notifications.length === 0) this.etat = 'attente';
  }

  get nbNonLus(): number {
    return this.notifications.filter(n => !n.lu).length;
  }

  formaterDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}