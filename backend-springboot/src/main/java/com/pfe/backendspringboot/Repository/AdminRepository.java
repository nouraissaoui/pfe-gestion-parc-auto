package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Admin;
import com.pfe.backendspringboot.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUser(User user);
}
