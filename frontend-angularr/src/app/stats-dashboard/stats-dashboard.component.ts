import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { GestionParcService } from '../gestion-parc.service';

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

  constructor(private sanitizer: DomSanitizer,private service: GestionParcService ) {}

  ngOnInit(): void {
    const baseUrl =
      'https://app.powerbi.com/reportEmbed?reportId=094d005a-d3a8-417f-bc41-231bd57a84e2&autoAuth=true&ctid=1ecd776d-d57f-4de0-a67a-eca9809e8d8d';
    const finalLink = `${baseUrl}&navContentPaneEnabled=false&filterPaneEnabled=false`;
    this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(finalLink);
  }

// Dans stats-dashboard.component.ts

// stats-dashboard.component.ts

// stats-dashboard.component.ts

envoyerRapportAdmin(): void {
    const userJson = sessionStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    if (user && user.idLocal) {
        // On récupère les infos du local depuis la base de données via le service
        this.service.getLocalById(user.idLocal).subscribe({
            next: (localData: { nomLocal: any; }) => {
                const nomComplet = `${user.prenom} ${user.nom}`;
                // On utilise le nom provenant directement de la base (localData.nomLocal)
                const nomDuLocal = localData.nomLocal;

                const payload = {
                    pret: true,
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    titre: `Rapport envoyé par Chef de Parc : ${nomComplet}`,
                    sousTitre: `Local : ${nomDuLocal}`, // <--- Plus de "undefined"
                    message: "Le rapport d'audit IA AGIL est prêt."
                };

                localStorage.setItem('rapportPret', JSON.stringify(payload));
                this.rapportEnvoye = true;
                setTimeout(() => { this.rapportEnvoye = false; }, 3000);
            },
            error: (err: any) => {
                console.error("Erreur lors de la récupération du local", err);
                // Fallback si la base ne répond pas
                this.envoyerRapportSansLocal(user);
            }
        });
    }
}

// Méthode de secours si l'ID local est introuvable
private envoyerRapportSansLocal(user: any) {
    const payload = {
        pret: true,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        titre: `Rapport envoyé par Chef de Parc : ${user.prenom} ${user.nom}`,
        sousTitre: `Local : Non spécifié`,
        message: "Le rapport d'audit IA AGIL est prêt."
    };
    localStorage.setItem('rapportPret', JSON.stringify(payload));
}}