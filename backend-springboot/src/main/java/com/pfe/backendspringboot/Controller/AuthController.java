package com.pfe.backendspringboot.Controller;
import com.pfe.backendspringboot.DTO.LoginResponse;
import com.pfe.backendspringboot.Entities.Admin;
import com.pfe.backendspringboot.Entities.Chauffeur;
import com.pfe.backendspringboot.Entities.ChefParc;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;


import com.pfe.backendspringboot.Entities.User;
import com.pfe.backendspringboot.Repository.AdminRepository;
import com.pfe.backendspringboot.Repository.ChauffeurRepository;
import com.pfe.backendspringboot.Repository.ChefParcRepository;
import com.pfe.backendspringboot.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private ChefParcRepository chefParcRepository;

    @Autowired
    private ChauffeurRepository chauffeurRepository;

    @Autowired
    private AdminRepository adminRepository;
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginData) {

        Optional<User> userOpt = userService.authenticate(
                loginData.getMail(),
                loginData.getMotDePasse()
        );

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Email ou mot de passe incorrect");
        }

        User user = userOpt.get();

        Long idChefParc = null;
        Long idChauffeur = null;
        Long idAdmin = null;
        Long idLocal = null;

        // 🔹 Vérification Chef Parc
        Optional<ChefParc> chefOpt = chefParcRepository.findByUser(user);
        if(chefOpt.isPresent()){
            ChefParc chef = chefOpt.get();
            idChefParc = chef.getIdChefParc();
            idLocal = chef.getLocal().getIdLocal();
        }

        // 🔹 Vérification Chauffeur
        Optional<Chauffeur> chauffeurOpt = chauffeurRepository.findByUser(user);
        if(chauffeurOpt.isPresent()){
            Chauffeur chauffeur = chauffeurOpt.get();
            idChauffeur = chauffeur.getIdChauffeur();
            if(chauffeur.getLocal() != null){
                idLocal = chauffeur.getLocal().getIdLocal();
            }
        }

        // 🔹 Vérification Admin
        Optional<Admin> adminOpt = adminRepository.findByUser(user);
        if(adminOpt.isPresent()){
            Admin admin = adminOpt.get();
            idAdmin = admin.getIdAdmin();
        }

        LoginResponse response = new LoginResponse(
                user.getIdUser(),
                user.getNom(),
                user.getPrenom(),
                user.getRole().name(),
                idChefParc,
                idChauffeur,
                idAdmin,
                idLocal
        );

        return ResponseEntity.ok(response);
    }

    // 🔹 Endpoint pour créer un utilisateur de test
    @PostMapping("/create")
    public String createUser(@RequestBody User u) {
        // u.getMotDePasse() contient le mot de passe brut depuis le JSON
        userService.createUser(u.getIdUser(),u.getNom(), u.getPrenom(), u.getMotDePasse(), u.getRole());
        return "USER CREATED";
    }
}
