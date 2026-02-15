package com.pfe.backendspringboot.Entities;

public enum Role {
    ADMIN("ADMIN"),
    CHEF_DU_PARC("CHEF_DU_PARC"),
    CHAUFFEUR("CHAUFFEUR");

    private final String label;

    Role(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    @Override
    public String toString() {
        return label;
    }
}
