package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Chauffeur;
import com.pfe.backendspringboot.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChauffeurRepository extends JpaRepository<Chauffeur, Long> {
    Optional<Chauffeur> findByUser(User user);
}