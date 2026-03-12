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
<<<<<<< HEAD
    // Récupérer les déclarations en attente pour les véhicules d'un local spécifique
    List<Declaration> findByVehicule_Local_IdLocalAndStatus(Long idLocal, DeclarationStatus status);
    // Compteur pour le dashboard
    long countByVehicule_Local_IdLocalAndStatus(Long idLocal, DeclarationStatus status);
    List<Declaration> findByVehicule_Local_IdLocal(Long idLocal);
=======

    List<Declaration> findByChauffeur_IdChauffeur(Long idChauffeur);
>>>>>>> 2f95c7b5b6a222b47c1e7a1ead7c1b51de534dd0
}