import { Component, OnInit } from '@angular/core';
import { ChefParc, GestionParcService, Local } from '../gestion-parc.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Adminlayoutcomponent } from "../adminlayoutcomponent/adminlayoutcomponent.component";

@Component({
  selector: 'app-chef-parc',
  templateUrl: './chef-parc.component.html',
  imports: [CommonModule, FormsModule, Adminlayoutcomponent],
  styleUrls: ['./chef-parc.component.css']
})
export class ChefParcComponent implements OnInit {
  chefs: ChefParc[] = [];
  locaux: Local[] = [];
  selectedChefId: number | null = null;// Fonction pour vérifier si un local est déjà pris

  isEditMode: boolean = false; // Pour savoir si on modifie ou on ajoute
stats: any;
  isLocalOccupe(idLocal: number | undefined): boolean {
  // 1. Sécurité si l'ID est manquant
  if (idLocal === undefined || idLocal === null) return false; 
  
  // 2. Vérification dans la liste des chefs
  return this.chefs.some(chef => 
    chef.local && 
    chef.local.idLocal === idLocal && 
    chef.idChefParc !== this.selectedChefId
  );
}
  // Cet objet correspond au Map<String, Object> de ton contrôleur Java
  chefForm: any = {
    nom: '',
    prenom: '',
    mail: '',
    motDePasse: '',
    niveauResponsabilite: 'LOCAL_PRINCIPAL',
    dateNomination: '',
    ancienneteChef: 0,
    idLocal: null // L'ID qui sera extrait par payload.get("idLocal")
  };

  constructor(private gestionService: GestionParcService) {}

  ngOnInit(): void {
    this.chargerDonnees();
      setTimeout(() => this.showPreloader = false, 2500);

  }

  chargerDonnees() {
    // 1. Charger les chefs
    this.gestionService.getAllChefs().subscribe(data => this.chefs = data);
    // 2. Charger les locaux pour le menu déroulant
    this.gestionService.getAllLocaux().subscribe(data => this.locaux = data);
  }
preparerModification(chef: ChefParc) {
  this.isEditMode = true; 
  this.selectedChefId = chef.idChefParc ?? null;
  this.isModalOpen = true; 
  
  // On crée un nouvel objet propre
  this.chefForm = {
    nom: chef.nom,
    prenom: chef.prenom,
    mail: chef.mail,
    // On convertit explicitement une valeur absente en null pour le select
    niveauResponsabilite: chef.niveauResponsabilite === undefined ? null : chef.niveauResponsabilite,
    dateNomination: chef.dateNomination,
    ancienneteChef: chef.ancienneteChef,
    idLocal: chef.local?.idLocal || null,
    motDePasse: '' 
  };
}
showSuccessState: boolean = false;
isSubmitting: boolean = false;

playSuccessSound() {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); 
  audio.volume = 0.5;
  audio.play();
}
  
 soumettreFormulaire() {
  if (this.isSubmitting) return;
  this.isSubmitting = true;

  if (this.isEditMode && this.selectedChefId) {
    // On envoie directement chefForm qui contient le niveauResponsabilite mis à jour
    this.gestionService.updateChefParc(this.selectedChefId, this.chefForm).subscribe({
      next: () => {
        this.terminerAvecSucces();
        // Optionnel : Recharger immédiatement les données locales pour être sûr
        this.chargerDonnees();
      },
      error: (err) => { 
        this.isSubmitting = false; 
        console.error("Erreur lors de la mise à jour:", err);
      }
    });
  } else {
    this.ajouterChef();
  }
}
terminerAvecSucces() {
  this.isSubmitting = false;   // Arrête le spinner
  this.showSuccessState = true; // Devient VERT (C'est bon !)
  this.playSuccessSound();      // Le petit son cristallin

  setTimeout(() => {
    this.isModalOpen = false;   // Ferme la modale
    
    // On attend la fin de l'animation de fermeture pour reset le reste
    setTimeout(() => {
      this.showSuccessState = false;
      this.isEditMode = false;
      this.resetForm();
      this.chargerDonnees();
    }, 400);
  }, 1500); // Temps pour que l'utilisateur voie que "C'est bon"
}

  annulerEdition() {
    this.isEditMode = false;
    this.selectedChefId = null;
    this.resetForm();
  }
 ajouterChef() {
  this.isSubmitting = true; // 1. Le bouton commence à tourner

  this.gestionService.createChefParc(this.chefForm).subscribe({
    next: (res) => {
      // 2. ON DIT "C'EST BON" ICI
      this.terminerAvecSucces(); 
      // Cette méthode va jouer le son, mettre le bouton en vert, 
      // puis fermer la modale après 1.5s
    },
    error: (err) => {
      this.isSubmitting = false; // On arrête de tourner si ça échoue
      alert("Erreur lors de l'ajout : " + err.error);
    }
  });
}
libererLocal(chef: ChefParc | null) {
  if (!chef || !chef.idChefParc) return;

  // On envoie null pour l'ID du local
  const updateData = { idLocal: null };

  this.gestionService.updateChefParc(chef.idChefParc, updateData).subscribe({
    next: () => {
      this.playDisengageSound(); // Un son différent pour la libération
      this.chargerDonnees();
      this.showQuickAssign = false;
    },
    error: () => alert("Erreur lors de la libération du local")
  });
}// Optionnel : Un son plus léger pour "détacher" un élément
playDisengageSound() {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  audio.volume = 0.3;
  audio.play();
}
supprimerChef(id: number) {
  if (!id) return;

  if (confirm('Voulez-vous supprimer ce chef et libérer son local en un seul clic ?')) {
    this.gestionService.deleteChefParc(id).subscribe({
      next: (response) => {
        // On arrive ici UNIQUEMENT si la suppression en base de données a réussi
        console.log('Suppression réussie :', response);
        
        // On met à jour l'interface : on retire le chef de la liste
        this.chefs = this.chefs.filter(c => c.idChefParc !== id);
        
        // Optionnel : Recharger les locaux pour être sûr que le menu déroulant est à jour
        this.chargerDonnees(); 
        
        alert("Chef supprimé et local libéré !");
      },
      error: (err) => {
        console.error('Erreur lors de la suppression :', err);
        alert("Le serveur n'a pas pu supprimer le chef. Vérifiez les contraintes SQL.");
      }
    });
  }
}

  resetForm() {
    this.chefForm = { nom: '', prenom: '', mail: '', motDePasse: '', niveauResponsabilite: 'LOCAL_PRINCIPAL', idLocal: null };
  }
  isModalOpen: boolean = false;
