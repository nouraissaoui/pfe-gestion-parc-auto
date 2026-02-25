package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.ChefParc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChefParcRepository extends JpaRepository<ChefParc, Long> {
    Optional<ChefParc> findByMail(String mail);
}