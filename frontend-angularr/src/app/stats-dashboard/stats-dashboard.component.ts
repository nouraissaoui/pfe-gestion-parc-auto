import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-dashboard.component.html',
  styleUrls: ['./stats-dashboard.component.css']
})
export class StatsDashboardComponent implements OnInit {
  reportUrl: SafeResourceUrl | undefined;
  rapportEnvoye = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const baseUrl =
      'https://app.powerbi.com/reportEmbed?reportId=094d005a-d3a8-417f-bc41-231bd57a84e2&autoAuth=true&ctid=1ecd776d-d57f-4de0-a67a-eca9809e8d8d';
    const finalLink = `${baseUrl}&navContentPaneEnabled=false&filterPaneEnabled=false`;
    this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(finalLink);
  }

  envoyerRapportAdmin(): void {
    // ✅ Chaque envoi crée un nouveau signal avec timestamp unique
    // L'admin peut recevoir plusieurs notifications à la suite
    const payload = {
      pret: true,
      id: Date.now(), // identifiant unique pour chaque envoi
      timestamp: new Date().toISOString(),
      message: "Le rapport d'audit IA AGIL est prêt. Envoyé par le Chef de Parc."
    };
    localStorage.setItem('rapportPret', JSON.stringify(payload));
    this.rapportEnvoye = true;

    // Reset du bouton après 3 secondes → chef peut renvoyer
    setTimeout(() => {
      this.rapportEnvoye = false;
    }, 3000);
  }
}