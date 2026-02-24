package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.List;

@Entity
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
    @JsonIgnoreProperties("local")
    private List<Chauffeur> chauffeurs;

    /******** GETTERS & SETTERS ********/

    public Long getIdLocal(){ return idLocal; }
    public void setIdLocal(Long idLocal){ this.idLocal=idLocal; }

    public String getNomLocal(){ return nomLocal; }
    public void setNomLocal(String nomLocal){ this.nomLocal=nomLocal; }

    public String getAdresse(){ return adresse; }
    public void setAdresse(String adresse){ this.adresse=adresse; }

    public String getRegion(){ return region; }
    public void setRegion(String region){ this.region=region; }

    public String getVille(){ return ville; }
    public void setVille(String ville){ this.ville=ville; }

    public String getImages(){ return images; }
    public void setImages(String images){ this.images=images; }

    public ChefParc getChefParc() { return chefParc; }
    public void setChefParc(ChefParc chefParc) { this.chefParc = chefParc; }

    public List<Vehicule> getVehicules() { return vehicules; }
    public void setVehicules(List<Vehicule> vehicules) { this.vehicules = vehicules; }

    public List<Chauffeur> getChauffeurs() { return chauffeurs; }
    public void setChauffeurs(List<Chauffeur> chauffeurs) { this.chauffeurs = chauffeurs; }
}