searchText: string = '';
filteredChefs: ChefParc[] = [];

openModal() { 
  this.isEditMode = false; // Désactive explicitement le mode édition
  this.selectedChefId = null; // Nettoie l'ID pour ne pas écraser un ancien chef
  this.isModalOpen = true; 
  this.resetForm(); // Vide les champs
}
closeModal() {
  this.isModalOpen = false;
  this.isEditMode = false;
  this.selectedChefId = null;
}
filterTable() {
  const val = this.searchText.toLowerCase();
  this.filteredChefs = this.chefs.filter(c =>
    (c.nom + ' ' + c.prenom).toLowerCase().includes(val) ||
    c.local?.nomLocal.toLowerCase().includes(val)
  );
}



// Pour les statistiques
getUniqueLocaux() {
  const locauxAssignes = this.chefs
    .map(c => c.local?.nomLocal)
    .filter(nom => nom !== undefined && nom !== null && nom !== '');
    
  return new Set(locauxAssignes).size;
}
getLocauxLibres() {
  return this.locaux.length - this.getUniqueLocaux();
}
getUniqueRoles() {
  return new Set(this.chefs.map(c => c.niveauResponsabilite)).size;
}

  // Variables pour le sélecteur rapide
showQuickAssign: boolean = false;
activeChef: ChefParc | null = null;
menuPosition = { x: 0, y: 0 };

toggleQuickMenu(event: MouseEvent, chef: ChefParc) {
  event.stopPropagation(); // Empêche de déclencher d'autres clics
  this.activeChef = chef;
  this.showQuickAssign = !this.showQuickAssign;
  
  // Positionne le menu exactement sous la souris
  this.menuPosition = { x: event.clientX, y: event.clientY };
}

assignerLocalRapide(idLocal: number) {
  if (!this.activeChef?.idChefParc) return;
  
  // On prépare un mini-payload
  const updateData = { idLocal: idLocal };
  
  this.gestionService.updateChefParc(this.activeChef.idChefParc, updateData).subscribe({
    next: () => {
      this.playSuccessSound();
      this.chargerDonnees();
      this.showQuickAssign = false;
    },
    error: () => alert("Erreur d'affectation rapide")
  });
}
hoveredChef: ChefParc | null = null;
mouseX = 0;
mouseY = 0;

onMouseEnter(event: MouseEvent, chef: ChefParc) {
  this.hoveredChef = chef;
  this.updateMousePos(event);
}

onMouseLeave() {
  this.hoveredChef = null;
}

