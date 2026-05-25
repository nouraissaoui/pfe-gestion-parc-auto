import {
  Component, ElementRef, ViewChild, AfterViewChecked, OnInit
} from '@angular/core';
import { ChatService, ChatResponse, ChatPayload } from '../chat.service';
import { FormsModule } from '@angular/forms';//permet l’utilisation du [(ngModel)] pour la liaison bidirectionnelle des données.
import { CommonModule } from '@angular/common';//fournit les directives Angular comme *ngIf et *ngFor

//Cette interface définit la structure d’un message dans la conversation
interface Message {
  text: string;//contenu du message
  sender: 'user' | 'bot';//indique si le message vient de l’utilisateur ou du bot.
  time: string;//heure d’envoi
  isLoading?: boolean;//afficher l’animation de chargement.
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {

  userMessage = '';//le message tapé par l'utilisateur
  messages: Message[] = [];//tableau contenant l’historique des messages.
  loading = false;//indique si ParcBot est en train de générer une réponse

  //Ces variables stockent les informations de l’utilisateur connecté
  userRole: 'CHAUFFEUR' | 'CHEF_PARC' = 'CHAUFFEUR';
  userId   = 1;
  userName = 'Utilisateur';
  sessionId = '';

  @ViewChild('messagesArea') private messagesArea!: ElementRef;//référence vers la zone contenant les messages
  @ViewChild('inputRef')     private inputRef!: ElementRef;//référence vers la zone de saisie.

  constructor(private chatService: ChatService) {}

  ngOnInit() {
  // ✅ Lire depuis 'user' — clé correcte
  const raw  = sessionStorage.getItem('user');//récupération des informations utilisateur depuis le sessionStorage
  const user = raw ? JSON.parse(raw) : {};//conversion du JSON en objet JavaScript.

  this.userRole  = user.typeUtilisateur ?? 'CHAUFFEUR'; // ← clé correcte
  this.userId    = user.id              ?? 1;
  this.userName  = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || 'Utilisateur';
  this.sessionId = `${this.userRole}_${this.userId}`;//expl:CHEF_PARC_5 ,cette session permet de conserver le contexte conversationnelle


  //Ajout du message de bienvenue
  //Ajoute automatiquement le premier message du bot lors de l’ouverture du chatbot.
  this.messages.push({
    text:   this.getWelcomeMessage(),
    sender: 'bot',
    time:   this.now()
  });

  setTimeout(() => this.inputRef?.nativeElement?.focus(), 300);//Place automatiquement le curseur dans la zone de saisie.
}

  private getWelcomeMessage(): string {
    return this.userRole === 'CHEF_PARC'
      ? `Bonjour **${this.userName}** 👋\n\nJe suis **ParcBot**, votre assistant de gestion de parc automobile.\n\nJe peux vous aider à consulter vos véhicules, chauffeurs, missions, déclarations et bien plus encore. Comment puis-je vous aider aujourd'hui ?`
      : `Bonjour **${this.userName}** 👋\n\nJe suis **ParcBot**, votre assistant personnel.\n\nVous pouvez me demander vos missions, votre véhicule, faire une déclaration, ou poser toute question générale. Je suis là pour vous ! 🚗`;
  }


  //Envoi d’un message
  sendMessage() {
    if (!this.userMessage.trim() || this.loading) return;//empeche l’envoi de messages vides et l’envoi multiple pendant une réponse en cours

    const text = this.userMessage.trim();//recupere le contenue du message
    this.messages.push({ text, sender: 'user', time: this.now() });//ajouter le message au tableau
    this.userMessage = '';//renitialise le champ qui sera vide
    this.loading = true;//Indique que le système attend la réponse du backend.

    const loadingMsg: Message = { text: '...', sender: 'bot', time: this.now(), isLoading: true };//Affiche les trois points animés pendant la génération de réponse.
    this.messages.push(loadingMsg);


    //Construction du payload JSON(que je vais envoyer au spring boot)
    const payload: ChatPayload = {
      message:   text,
      role:      this.userRole,
      userId:    this.userId,
      userName:  this.userName,
      sessionId: this.sessionId
    };

    //envoie de la requete http au spring boot contenant le payload(objet json du detail du message)
    //Cette partie représente le traitement asynchrone de la réponse HTTP envoyée au backend Spring Boot via le service Angular.
//Le mot-clé subscribe() permet d’attendre la réponse du serveur après l’envoi de la requête HTTP.
    this.chatService.sendMessage(payload).subscribe({
      next: (res: ChatResponse) => {
        const idx = this.messages.lastIndexOf(loadingMsg);//Recherche de l'index du message de chargement(...)
        if (idx !== -1) {//Si l’index existe, Angular va remplacer le message de chargement par la reponse.
          this.messages[idx] = { text: res.response, sender: 'bot', time: this.now() };
        }
        this.loading = false;//Désactivation du chargement
      },
      error: () => {
        const idx = this.messages.lastIndexOf(loadingMsg);
        if (idx !== -1) {
          this.messages[idx] = {
            text: '⚠️ Impossible de contacter le serveur. Veuillez réessayer.',
            sender: 'bot',
            time: this.now()
          };
        }
        this.loading = false;//Désactivation du chargement
      }
    });
  }

  //ette fonction permet de réinitialiser complètement la conversation entre l’utilisateur et ParcBot
  resetChat() {
    this.chatService.resetConversation(this.sessionId).subscribe();
    this.messages = [];
    this.messages.push({ text: this.getWelcomeMessage(), sender: 'bot', time: this.now() });
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();//le boutton devient disabled
      this.sendMessage();
    }
  }

//Cette fonction permet de transformer le texte brut généré par ParcBot en contenu HTML stylisé
  formatMessage(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
  }

  private now(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  ngAfterViewChecked() {
    try {
      if (this.messagesArea) {
        const el = this.messagesArea.nativeElement;//nativeElement donne accès au véritable élément DOM HTML.
        el.scrollTop = el.scrollHeight;
      }
    } catch {}
  }

  get roleLabel(): string {
    return this.userRole === 'CHEF_PARC' ? 'Chef du Parc' : 'Chauffeur';
  }

  get roleColor(): string {
    return this.userRole === 'CHEF_PARC' ? '#e67e22' : '#2980b9';
  }

  quickActions(): string[] {
    if (this.userRole === 'CHEF_PARC') {
      return ['Véhicules disponibles', 'Liste des chauffeurs', 'Déclarations en attente'];
    }
    return ['Mon véhicule', 'Mes missions', 'Mes déclarations', 'Terminer ma mission'];
  }
}
