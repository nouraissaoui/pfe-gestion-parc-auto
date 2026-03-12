package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.*;

@Entity
@Table(name = "carte_carburant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarteCarburant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_carte")
    private Long idCarte;

    @Column(name = "numero_carte", unique = true, nullable = false)
    private String numeroCarte;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_carburant")
    private TypeCarburant typeCarburant;

    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    @Column(name = "montant_charge")
    private Double montantCharge;

    @Column(name = "montant_reel")
    private Double montantReel;

    @Column(name = "date_chargement")
    private LocalDate dateChargement;

    // 🔹 Relation MANY TO ONE avec ChefDuParc
// 🔹 Relation MANY TO ONE avec ChefDuParc
    // nullable = true permet d'enregistrer une carte sans chef de parc associé
    @ManyToOne
    @JoinColumn(name = "id_chefparc", nullable = true)
    private ChefParc chefDuParc;

    // 🔹 Relation MANY TO ONE avec Vehicule
    @ManyToOne
    @JoinColumn(name = "id_vehicule", nullable = false)
    private Vehicule vehicule;

    // Getters & Setters
}