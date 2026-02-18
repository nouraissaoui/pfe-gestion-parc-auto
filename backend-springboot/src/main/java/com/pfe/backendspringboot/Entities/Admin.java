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


    // 🔹 1 Admin -> plusieurs Vehicules
    @OneToMany(mappedBy = "admin")
    private List<Vehicule> vehicules;

    public Long getIdAdmin() {
        return idAdmin;
    }

    public User getUser() {
        return user;
    }

    public List<Chauffeur> getChauffeurs() {
        return chauffeurs;
    }

    public List<ChefParc> getChefsDuParc() {
        return chefsDuParc;
    }


    public List<Vehicule> getVehicules() {
        return vehicules;
    }

    public void setIdAdmin(Long idAdmin) {
        this.idAdmin = idAdmin;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setChauffeurs(List<Chauffeur> chauffeurs) {
        this.chauffeurs = chauffeurs;
    }

    public void setChefsDuParc(List<ChefParc> chefsDuParc) {
        this.chefsDuParc = chefsDuParc;
    }


    public void setVehicules(List<Vehicule> vehicules) {
        this.vehicules = vehicules;
    }
}
