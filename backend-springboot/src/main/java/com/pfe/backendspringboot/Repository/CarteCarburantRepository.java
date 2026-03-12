package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.CarteCarburant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CarteCarburantRepository extends JpaRepository<CarteCarburant, Long> {
    Optional<CarteCarburant> findByNumeroCarte(String numeroCarte);
}