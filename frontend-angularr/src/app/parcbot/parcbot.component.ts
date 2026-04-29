// parcbot.component.ts
import {
  Component, OnInit, AfterViewChecked,
  ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ParcbotService } from '../parcbot.service';

interface ChatMsg {
  sender: 'user' | 'bot';
  text: string;
  time: string;
  isLoading?: boolean;
  sources?: string[];
  contextUsed?: boolean;
}

@Component({
  selector: 'app-parcbot',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './parcbot.component.html',
  styleUrls: ['./parcbot.component.css'],
})
export class ParcbotChatComponent implements OnInit, AfterViewChecked {

  // ── Profil utilisateur (depuis sessionStorage.getItem après auth) ──────────────────
  userId!: number;
  userRole!: string;   // "CHEF_PARC" | "CHAUFFEUR"  (tel que stocké par auth)
  userName!: string;

  @ViewChild('messagesArea') messagesArea!: ElementRef;

  messages: ChatMsg[] = [];
  userMessage = '';
  loading = false;
  private shouldScroll = false;

  // ── Mapping rôle auth → rôle RAG backend ─────────────────────────────────
  private get ragRole(): string {
    return this.userRole === 'CHEF_PARC' ? 'CHEF_DU_PARC' : 'CHAUFFEUR';
  }

  get roleLabel(): string {
    return this.userRole === 'CHEF_PARC' ? 'Chef du Parc' : 'Chauffeur';
  }

  /** Actions rapides selon le rôle */
  quickActions(): string[] {
    if (this.userRole === 'CHAUFFEUR') {
      return [
        "Mes missions aujourd'hui ?",
        "État de mon véhicule",
        "Ma feuille de route",
        "Mes déclarations en attente",
      ];
    }
    return [
      "Véhicules en mission",
      "Chauffeurs disponibles",
      "Déclarations en attente",
      "Entretiens cette semaine",
    ];
  }

  private now(): string {
    return new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  constructor(private parcbotService: ParcbotService) {}

 ngOnInit(): void {
  // ✅ Lire depuis 'user' — c'est ce que ton login sauvegarde
  const raw  = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : {};

  this.userId   = user.id              ?? 0;
  this.userRole = user.typeUtilisateur ?? 'CHAUFFEUR'; // ← clé correcte
  this.userName = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || 'Utilisateur';

  this.addWelcomeMessage();
}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // ── Message de bienvenue ──────────────────────────────────────────────────
  private addWelcomeMessage(): void {
    this.messages.push({
      sender: 'bot',
      text:
        `Bonjour **${this.userName}** ! Je suis **ParcBot**, ` +
        `votre assistant intelligent de gestion de parc automobile.\n\n` +
        `Comment puis-je vous aider aujourd'hui ?`,
      time: this.now(),
    });
  }

  // ── Envoi d'un message ────────────────────────────────────────────────────
  sendMessage(): void {
    const text = this.userMessage.trim();
    if (!text || this.loading) return;

    // Ajout message utilisateur
    this.messages.push({ sender: 'user', text, time: this.now() });
    this.userMessage  = '';
    this.loading      = true;
    this.shouldScroll = true;

    // Placeholder "en cours de frappe..."
    const loadingIndex = this.messages.length;
    this.messages.push({
      sender: 'bot',
      text: '',
      time: this.now(),
      isLoading: true,
    });
    this.shouldScroll = true;

    // Construction de l'historique (12 derniers messages = 6 échanges)
    const history = this.messages
      .slice(0, loadingIndex)
      .slice(-12)
      .map(m => ({
        role:    m.sender === 'bot' ? 'assistant' : 'user',
        content: m.text,
      }));

    this.parcbotService
      .sendMessage({
        question: text,
        user_id:  this.userId,
        role:     this.ragRole,
        history,
      })
      .subscribe({
        next: (res) => {
          this.messages[loadingIndex] = {
            sender:      'bot',
            text:        res.answer,
            time:        this.now(),
            sources:     res.sources,
            contextUsed: res.context_used,
            isLoading:   false,
          };
          this.loading      = false;
          this.shouldScroll = true;
        },
        error: () => {
          this.messages[loadingIndex] = {
            sender:    'bot',
            text:      'Désolé, une erreur est survenue. Veuillez réessayer.',
            time:      this.now(),
            isLoading: false,
          };
          this.loading      = false;
          this.shouldScroll = true;
        },
      });
  }

  // ── Raccourci clavier : Entrée pour envoyer ───────────────────────────────
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ── Réinitialisation ──────────────────────────────────────────────────────
  resetChat(): void {
    this.messages = [];
    this.addWelcomeMessage();
  }

  // ── Scroll bas automatique ────────────────────────────────────────────────
  private scrollToBottom(): void {
    try {
      const el = this.messagesArea.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  // ── Formatage Markdown basique → HTML ────────────────────────────────────
  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/^- (.*)/gm, '• $1');
  }
}