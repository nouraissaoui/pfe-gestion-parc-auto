package com.pfe.backendspringboot.Entities;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;

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

    /******** IMAGE SIMPLE STRING ********/

    @Column(length=5000)
    private String images;


    /******** RELATIONS ********/

    @OneToOne(mappedBy="local",cascade=CascadeType.ALL,fetch=FetchType.LAZY)
    @JsonIgnore
    private ChefParc chefParc;



    /******** GETTERS ********/

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


}