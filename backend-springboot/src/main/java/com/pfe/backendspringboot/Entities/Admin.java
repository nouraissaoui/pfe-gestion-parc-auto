package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "admin")
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_admin")
    private Long idAdmin;

    // 🔹 Relation 1-1 avec User
    @OneToOne
    @JoinColumn(name = "id_user", nullable = false, unique = true)
    private User user;

    // 🔹 1 Admin -> plusieurs Chauffeurs
    @OneToMany(mappedBy = "admin")
    private List<Chauffeur> chauffeurs;

    // 🔹 1 Admin -> plusieurs ChefsDuParc
    @OneToMany(mappedBy = "admin")
    private List<ChefParc> chefsDuParc;

    // 🔹 1 Admin -> plusieurs Locals
    @OneToMany(mappedBy = "admin")
    private List<Local> locals;

    // 🔹 1 Admin -> plusieurs Vehicules
    @OneToMany(mappedBy = "admin")
    private List<Vehicule> vehicules;

    // Getters & Setters
}
