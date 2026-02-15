package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Entretien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EntretienRepository extends JpaRepository<Entretien, Long> {

    // Compter les entretiens "EN_ATTENTE" pour un chef du parc spécifique
    @Query("SELECT COUNT(e) FROM Entretien e WHERE e.chefDuParc.idChefParc = :idChef AND e.status = 'EN_ATTENTE'")
    long countEntretiensEnAttenteByChef(@Param("idChef") Long idChef);
}