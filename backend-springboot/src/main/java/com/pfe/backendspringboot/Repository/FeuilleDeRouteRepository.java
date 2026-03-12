package com.pfe.backendspringboot.Repository;


import com.pfe.backendspringboot.Entities.Chauffeur;
import com.pfe.backendspringboot.Entities.FeuilleDeRoute;
import com.pfe.backendspringboot.Entities.StatutFeuilleDeRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface FeuilleDeRouteRepository extends JpaRepository<FeuilleDeRoute, Long> {
    Optional<FeuilleDeRoute> findByChauffeurAndStatut(Chauffeur chauffeur, StatutFeuilleDeRoute statut);

    @Query("SELECT f FROM FeuilleDeRoute f WHERE f.vehicule.local.idLocal = :idLocal AND f.statut = 'OUVERTE'")
    List<FeuilleDeRoute> findByLocalId(@Param("idLocal") Long idLocal);

    List<FeuilleDeRoute> findByChauffeur_IdChauffeur(Long idChauffeur);

    // Correction : Nom unique harmonisé
    List<FeuilleDeRoute> findByChefParc_IdChefParc(Long id);}