package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
@Table(name="local")
public class Local {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="id_local")
    private Long idLocal;

    private String nomLocal;
    private String adresse;
    private String region;
    private String ville;

    @Column(length=5000)
    private String images;

    /******** RELATIONS ********/

    // Relation avec le Chef (1 seul par local)
    @OneToOne(mappedBy="local", cascade=CascadeType.ALL, fetch=FetchType.LAZY)
    @JsonIgnore
    private ChefParc chefParc;

    // 🔹 NOUVEAU : Un local possède plusieurs véhicules
    @OneToMany(mappedBy = "local", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("local")
    private List<Vehicule> vehicules;

    // 🔹 NOUVEAU : Un local possède plusieurs chauffeurs
    @OneToMany(mappedBy = "local", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Chauffeur> chauffeurs;


}