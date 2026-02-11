package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "carte_carburant")
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
    @ManyToOne
    @JoinColumn(name = "id_chef", nullable = false)
    private ChefParc chefDuParc;

    // 🔹 Relation MANY TO ONE avec Vehicule
    @ManyToOne
    @JoinColumn(name = "id_vehicule", nullable = false)
    private Vehicule vehicule;

    // Getters & Setters
}
