package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;

@Entity
@Table(name = "garage_maintenance")
public class GarageMaintenance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_garage")
    private Long idGarage;

    private String nomGarage;
    private String adresse;

    @Column(length = 20)
    private String telephone;

    @Column(unique = true)
    private String email;

    private String responsable;

    // ===== Getters et Setters =====
    public Long getIdGarage() {
        return idGarage;
    }

    public void setIdGarage(Long idGarage) {
        this.idGarage = idGarage;
    }

    public String getNomGarage() {
        return nomGarage;
    }

    public void setNomGarage(String nomGarage) {
        this.nomGarage = nomGarage;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getResponsable() {
        return responsable;
    }

    public void setResponsable(String responsable) {
        this.responsable = responsable;
    }
}
