package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Local;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocalRepository extends JpaRepository<Local, Long> {
}