updateMousePos(event: MouseEvent) {
  // On décale un peu la carte pour ne pas cacher le curseur
  this.mouseX = event.clientX + 20; 
  this.mouseY = event.clientY - 120;
}
  showPreloader = true;
 imprimerRapport() {
  const dateExport = new Date().toLocaleDateString('fr-FR');
  const heureExport = new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
  const fenetre = window.open('', '', 'height=900,width=1100');

  fenetre?.document.write(`
    <html>
      <head>
        <title>Rapport de Gestion SNDP AGIL</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 0; /* On gère les marges via le CSS pour le design */
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }

          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; padding: 0; background: #fff;
            color: #2c3e50;
          }

          .container {
            padding: 15mm;
            min-height: 297mm;
            box-sizing: border-box;
            position: relative;
            display: flex;
            flex-direction: column;
          }

          /* Bordure décorative élégante */
          .page-border {
            position: absolute;
            top: 10mm; left: 10mm; right: 10mm; bottom: 10mm;
            border: 1px solid #d4af37;
            pointer-events: none;
            z-index: 0;
          }

          .watermark {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 7rem; color: rgba(128, 0, 32, 0.03);
            font-weight: 900; z-index: -1; pointer-events: none;
            white-space: nowrap;
          }

          .header { 
            display: flex; justify-content: space-between; 
            align-items: center; border-bottom: 3px solid #800020; 
            padding-bottom: 25px; margin-bottom: 30px;
            position: relative; z-index: 1;
          }

          .logo-box img { height: 85px; filter: contrast(1.1); }

          .titre-section { text-align: right; }
          h1 { 
            font-family: 'Playfair Display', serif; 
            color: #800020; margin: 0; font-size: 32px; 
            text-transform: uppercase; letter-spacing: 1px;
          }

          .doc-type {
            font-weight: 700; color: #d4af37;
            font-size: 12px; letter-spacing: 3px;
            margin-top: 5px;
          }

          .meta-info { font-size: 11px; color: #7f8c8d; margin-top: 8px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; position: relative; z-index: 1; }
          
          thead th { 
            background: #800020; color: #ffffff; 
            text-transform: uppercase; font-size: 11px;
            letter-spacing: 1.2px; padding: 15px 10px;
            text-align: left;
          }

          tbody tr { border-bottom: 1px solid #f1f1f1; transition: background 0.3s; }
          tbody tr:nth-child(even) { background: #fafafa; }
          
          /* Empêche de couper un employé en deux sur deux pages */
          tbody tr { page-break-inside: avoid; break-inside: avoid; }

          td { padding: 14px 10px; font-size: 12px; vertical-align: middle; }
          
          .name-cell { color: #1a1a1a; font-weight: 700; }
          .email-cell { color: #34495e; font-family: monospace; font-size: 11px; }
          
          .badge-level {
            padding: 4px 10px; border-radius: 4px;
            background: rgba(212, 175, 55, 0.15);
            color: #996515; font-weight: 700; font-size: 10px;
            text-transform: uppercase; border: 1px solid rgba(212, 175, 55, 0.3);
          }

          .location-tag {
            display: flex; align-items: center; gap: 6px;
            font-weight: 600; color: #800020;
          }
          .dot { width: 6px; height: 6px; background: #d4af37; border-radius: 50%; }

          .footer-stats {
            margin-top: auto; 
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 25px; padding: 25px 0;
            border-top: 1px dashed #d4af37;
            position: relative; z-index: 1;
          }

          .stat-card {
            background: #fff; padding: 15px;
            border-radius: 8px; border-left: 4px solid #800020;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
          }
          .stat-val { display: block; font-size: 22px; font-weight: 900; color: #800020; }
          .stat-label { font-size: 10px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; }

          .signature-section { 
            display: flex; justify-content: space-between; 
            padding: 40px 50px; position: relative; z-index: 1;
          }
          .sig-block { text-align: center; width: 200px; }
          .sig-title { font-size: 11px; font-weight: 700; color: #2c3e50; margin-bottom: 50px; }
          .sig-line { border-top: 1px solid #2c3e50; width: 100%; }
        </style>
      </head>
      <body>
        <div class="page-border"></div>
        <div class="container">
          <div class="watermark">AGIL ENERGY</div>
          
          <div class="header">
            <div class="logo-box">
              <img src="https://tse3.mm.bing.net/th/id/OIP.44CtPu7RzdMRUoTbyhlAqAAAAA?w=300&h=366&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Logo AGIL">
            </div>
            <div class="titre-section">
              <h1>Rapport de Gestion</h1>
              <div class="doc-type">CONSEIL D'ADMINISTRATION</div>
              <div class="meta-info">Édité le ${dateExport} à ${heureExport}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Identité du Chef de Parc</th>
                <th>Gmail</th>
                <th>Local Affecté</th>
                <th>Niveau de Responsabilité</th>
              </tr>
            </thead>
            <tbody>
              ${this.chefs.map(chef => `
                <tr>
                  <td class="name-cell">${chef.nom.toUpperCase()} ${chef.prenom}</td>
                  <td class="email-cell">${chef.mail}</td>
                  <td>
                    <div class="location-tag">
                      <span class="dot"></span>
                      ${chef.local?.nomLocal || '---'}
                    </div>
                  </td>
                  <td>
                    <span class="badge-level">
                      ${(chef.niveauResponsabilite || 'NON DÉFINI').replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-stats">
            <div class="stat-card">
              <span class="stat-val">${this.chefs.length}</span>
              <span class="stat-label">Collaborateurs</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">${this.getUniqueLocaux()}</span>
              <span class="stat-label">Sites Actifs</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">${this.getLocauxLibres()}</span>
              <span class="stat-label">Postes Vacants</span>
            </div>
          </div>

          <div class="signature-section">
            <div class="sig-block">
              <div class="sig-title">RH & ADMINISTRATION</div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-block">
              <div class="sig-title">DIRECTION GÉNÉRALE</div>
              <div class="sig-line"></div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);

  fenetre?.document.close();
  setTimeout(() => { 
    fenetre?.focus(); // Important pour certains navigateurs
    fenetre?.print(); 
    fenetre?.close(); 
  }, 1200);
}

}