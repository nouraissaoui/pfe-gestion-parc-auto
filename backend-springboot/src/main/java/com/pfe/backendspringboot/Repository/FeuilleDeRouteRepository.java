package com.pfe.backendspringboot.Repository;


import com.pfe.backendspringboot.Entities.FeuilleDeRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeuilleDeRouteRepository extends JpaRepository<FeuilleDeRoute, Long> {
    // Optionnel : tu peux ajouter des méthodes custom si besoin pour filtrer par chauffeur/local
}