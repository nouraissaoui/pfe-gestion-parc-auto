package com.pfe.backendspringboot.Entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "chef_parc")
public class ChefParc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_chefparc")
    private Long idChefParc;

    // 🔹 Relation 1-1 avec User (Le compte utilisateur)
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "id_user", referencedColumnName = "id_user")
    private User user;

    // 🔹 Relation 1-1 avec Local (Le local qu'il dirige)
    @OneToOne
    @JoinColumn(name = "id_local", referencedColumnName = "id_local")
    @JsonManagedReference
    private Local local;

    // ❌ Suppression de la relation Admin ici

    private LocalDate dateNomination;
    private int ancienneteChef;

    @Enumerated(EnumType.STRING)
    private NiveauResponsabilite niveauResponsabilite;

    // ===== Getters et Setters =====

    public Long getIdChefParc() { return idChefParc; }
    public void setIdChefParc(Long idChefParc) { this.idChefParc = idChefParc; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Local getLocal() { return local; }
    public void setLocal(Local local) { this.local = local; }

    public LocalDate getDateNomination() { return dateNomination; }
    public void setDateNomination(LocalDate dateNomination) { this.dateNomination = dateNomination; }

    public int getAncienneteChef() { return ancienneteChef; }
    public void setAncienneteChef(int ancienneteChef) { this.ancienneteChef = ancienneteChef; }

    public NiveauResponsabilite getNiveauResponsabilite() { return niveauResponsabilite; }
    public void setNiveauResponsabilite(NiveauResponsabilite niveauResponsabilite) { this.niveauResponsabilite = niveauResponsabilite; }
}