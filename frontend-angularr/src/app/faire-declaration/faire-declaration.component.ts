import { Component, OnInit } from '@angular/core';
import { Declaration, GestionParcService } from '../gestion-parc.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faire-declaration',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './faire-declaration.component.html',
  styleUrl: './faire-declaration.component.css'
})
export class FaireDeclarationComponent implements OnInit {
  
  declarationData = {
    id_declaration: null as number | null,
    type: 'PANNE',
    description: ''
  };

  mesDeclarations: Declaration[] = [];
  idChauffeur!: number;
  loading: boolean = false;
  messageSuccess: string = '';
  messageError: string = '';
  showPreloader = true;
  isUpdateMode = false;

  constructor(private apiService: GestionParcService) {}

  ngOnInit(): void {
    setTimeout(() => this.showPreloader = false, 2000);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.idChauffeur = user.id;
      if (this.idChauffeur) { this.chargerHistorique(); }
    }
  }

  chargerHistorique() {
    this.apiService.getDeclarationsByChauffeur(this.idChauffeur).subscribe({
      next: (data) => { this.mesDeclarations = data; },
      error: () => { this.messageError = "Erreur de chargement de l'historique."; }
    });
  }

  preparerModification(dec: any) {
    this.isUpdateMode = true;
    // On essaye de trouver l'ID peu importe son nom
    this.declarationData.id_declaration = dec.idDeclaration || dec.id_declaration || dec.id;
    this.declarationData.type = dec.type;
    this.declarationData.description = dec.description;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.messageSuccess = "Modification de la déclaration #" + this.declarationData.id_declaration;
  }

  annulerModification() {
    this.isUpdateMode = false;
    this.declarationData = { id_declaration: null, type: 'PANNE', description: '' };
    this.messageSuccess = '';
  }

  soumettreDeclaration() {
  if (!this.declarationData.description.trim()) {
    this.messageError = "La description est obligatoire.";
    return;
  }

  this.loading = true;
  this.messageError = '';

  if (this.isUpdateMode && this.declarationData.id_declaration) {
    // On prépare exactement ce que le Map<String, Object> attend en Java
    const payload = {
      type: this.declarationData.type,
      description: this.declarationData.description
    };

    this.apiService.updateDeclaration(this.declarationData.id_declaration, payload).subscribe({
      next: () => {
        this.finaliserAction("Déclaration mise à jour avec succès.");
      },
      error: (err) => {
        this.loading = false;
        this.messageError = "Erreur lors de la modification.";
        console.error("Erreur détaillée:", err);
      }
    });
  } else {
    // ... votre code de création (creerDeclaration) qui fonctionne déjà
    this.apiService.creerDeclaration(this.idChauffeur, this.declarationData.type, this.declarationData.description).subscribe({
        next: () => this.finaliserAction("Déclaration envoyée !"),
        error: () => { this.loading = false; this.messageError = "Erreur d'envoi."; }
    });
  }
}

  finaliserAction(msg: string) {
    this.messageSuccess = msg;
    this.isUpdateMode = false;
    this.declarationData = { id_declaration: null, type: 'PANNE', description: '' };
    this.chargerHistorique();
    this.loading = false;
  }

  getBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'EN_ATTENTE': return 'bg-warning text-dark';
      case 'TRAITE': return 'bg-success';
      case 'REJETE': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
  supprimerDeclaration(id: number | undefined) {
    if (!id) return;

    // Utilisation d'une confirmation standard (ou votre modal personnalisé)
    if (confirm("Voulez-vous vraiment supprimer définitivement cette déclaration ?")) {
      this.loading = true;
      this.apiService.deleteDeclaration(id, this.idChauffeur).subscribe({
        next: () => {
          this.messageSuccess = "Déclaration supprimée avec succès.";
          this.chargerHistorique(); // Rafraîchir la liste
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.messageError = "Erreur : Impossible de supprimer (Déjà traitée ou accès refusé).";
          console.error(err);
        }
      });
    }
  }
  
}