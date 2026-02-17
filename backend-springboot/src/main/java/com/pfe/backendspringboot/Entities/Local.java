package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "local")
public class Local {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_local")
    private Long idLocal;

    private String nomLocal;
    private String adresse;
    private String region;
    private String ville;

    // Relation 1-1 avec ChefParc
    @OneToOne(mappedBy = "local", cascade = CascadeType.ALL)
    @JsonBackReference
    private ChefParc chefParc;

    @ManyToOne
    @JoinColumn(name = "id_admin")
    private Admin admin;

    // Getters et Setters
    public Long getIdLocal() { return idLocal; }
    public void setIdLocal(Long idLocal) { this.idLocal = idLocal; }

    public String getNomLocal() { return nomLocal; }
    public void setNomLocal(String nomLocal) { this.nomLocal = nomLocal; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getVille() { return ville; }
    public void setVille(String ville) { this.ville = ville; }

    public ChefParc getChefParc() { return chefParc; }
    public void setChefParc(ChefParc chefParc) { this.chefParc = chefParc; }
}
