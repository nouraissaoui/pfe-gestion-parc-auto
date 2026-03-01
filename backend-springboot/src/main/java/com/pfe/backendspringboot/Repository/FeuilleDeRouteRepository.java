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
    // Trouve une feuille ouverte pour un chauffeur spécifique
    Optional<FeuilleDeRoute> findByChauffeurAndStatut(Chauffeur chauffeur, StatutFeuilleDeRoute statut);
    // Exemple de requête dans le Repository
    @Query("SELECT f FROM FeuilleDeRoute f WHERE f.vehicule.local.idLocal = :idLocal AND f.statut = 'OUVERTE'")
    List<FeuilleDeRoute> findByLocalId(@Param("idLocal") Long idLocal);
    // Optionnel : tu peux ajouter des méthodes custom si besoin pour filtrer par chauffeur/local
}