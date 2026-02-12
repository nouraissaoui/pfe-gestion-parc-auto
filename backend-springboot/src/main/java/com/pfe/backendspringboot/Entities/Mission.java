package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "missions")
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mission")
    private Long idMission;

    @Column(name = "date_mission", nullable = false)
    private LocalDate dateMission;

    @Column(name = "point_depart", nullable = false)
    private String pointDepart;

    @Column(name = "destination", nullable = false)
    private String destination;

    @Column(name = "heure_depart_prevue", nullable = false)
    private LocalTime heureDepartPrevue;

    @Column(name = "description")
    private String description;

    @Column(name = "bande_prelevement")
    private String bandePrelevement;



    // Relations

    @ManyToOne
    @JoinColumn(name = "id_vehicule", referencedColumnName = "id_vehicule")
    private Vehicule vehicule;

    @ManyToOne
    @JoinColumn(name = "id_chauffeur", referencedColumnName = "id_chauffeur")
    private Chauffeur chauffeur;

    @ManyToOne
    @JoinColumn(name = "id_local", referencedColumnName = "id_local")
    private Local local;


    @ManyToOne
    @JoinColumn(name = "id_chefparc", referencedColumnName = "id_chefparc")
    private ChefParc chefDuParc;

    @ManyToOne
    @JoinColumn(name = "id_feuille", referencedColumnName = "id_feuille")
    private FeuilleDeRoute feuilleDeRoute;


    // Constructeurs
    public Mission() {}

    // Getters et Setters
    public Long getIdMission() { return idMission; }
    public void setIdMission(Long idMission) { this.idMission = idMission; }

    public LocalDate getDateMission() { return dateMission; }
    public void setDateMission(LocalDate dateMission) { this.dateMission = dateMission; }

    public String getPointDepart() { return pointDepart; }
    public void setPointDepart(String pointDepart) { this.pointDepart = pointDepart; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public LocalTime getHeureDepartPrevue() { return heureDepartPrevue; }
    public void setHeureDepartPrevue(LocalTime heureDepartPrevue) { this.heureDepartPrevue = heureDepartPrevue; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Vehicule getVehicule() { return vehicule; }
    public void setVehicule(Vehicule vehicule) { this.vehicule = vehicule; }

    public Chauffeur getChauffeur() { return chauffeur; }
    public void setChauffeur(Chauffeur chauffeur) { this.chauffeur = chauffeur; }

    public Local getLocal() { return local; }
    public void setLocal(Local local) { this.local = local; }

    public ChefParc getChefDuParc() { return chefDuParc; }
    public void setChefDuParc(ChefParc chefDuParc) { this.chefDuParc = chefDuParc; }

    // Getter et Setter
    public String getBandePrelevement() {
        return bandePrelevement;
    }

    public void setBandePrelevement(String bandePrelevement) {
        this.bandePrelevement = bandePrelevement;
    }

    public FeuilleDeRoute getFeuilleDeRoute() { return feuilleDeRoute; }
    public void setFeuilleDeRoute(FeuilleDeRoute feuilleDeRoute) { this.feuilleDeRoute = feuilleDeRoute; }
}
