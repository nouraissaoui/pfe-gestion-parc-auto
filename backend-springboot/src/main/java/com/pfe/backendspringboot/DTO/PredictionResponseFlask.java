package com.pfe.backendspringboot.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PredictionResponseFlask {

    @JsonProperty("conso_constructeur_L100")
    private Double consoConstructeur;

    @JsonProperty("conso_reelle_L100")
    private Double consoReelle;

    @JsonProperty("litres_total")
    private Double litresTotal;

    @JsonProperty("cout_carburant")
    private Double coutCarburant;

    @JsonProperty("detail_correcteurs")
    private Map<String, Double> detailCorrecteurs;
}