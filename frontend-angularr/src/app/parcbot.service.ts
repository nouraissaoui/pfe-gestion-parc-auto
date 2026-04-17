// parcbot.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  sources?: string[];
  contextUsed?: boolean;
}

export interface ChatRequest {
  question: string;
  user_id: number;
  role: string;
  history: { role: string; content: string }[];
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  context_used: boolean;
}

@Injectable({ providedIn: 'root' })
export class ParcbotService {
  private readonly apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  sendMessage(req: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, req);
  }

  reindex(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reindex`, {});
  }

  health(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/health`);
  }
}