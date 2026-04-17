import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSource = new BehaviorSubject<string | null>(null);
  currentNotification = this.notificationSource.asObservable();

  // On utilise exactement ce nom
  triggerRealtimeNotification(message: string) {
    this.notificationSource.next(message);
    this.playNotificationSound();
  }

  private playNotificationSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio bloqué par le navigateur"));
  }

  clear() {
    this.notificationSource.next(null);
  }
}