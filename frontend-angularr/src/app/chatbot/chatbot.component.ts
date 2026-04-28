import {
  Component, ElementRef, ViewChild, AfterViewChecked, OnInit
} from '@angular/core';
import { ChatService, ChatResponse, ChatPayload } from '../chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  time: string;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {

  userMessage = '';
  messages: Message[] = [];
  loading = false;

  userRole: 'CHAUFFEUR' | 'CHEF_PARC' = 'CHAUFFEUR';
  userId   = 1;
  userName = 'Utilisateur';
  sessionId = '';

  @ViewChild('messagesArea') private messagesArea!: ElementRef;
  @ViewChild('inputRef')     private inputRef!: ElementRef;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
  // ✅ Lire depuis 'user' — clé correcte
  const raw  = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : {};

  this.userRole  = user.typeUtilisateur ?? 'CHAUFFEUR'; // ← clé correcte
  this.userId    = user.id              ?? 1;
  this.userName  = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || 'Utilisateur';
  this.sessionId = `${this.userRole}_${this.userId}`;

  this.messages.push({
    text:   this.getWelcomeMessage(),
    sender: 'bot',
    time:   this.now()
  });

  setTimeout(() => this.inputRef?.nativeElement?.focus(), 300);
}

  private getWelcomeMessage(): string {
    return this.userRole === 'CHEF_PARC'
      ? `Bonjour **${this.userName}** 👋\n\nJe suis **ParcBot**, votre assistant de gestion de parc automobile.\n\nJe peux vous aider à consulter vos véhicules, chauffeurs, missions, déclarations et bien plus encore. Comment puis-je vous aider aujourd'hui ?`
      : `Bonjour **${this.userName}** 👋\n\nJe suis **ParcBot**, votre assistant personnel.\n\nVous pouvez me demander vos missions, votre véhicule, faire une déclaration, ou poser toute question générale. Je suis là pour vous ! 🚗`;
  }

  sendMessage() {
    if (!this.userMessage.trim() || this.loading) return;

    const text = this.userMessage.trim();
    this.messages.push({ text, sender: 'user', time: this.now() });
    this.userMessage = '';
    this.loading = true;

    const loadingMsg: Message = { text: '...', sender: 'bot', time: this.now(), isLoading: true };
    this.messages.push(loadingMsg);

    const payload: ChatPayload = {
      message:   text,
      role:      this.userRole,
      userId:    this.userId,
      userName:  this.userName,
      sessionId: this.sessionId
    };

    this.chatService.sendMessage(payload).subscribe({
      next: (res: ChatResponse) => {
        const idx = this.messages.lastIndexOf(loadingMsg);
        if (idx !== -1) {
          this.messages[idx] = { text: res.response, sender: 'bot', time: this.now() };
        }
        this.loading = false;
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
        this.loading = false;
      }
    });
  }

  resetChat() {
    this.chatService.resetConversation(this.sessionId).subscribe();
    this.messages = [];
    this.messages.push({ text: this.getWelcomeMessage(), sender: 'bot', time: this.now() });
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

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
        const el = this.messagesArea.nativeElement;
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
      return ['Véhicules disponibles', 'Liste des chauffeurs', 'Déclarations en attente', 'Missions du jour'];
    }
    return ['Mon véhicule', 'Mes missions', 'Mes déclarations', 'Terminer ma mission'];
  }
}
