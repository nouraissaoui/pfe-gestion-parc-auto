import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  response: string;
}

export interface ChatPayload {
  message: string;
  role: 'CHAUFFEUR' | 'CHEF_PARC';
  userId: number;
  userName: string;
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiUrl    = 'http://localhost:5000/chat';
  private resetUrl  = 'http://localhost:5000/chat/reset';

  constructor(private http: HttpClient) {}

  sendMessage(payload: ChatPayload): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, payload);
  }

  resetConversation(sessionId: string): Observable<any> {
    return this.http.post(this.resetUrl, { sessionId });
  }
}
