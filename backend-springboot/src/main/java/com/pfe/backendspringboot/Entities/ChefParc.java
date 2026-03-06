package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "chef_parc")
public class ChefParc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_chefparc")
    private Long idChefParc;

    private String nom;
    private String prenom;

    @Column(unique = true, nullable = false)
    private String mail;

    @Column(name = "mot_de_passe", nullable = false)
    @JsonIgnore
    private String motDePasse;

    @OneToOne
    @JoinColumn(name = "id_local", referencedColumnName = "id_local")
    @JsonIgnoreProperties({"chefParc", "vehicules", "chauffeurs"})
    private Local local;
    private LocalDate dateNomination;
    private int ancienneteChef;

    @Enumerated(EnumType.STRING)
    private NiveauResponsabilite niveauResponsabilite;

}