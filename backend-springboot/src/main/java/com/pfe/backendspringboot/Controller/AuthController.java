package com.pfe.backendspringboot.Controller;



import com.pfe.backendspringboot.Entities.User;
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

    @PostMapping("/login")
    public String login(@RequestBody User loginData) {
        Optional<User> userOpt = userService.authenticate(loginData.getMail(), loginData.getMotDePasse());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return "SUCCESS:" + user.getRole();
        }
        return "FAIL";
    }

    // 🔹 Endpoint pour créer un utilisateur de test
    @PostMapping("/create")
    public String createUser(@RequestBody User u) {
        // u.getMotDePasse() contient le mot de passe brut depuis le JSON
        userService.createUser(u.getNom(), u.getPrenom(), u.getMotDePasse(), u.getRole());
        return "USER CREATED";
    }
}
