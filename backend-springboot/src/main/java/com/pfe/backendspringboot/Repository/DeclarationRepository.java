package com.pfe.backendspringboot.Repository;


import com.pfe.backendspringboot.Entities.Declaration;
import com.pfe.backendspringboot.Entities.DeclarationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DeclarationRepository extends JpaRepository<Declaration, Long> {

    // Compter les déclarations "En attente" pour un chef du parc spécifique
    long countByChefParc_IdChefParcAndStatus(Long idChef, DeclarationStatus status);
}