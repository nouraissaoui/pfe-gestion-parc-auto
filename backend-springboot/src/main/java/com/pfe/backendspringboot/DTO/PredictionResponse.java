package com.pfe.backendspringboot.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponse {
    private Double consoConstructeur;
    private Double consoReelle;
    private Double litresTotal;
    private Double coutCarburant;
    private Map<String, Double> detailCorrecteurs;

    public static PredictionResponse from(PredictionResponseFlask f) {
        return new PredictionResponse(
                f.getConsoConstructeur(),
                f.getConsoReelle(),
                f.getLitresTotal(),
                f.getCoutCarburant(),
                f.getDetailCorrecteurs()
        );
    }
}