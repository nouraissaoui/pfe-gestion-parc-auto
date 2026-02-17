package com.pfe.backendspringboot.DTO;

public class ProfileResponse {

    private Long idUser;
    private String nom;
    private String prenom;
    private String role;

    private Long idChefParc;
    private Long idChauffeur;
    private Long idAdmin;

    private Long idLocal;

    public ProfileResponse(Long idUser, String nom, String prenom,
                           String role,
                           Long idChefParc,
                           Long idChauffeur,
                           Long idAdmin,
                           Long idLocal) {

        this.idUser = idUser;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
        this.idChefParc = idChefParc;
        this.idChauffeur = idChauffeur;
        this.idAdmin = idAdmin;
        this.idLocal = idLocal;
    }

    public Long getIdUser() {
        return idUser;
    }

    public String getNom() {
        return nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public String getRole() {
        return role;
    }

    public Long getIdChefParc() {
        return idChefParc;
    }

    public Long getIdChauffeur() {
        return idChauffeur;
    }

    public Long getIdAdmin() {
        return idAdmin;
    }

    public Long getIdLocal() {
        return idLocal;
    }
// getters
}