package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Entity
@Data
@Table(name = "feuille_de_route")
public class FeuilleDeRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_feuille")
    private Long idFeuille;

    private LocalDate dateGeneration;

    @Enumerated(EnumType.STRING)
    private StatutFeuilleDeRoute statut;

    // 🔹 Relations
    @ManyToOne
    @JoinColumn(name = "id_vehicule", referencedColumnName = "id_vehicule", nullable = false)
    private Vehicule vehicule;

    @ManyToOne
    @JoinColumn(name = "id_chauffeur", referencedColumnName = "id_chauffeur", nullable = false)
    private Chauffeur chauffeur;

    @ManyToOne
    @JoinColumn(name = "id_chefparc", referencedColumnName = "id_chefparc", nullable = false)
    private ChefParc chefParc;

    //====récupérer toutes les missions d’une feuille facilement
    //====Cela permet de supprimer automatiquement toutes les missions associées dès que la feuille est supprimée.
    @OneToMany(mappedBy = "feuilleDeRoute", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("feuilleDeRoute")
    private List<Mission> missions;
}