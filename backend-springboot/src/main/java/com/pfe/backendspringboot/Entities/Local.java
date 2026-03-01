package com.pfe.backendspringboot.Entities;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.pfe.backendspringboot.Entities.ChefParc;
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

    /******** IMAGE SIMPLE STRING ********/

    @Column(length=5000)
    private String images;


    /******** RELATIONS ********/

    @OneToOne(mappedBy="local",cascade=CascadeType.ALL,fetch=FetchType.LAZY)
    @JsonIgnore
    private ChefParc chefParc;


    // 🔹 NOUVEAU : Un local possède plusieurs chauffeurs
    @OneToMany(mappedBy = "local", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Chauffeur> chauffeurs;


}