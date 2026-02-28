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
  this.isEditMode = true; // Active le mode édition
  this.selectedChefId = chef.idChefParc ?? null;
  this.isModalOpen = true; // On ouvre la modale ici directement
  
  // On remplit le formulaire avec les données actuelles
  this.chefForm = {
    nom: chef.nom,
    prenom: chef.prenom,
    mail: chef.mail,
    niveauResponsabilite: chef.niveauResponsabilite,
    dateNomination: chef.dateNomination,
    ancienneteChef: chef.ancienneteChef,
    idLocal: chef.local?.idLocal || null,
    motDePasse: '' // On ne touche pas au mot de passe en modification
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
  this.isSubmitting = true; // Active l'animation de chargement sur le bouton

  if (this.isEditMode && this.selectedChefId) {
    this.gestionService.updateChefParc(this.selectedChefId, this.chefForm).subscribe({
      next: () => {
        this.terminerAvecSucces();
      },
      error: () => { this.isSubmitting = false; alert("Erreur"); }
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

}