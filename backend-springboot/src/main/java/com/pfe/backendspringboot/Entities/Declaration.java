package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

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
    private DeclarationType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Enumerated(EnumType.STRING)
    private DeclarationStatus status;

    // ================= RELATIONS =================
    // Chaque déclaration concerne 1 seul véhicule
    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;

    // Chaque déclaration est traitée par 1 seul chef du parc
    @ManyToOne
    @JoinColumn(name = "traite_par")
    private ChefParc chefParc;

    // Chaque déclaration est faite par 1 seul chauffeur
    @ManyToOne
    @JoinColumn(name = "chauffeur_id", nullable = false)
    private Chauffeur chauffeur;

}
