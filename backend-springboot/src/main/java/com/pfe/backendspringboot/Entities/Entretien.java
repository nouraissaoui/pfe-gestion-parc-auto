package com.pfe.backendspringboot.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "entretien")
public class Entretien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_entretien")
    private Long idEntretien;

    @Column(name = "type_entretien", nullable = false)
    private String typeEntretien;

    // Enum pour la catégorie
    public enum Categorie {
        ENTRETIEN_PERIODIQUE,
        ENTRETIEN_SUITE_DECLARATION
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "categorie", nullable = false)
    private Categorie categorie;

    @Column(name = "date_prevue")
    private LocalDate datePrevue;

    @Column(name = "date_effectuee")
    private LocalDate dateEffectuee;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    // Relations

    @ManyToOne
    @JoinColumn(name = "id_declaration", referencedColumnName = "id_declaration")
    private Declaration declaration;

    @ManyToOne
    @JoinColumn(name = "id_garage", referencedColumnName = "id_garage")
    private GarageMaintenance garage;

    @ManyToOne
    @JoinColumn(name = "id_vehicule", referencedColumnName = "id_vehicule")
    private Vehicule vehicule;

    @ManyToOne
    @JoinColumn(name = "id_chefduparc", referencedColumnName = "id_chefduparc")
    private ChefParc chefDuParc;

    // Constructeur
    public Entretien() {}

    // Getters et Setters
    public Long getIdEntretien() { return idEntretien; }
    public void setIdEntretien(Long idEntretien) { this.idEntretien = idEntretien; }

    public String getTypeEntretien() { return typeEntretien; }
    public void setTypeEntretien(String typeEntretien) { this.typeEntretien = typeEntretien; }

    public Categorie getCategorie() { return categorie; }
    public void setCategorie(Categorie categorie) { this.categorie = categorie; }

    public LocalDate getDatePrevue() { return datePrevue; }
    public void setDatePrevue(LocalDate datePrevue) { this.datePrevue = datePrevue; }

    public LocalDate getDateEffectuee() { return dateEffectuee; }
    public void setDateEffectuee(LocalDate dateEffectuee) { this.dateEffectuee = dateEffectuee; }

    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }

    public Declaration getDeclaration() { return declaration; }
    public void setDeclaration(Declaration declaration) { this.declaration = declaration; }

    public GarageMaintenance getGarage() { return garage; }
    public void setGarage(GarageMaintenance garage) { this.garage = garage; }

    public Vehicule getVehicule() { return vehicule; }
    public void setVehicule(Vehicule vehicule) { this.vehicule = vehicule; }

    public ChefParc getChefDuParc() { return chefDuParc; }
    public void setChefDuParc(ChefParc chefDuParc) { this.chefDuParc = chefDuParc; }
}
