package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "missions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
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

    private String description;
    private String bandePrelevement;

    // Relations
    @ManyToOne
    @JoinColumn(name = "id_vehicule")
    @JsonIgnoreProperties({"local"})
    private Vehicule vehicule;

    @ManyToOne
    @JoinColumn(name = "id_chauffeur")
    @JsonIgnoreProperties({"user", "local", "vehicule"})
    private Chauffeur chauffeur;

    @ManyToOne
    @JoinColumn(name = "id_local")
    @JsonIgnoreProperties({"vehicules", "chauffeurs", "chefParc"})
    private Local local;

    @ManyToOne
    @JoinColumn(name = "id_chefparc")
    @JsonIgnoreProperties({"user", "local"})
    private ChefParc chefDuParc;

    @ManyToOne
    @JoinColumn(name = "id_feuille")
    @JsonIgnoreProperties("missions") // Très important pour éviter la boucle infinie
    private FeuilleDeRoute feuilleDeRoute;
}