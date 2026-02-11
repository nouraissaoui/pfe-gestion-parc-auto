package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "chauffeur")
public class Chauffeur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_chauffeur")
    private Long idChauffeur;

    @Column(name = "date_prise_license")
    private LocalDate datePriseLicense;

    private int anciennete;

    @Column(name = "type_vehicule_permis")
    private String typeVehiculePermis;

    @Column(name = "date_expiration_permis")
    private LocalDate dateExpirationPermis;

    private String region;

    // 🔹 Relation 1-1 avec User (table mère)
    @OneToOne
    @JoinColumn(name = "id_user", nullable = false, unique = true)
    private User user;

    // Getters & Setters

    public Long getIdChauffeur() {
        return idChauffeur;
    }

    public void setIdChauffeur(Long idChauffeur) {
        this.idChauffeur = idChauffeur;
    }

    public LocalDate getDatePriseLicense() {
        return datePriseLicense;
    }

    public void setDatePriseLicense(LocalDate datePriseLicense) {
        this.datePriseLicense = datePriseLicense;
    }

    public int getAnciennete() {
        return anciennete;
    }

    public void setAnciennete(int anciennete) {
        this.anciennete = anciennete;
    }

    public String getTypeVehiculePermis() {
        return typeVehiculePermis;
    }

    public void setTypeVehiculePermis(String typeVehiculePermis) {
        this.typeVehiculePermis = typeVehiculePermis;
    }

    public LocalDate getDateExpirationPermis() {
        return dateExpirationPermis;
    }

    public void setDateExpirationPermis(LocalDate dateExpirationPermis) {
        this.dateExpirationPermis = dateExpirationPermis;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
