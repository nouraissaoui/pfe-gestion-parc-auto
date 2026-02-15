package com.pfe.backendspringboot.Service;


import com.pfe.backendspringboot.Entities.User;
import com.pfe.backendspringboot.Entities.Role;

import com.pfe.backendspringboot.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // Authentification sécurisée
    public Optional<User> authenticate(String mail, String password){
        Optional<User> userOpt = userRepository.findByMail(mail);
        if(userOpt.isPresent()){
            User user = userOpt.get();
            // 🔹 compare le mot de passe saisi avec le hash dans la base
            if(passwordEncoder.matches(password, user.getMotDePasse())){
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    // 🔹 pour créer un utilisateur avec mot de passe crypté
    public User createUser(String nom, String prenom, String mail, String rawPassword, Role role){
        User user = new User();
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setMail(mail);
        user.setMotDePasse(passwordEncoder.encode(rawPassword)); // 🔑 hashage
        user.setRole(role);
        return userRepository.save(user);
    }
}
