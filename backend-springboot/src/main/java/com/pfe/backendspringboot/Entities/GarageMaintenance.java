package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "garage_maintenance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GarageMaintenance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_garage")
    private Long idGarage;

    @Column(nullable = false)
    private String nomGarage;

    private String adresse;

    @Column(length = 20)
    private String telephone;

    @Column(unique = true)
    private String email;

    private String responsable;

    // Note : Tu pourrais ajouter ici un champ "specialite"
    // (Pneumatique, Vidange, Carrosserie) pour aider le Chef de Parc.
}