package com.pfe.backendspringboot.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProfileResponse {
    private Long id; // ID du Chauffeur ou du Chef de Parc
    private String nom;
    private String prenom;
    private String mail;
    private String typeUtilisateur; // "CHEF_PARC" ou "CHAUFFEUR"
    private Long idLocal;
}