package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Declaration;
import com.pfe.backendspringboot.Entities.GarageMaintenance;
import com.pfe.backendspringboot.Entities.GarageMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GarageMaintenanceRepository extends JpaRepository<GarageMaintenance, Long> {
    // Les méthodes findAll(), findById() sont incluses par défaut
}
