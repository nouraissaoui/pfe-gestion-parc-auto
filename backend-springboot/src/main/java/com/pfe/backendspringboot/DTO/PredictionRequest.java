package com.pfe.backendspringboot.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {

    @JsonProperty("type_vehicule")
    private String typeVehicule;

    @JsonProperty("nombre_cylindres")
    private Integer nombreCylindres;

    @JsonProperty("taille_moteur")
    private Double tailleMoteur;

    @JsonProperty("transmission")
    private String transmission;

    @JsonProperty("boite")
    private String boite;

    @JsonProperty("annee")
    private Integer annee;

    @JsonProperty("trafic")
    private String trafic;

    @JsonProperty("type_charge")
    private String typeCharge;

    @JsonProperty("poids_charge_kg")
    private Double poidsChargeKg;

    @JsonProperty("kilometrage")
    private Double kilometrage;

    @JsonProperty("trajet_km")
    private Double trajetKm;

    @JsonProperty("prix_carburant")
    private Double prixCarburant;
}