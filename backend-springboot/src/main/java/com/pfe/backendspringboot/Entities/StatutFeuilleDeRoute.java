package com.pfe.backendspringboot.Entities;

public enum StatutFeuilleDeRoute {
    OUVERTE,    // La feuille est créée et accepte des missions
    EN_COURS,   // Le chauffeur a démarré la première mission
    CLOTUREE,   // Toutes les missions sont finies et les KM sont saisis
    ANNULEE     // Si la mission est annulée par le chef de parc
}
