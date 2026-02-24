package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

    public enum EtatChauffeur {
        DISPONIBLE,
        EN_MISSION,
        EN_CONGE
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "etat_chauffeur", nullable = false)
    private EtatChauffeur etatChauffeur = EtatChauffeur.DISPONIBLE; // Valeur par défaut

    // 🔹 Relation 1-1 avec User (Le compte utilisateur du chauffeur)
    @OneToOne
    @JoinColumn(name = "id_user", nullable = false, unique = true)
    private User user;

    // 🔹 Relation avec Vehicule (Le véhicule actuellement assigné)
    @OneToOne
    @JoinColumn(name = "id_vehicule", unique = true)
    @JsonIgnoreProperties({"local"}) // Supprimé "admin" car il n'existe plus
    private Vehicule vehicule;

    // 🔹 Relation Many-to-One avec Local
    // Un chauffeur appartient à un local géré par un Chef de Parc
    @ManyToOne(optional = true)
    @JsonIgnoreProperties({"chauffeurs", "chefParcs"}) // Nettoyage des propriétés inexistantes
    @JoinColumn(name = "id_local", nullable = true)
    private Local local;

    // ===== Getters & Setters =====

    public Long getIdChauffeur() { return idChauffeur; }
    public void setIdChauffeur(Long idChauffeur) { this.idChauffeur = idChauffeur; }

    public LocalDate getDatePriseLicense() { return datePriseLicense; }
    public void setDatePriseLicense(LocalDate datePriseLicense) { this.datePriseLicense = datePriseLicense; }

    public int getAnciennete() { return anciennete; }
    public void setAnciennete(int anciennete) { this.anciennete = anciennete; }

    public String getTypeVehiculePermis() { return typeVehiculePermis; }
    public void setTypeVehiculePermis(String typeVehiculePermis) { this.typeVehiculePermis = typeVehiculePermis; }

    public LocalDate getDateExpirationPermis() { return dateExpirationPermis; }
    public void setDateExpirationPermis(LocalDate dateExpirationPermis) { this.dateExpirationPermis = dateExpirationPermis; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Vehicule getVehicule() { return vehicule; }
    public void setVehicule(Vehicule vehicule) { this.vehicule = vehicule; }

    public Local getLocal() { return local; }
    public void setLocal(Local local) { this.local = local; }

    public EtatChauffeur getEtatChauffeur() {
        return etatChauffeur;
    }

    public void setEtatChauffeur(EtatChauffeur etatChauffeur) {
        this.etatChauffeur = etatChauffeur;
    }
}