package com.pfe.backendspringboot.DTO;


import lombok.Data;

@Data
public class PredictionRequestAngular {
    private String  typeVehicule;
    private Integer nombreCylindres;
    private Double  tailleMoteur;
    private String  transmission;
    private String  boite;
    private Integer annee;
    private String  trafic;
    private String  typeCharge;
    private Double  poidsChargeKg;
    private Double  kilometrage;
    private Double  trajetKm;
    private Double  prixCarburant;

    public PredictionRequest toFlaskRequest() {
        PredictionRequest r = new PredictionRequest();
        r.setTypeVehicule(typeVehicule);
        r.setNombreCylindres(nombreCylindres);
        r.setTailleMoteur(tailleMoteur);
        r.setTransmission(transmission);
        r.setBoite(boite);
        r.setAnnee(annee);
        r.setTrafic(trafic);
        r.setTypeCharge(typeCharge);
        r.setPoidsChargeKg(poidsChargeKg);
        r.setKilometrage(kilometrage);
        r.setTrajetKm(trajetKm);
        r.setPrixCarburant(prixCarburant);
        return r;
    }
}