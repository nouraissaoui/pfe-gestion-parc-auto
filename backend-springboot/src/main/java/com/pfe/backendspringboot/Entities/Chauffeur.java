package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data // Génère automatiquement Getters, Setters, toString, etc.
@Table(name = "chauffeur")
public class Chauffeur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_chauffeur")
    private Long idChauffeur;

    private String nom;
    private String prenom;

    @Column(unique = true, nullable = false)
    private String mail;

    @Column(name = "mot_de_passe", nullable = false)
    @JsonIgnore
    private String motDePasse;

    @Column(name = "date_prise_license")
    private LocalDate datePriseLicense;

    private int anciennete;

    @Column(name = "type_vehicule_permis")
    private String typeVehiculePermis;

    @Column(name = "date_expiration_permis")
    private LocalDate dateExpirationPermis;

    private String region;

    public enum EtatChauffeur {
        DISPONIBLE, EN_MISSION, EN_CONGE
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "etat_chauffeur", nullable = false)
    private EtatChauffeur etatChauffeur = EtatChauffeur.DISPONIBLE;

    @OneToOne
    @JoinColumn(name = "id_vehicule", unique = true)
    @JsonIgnoreProperties({"local"})
    private Vehicule vehicule;

    @ManyToOne(optional = true)
    @JsonIgnoreProperties({"chauffeurs", "chefParcs"})
    @JoinColumn(name = "id_local", nullable = true)
    private Local local;
}