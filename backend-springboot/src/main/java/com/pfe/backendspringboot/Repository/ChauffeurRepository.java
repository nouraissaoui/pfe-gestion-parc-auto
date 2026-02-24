package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Chauffeur;
import com.pfe.backendspringboot.Entities.User;
import com.pfe.backendspringboot.Entities.Vehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChauffeurRepository extends JpaRepository<Chauffeur, Long> {
    Optional<Chauffeur> findByUser(User user);
    Optional<Chauffeur> findByVehicule(Vehicule vehicule);
    List<Chauffeur> findByLocal_IdLocal(Long idLocal);
    @Query("SELECT c FROM Chauffeur c WHERE c.local.idLocal = :idLocal")
    List<Chauffeur> findChauffeursByLocal(@Param("idLocal") Long idLocal);

}