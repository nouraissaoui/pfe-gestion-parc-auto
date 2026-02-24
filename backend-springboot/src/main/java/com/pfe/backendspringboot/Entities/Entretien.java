package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "entretien")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Entretien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_entretien")
    private Long idEntretien;

    @Column(name = "type_entretien", nullable = false)
    private String typeEntretien;

    public enum Categorie {
        ENTRETIEN_PERIODIQUE,
        ENTRETIEN_SUITE_DECLARATION
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "categorie", nullable = false)
    private Categorie categorie;

    @Column(name = "date_prevue")
    private LocalDate datePrevue;

    @Column(name = "date_effectuee")
    private LocalDate dateEffectuee;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    public enum Status {
        EN_ATTENTE,
        TRAITE,
        REJETE
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    // ==================== RELATIONS ====================

    @ManyToOne
    @JoinColumn(name = "id_declaration")
    @JsonIgnoreProperties({"entretien"}) // Évite la boucle infinie si Declaration pointe aussi vers Entretien
    private Declaration declaration;

    @ManyToOne
    @JoinColumn(name = "id_garage")
    private GarageMaintenance garage;

    @ManyToOne
    @JoinColumn(name = "id_vehicule")
    @JsonIgnoreProperties({"local", "image"})
    private Vehicule vehicule;

    @ManyToOne
    @JoinColumn(name = "id_chefparc")
    @JsonIgnoreProperties({"user", "local"})
    private ChefParc chefDuParc;
}