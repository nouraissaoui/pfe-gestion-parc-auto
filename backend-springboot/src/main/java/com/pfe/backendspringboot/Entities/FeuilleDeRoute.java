package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "feuille_de_route")
public class FeuilleDeRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_feuille")
    private Long idFeuille;

    // 🔹 Relations
    @ManyToOne
    @JoinColumn(name = "id_vehicule", referencedColumnName = "id_vehicule", nullable = false)
    private Vehicule vehicule;

    @ManyToOne
    @JoinColumn(name = "id_chauffeur", referencedColumnName = "id_chauffeur", nullable = false)
    private Chauffeur chauffeur;

    @ManyToOne
    @JoinColumn(name = "id_chefparc", referencedColumnName = "id_chefparc", nullable = false)
    private ChefParc chefParc;

    // 🔹 Champs principaux
    private String pointDepart;
    private String destination;

    private LocalTime heureDepartPrevue;
    private LocalTime heureDepartReelle;
    private LocalTime heureArriveeReelle;

    @Column(nullable = true)
    private Double kmDepart;

    @Column(nullable = true)
    private Double kmArrivee;

    @Column(nullable = true)
    private Double consommationCarburant;

    private String observations;
    private LocalDate dateGeneration;

    @Enumerated(EnumType.STRING)
    private StatutFeuilleDeRoute statut;

    //====récupérer toutes les missions d’une feuille facilement
    @OneToMany(mappedBy = "feuilleDeRoute")
    private List<Mission> missions;

    // ===== Getters et Setters =====
    public Long getIdFeuille() { return idFeuille; }
    public void setIdFeuille(Long idFeuille) { this.idFeuille = idFeuille; }

    public Vehicule getVehicule() { return vehicule; }
    public void setVehicule(Vehicule vehicule) { this.vehicule = vehicule; }

    public Chauffeur getChauffeur() { return chauffeur; }
    public void setChauffeur(Chauffeur chauffeur) { this.chauffeur = chauffeur; }

    public ChefParc getChefParc() { return chefParc; }
    public void setChefParc(ChefParc chefParc) { this.chefParc = chefParc; }

    public String getPointDepart() { return pointDepart; }
    public void setPointDepart(String pointDepart) { this.pointDepart = pointDepart; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public LocalTime getHeureDepartPrevue() { return heureDepartPrevue; }
    public void setHeureDepartPrevue(LocalTime heureDepartPrevue) { this.heureDepartPrevue = heureDepartPrevue; }

    public LocalTime getHeureDepartReelle() { return heureDepartReelle; }
    public void setHeureDepartReelle(LocalTime heureDepartReelle) { this.heureDepartReelle = heureDepartReelle; }

    public LocalTime getHeureArriveeReelle() { return heureArriveeReelle; }
    public void setHeureArriveeReelle(LocalTime heureArriveeReelle) { this.heureArriveeReelle = heureArriveeReelle; }

    public Double getKmDepart() { return kmDepart; }
    public void setKmDepart(Double kmDepart) { this.kmDepart = kmDepart; }

    public Double getKmArrivee() { return kmArrivee; }
    public void setKmArrivee(Double kmArrivee) { this.kmArrivee = kmArrivee; }

    public Double getConsommationCarburant() { return consommationCarburant; }
    public void setConsommationCarburant(Double consommationCarburant) { this.consommationCarburant = consommationCarburant; }

    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }

    public LocalDate getDateGeneration() { return dateGeneration; }
    public void setDateGeneration(LocalDate dateGeneration) { this.dateGeneration = dateGeneration; }

    public StatutFeuilleDeRoute getStatut() { return statut; }
    public void setStatut(StatutFeuilleDeRoute statut) { this.statut = statut; }
}
