package com.pfe.backendspringboot.DTO;


import com.pfe.backendspringboot.Entities.NiveauResponsabilite; // Assure-toi du bon package
import lombok.Data;
import java.time.LocalDate;

@Data
public class UserRegistrationDTO {
    // Champs communs
    private String nom;
    private String prenom;
    private String mail;
    private String motDePasse;
    private String role; // "CHEF_PARC" ou "CHAUFFEUR"

    // Spécifique ChefParc
    private LocalDate dateNomination;
    private int ancienneteChef;
    private String niveauResponsabilite; // On le reçoit en String et on convertit
    private Long idLocal;

    // Spécifique Chauffeur
    private LocalDate datePriseLicense;
    private int anciennete;
    private String typeVehiculePermis;
    private LocalDate dateExpirationPermis;
    private String region;
}