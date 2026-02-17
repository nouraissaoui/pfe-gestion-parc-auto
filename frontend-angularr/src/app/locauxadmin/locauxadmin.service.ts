import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Local {
  idLocal?: number;
  nomLocal: string;
  adresse: string;
  region?: string;
  ville?: string;
  images?: string; // <-- string au lieu de string[]
  
}
@Injectable({ providedIn: 'root' })
export class LocauxadminService {
  apiUrl = 'http://localhost:8080/api/gestion-parc/local'; // <- vérifier port et chemin exact

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Local[]>(this.apiUrl);
  }

  add(local: Local) {
    return this.http.post(this.apiUrl, local);
  }

  update(id: number, local: Local) {
    return this.http.put(`${this.apiUrl}/${id}`, local);
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
