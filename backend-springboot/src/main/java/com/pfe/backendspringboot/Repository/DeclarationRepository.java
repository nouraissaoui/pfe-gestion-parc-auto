package com.pfe.backendspringboot.Repository;


import com.pfe.backendspringboot.Entities.Declaration;
import com.pfe.backendspringboot.Entities.DeclarationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclarationRepository extends JpaRepository<Declaration, Long> {

    // Compter les déclarations "En attente" pour un chef du parc spécifique
    long countByChefParc_IdChefParcAndStatus(Long idChef, DeclarationStatus status);
    List<Declaration> findByChauffeur_IdChauffeur(Long idChauffeur);

    List<Declaration> findByChefParc_IdChefParc(Long idChefParc);
    List<Declaration> findByVehicule_IdVehicule(Long id);}