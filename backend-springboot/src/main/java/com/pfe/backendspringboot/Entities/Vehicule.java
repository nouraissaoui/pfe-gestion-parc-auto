package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "vehicule")
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_vehicule")
    private Long idVehicule;

    @Column(unique = true)
    private String matricule;

    // ❌ Suppression du champ Admin ici

    private String marque;
    private String modele;
    private int annee;
    private String carburant;

    //nouveau champs
    @JsonProperty("type_vehicule")
    @Column(name = "type_vehicule")
    private String typeVehicule;

    @JsonProperty("nombre_cylindres")
    @Column(name = "nombre_cylindres")
    private Integer nombreCylindres;

    @JsonProperty("taille_moteur")
    @Column(name = "taille_moteur")
    private Double tailleMoteur;

    @JsonProperty("transmission")
    @Column(name = "transmission")
    private String transmission;


    @JsonProperty("boite")
    @Column(name = "boite")
    private String boite;

    @JsonProperty("km_total")
    @Column(name = "km_total")
    private Integer kmTotal = 0;

    @Lob
    @Column(name = "image", columnDefinition = "LONGTEXT")
    private String image;

    // Relation Many-to-One avec Local
    @ManyToOne
    @JoinColumn(name = "id_local", referencedColumnName = "id_local")
    @JsonIgnoreProperties("vehicules") // Évite la boucle infinie Local -> Vehicule -> Local
    private Local local;

    @Enumerated(EnumType.STRING)
    private EtatVehicule etat;

    // ===== Getters et Setters =====
    public Long getIdVehicule() { return idVehicule; }
    public void setIdVehicule(Long idVehicule) { this.idVehicule = idVehicule; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }

    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }

    public int getAnnee() { return annee; }
    public void setAnnee(int annee) { this.annee = annee; }

    public String getCarburant() { return carburant; }
    public void setCarburant(String carburant) { this.carburant = carburant; }

    public Local getLocal() { return local; }
    public void setLocal(Local local) { this.local = local; }

    public EtatVehicule getEtat() { return etat; }
    public void setEtat(EtatVehicule etat) { this.etat = etat; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public String getTypeVehicule() { return typeVehicule; }
    public void setTypeVehicule(String typeVehicule) { this.typeVehicule = typeVehicule; }

    public Integer getNombreCylindres() { return nombreCylindres; }
    public void setNombreCylindres(Integer nombreCylindres) { this.nombreCylindres = nombreCylindres; }

    public Double getTailleMoteur() { return tailleMoteur; }
    public void setTailleMoteur(Double tailleMoteur) { this.tailleMoteur = tailleMoteur; }

    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }

    public String getBoite() { return boite; }
    public void setBoite(String boite) { this.boite = boite; }

    public Integer getKmTotal() { return kmTotal; }
    public void setKmTotal(Integer kmTotal) { this.kmTotal = kmTotal; }
}