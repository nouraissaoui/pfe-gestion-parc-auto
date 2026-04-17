import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit {

  messages: Message[] = [];
  userInput: string = '';
  isLoading: boolean = false;

  // ✅ Récupérer le profil depuis localStorage
  userRole: string = '';
  userId: number | null = null;
  localId: number | null = null;
  userName: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Lire le profil sauvegardé au moment du login
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    this.userRole  = profile.role  || 'CHAUFFEUR';
    this.userId    = profile.id    || null;
    this.localId   = profile.localId || null;
    this.userName  = profile.prenom || 'utilisateur';

    // Message de bienvenue selon le rôle
    const welcome = this.userRole === 'CHAUFFEUR'
      ? `Bonjour ${this.userName} 👋 Je suis votre assistant. Posez-moi vos questions sur vos missions ou votre véhicule !`
      : `Bonjour ${this.userName} 👋 Je suis votre assistant de parc. Demandez-moi les stats, véhicules, chauffeurs ou missions.`;

    this.messages.push({ sender: 'bot', text: welcome, time: this.getTime() });
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMsg = this.userInput.trim();
    this.messages.push({ sender: 'user', text: userMsg, time: this.getTime() });
    this.userInput = '';
    this.isLoading = true;

    this.http.post<any>('http://localhost:8080/chat', {
    message:  userMsg,
    role:     this.userRole,
    userId:   this.userId,
    localId:  this.localId,
    userName: this.userName
    }).subscribe({
      next: (res) => {
        this.messages.push({ sender: 'bot', text: res.reply, time: this.getTime() });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({
          sender: 'bot',
          text: '❌ Impossible de contacter le serveur. Vérifiez votre connexion.',
          time: this.getTime()
        });
        this.isLoading = false;
      }
    });
  }

  onEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') this.sendMessage();
  }

  getTime(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = document.querySelector('.chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}