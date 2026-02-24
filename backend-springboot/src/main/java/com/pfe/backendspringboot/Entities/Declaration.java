package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "declaration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Declaration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_declaration")
    private Long idDeclaration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeclarationType type; // ex: ACCIDENT, PANNE, RECLAMATION

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Enumerated(EnumType.STRING)
    private DeclarationStatus status; // EN_ATTENTE, VALIDEE, REJETEE

    // ================= RELATIONS =================

    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    @JsonIgnoreProperties({"local", "image"})
    private Vehicule vehicule;

    @ManyToOne
    @JoinColumn(name = "traite_par")
    @JsonIgnoreProperties({"user", "local"})
    private ChefParc chefParc;

    @ManyToOne
    @JoinColumn(name = "chauffeur_id", nullable = false)
    @JsonIgnoreProperties({"user", "local", "vehicule"})
    private Chauffeur chauffeur;
}