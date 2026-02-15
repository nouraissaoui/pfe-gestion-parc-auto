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
            // compare le mot de passe saisi avec le hash dans la base
            if(passwordEncoder.matches(password, user.getMotDePasse())){
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    // Crée un utilisateur et génère automatiquement le mail
    // Crée un utilisateur et génère automatiquement le mail
    public User createUser(long iduser,String nom, String prenom, String rawPassword, Role role){
        User user = new User();
        user.setIdUser(iduser);
        user.setNom(nom);
        user.setPrenom(prenom);

        // Génération automatique du mail
        String email = prenom.toLowerCase() + "." + nom.toLowerCase() + "@agil.com.tn";
        user.setMail(email);

        // Hashage du mot de passe
        user.setMotDePasse(passwordEncoder.encode(rawPassword));
        user.setRole(role);

        return userRepository.save(user);
    }

}
