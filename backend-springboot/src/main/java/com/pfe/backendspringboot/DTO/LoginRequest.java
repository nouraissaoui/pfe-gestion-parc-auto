package com.pfe.backendspringboot.DTO;

import lombok.Data;

@Data // Lombok génère getMail() et getMotDePasse() automatiquement
public class LoginRequest {
    private String mail;
    private String motDePasse;
}
