package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Vehicule;
import com.pfe.backendspringboot.Entities.EtatVehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {

    // Nombre total de véhicules dans un local
    long countByLocal_IdLocal(Long idLocal);

    // Véhicules disponibles dans un local
    long countByLocal_IdLocalAndEtat(Long idLocal, EtatVehicule etat);
    List<Vehicule> findByLocal_IdLocal(Long idLocal);
}