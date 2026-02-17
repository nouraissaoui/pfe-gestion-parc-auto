package com.pfe.backendspringboot.Controller;

import com.pfe.backendspringboot.DTO.ProfileResponse;
import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.AdminRepository;
import com.pfe.backendspringboot.Repository.ChauffeurRepository;
import com.pfe.backendspringboot.Repository.ChefParcRepository;
import com.pfe.backendspringboot.Service.GestionParcService;
import com.pfe.backendspringboot.Service.LocalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/gestion-parc")
@CrossOrigin(origins = "http://localhost:4200")
public class GestionParcController {

    @Autowired
    private GestionParcService GestionParcService;

    @Autowired
    private ChefParcRepository chefParcRepository;

    @Autowired
    private ChauffeurRepository chauffeurRepository;

    @Autowired
    private AdminRepository adminRepository;



    public GestionParcController(GestionParcService GestionParcService) {
        this.GestionParcService = GestionParcService;
    }

    // ==================== AUTHENTIFICATION ====================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginData) {

        Optional<User> userOpt = GestionParcService.authenticate(
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

        // 🔹 Chef Parc
        Optional<ChefParc> chefOpt = chefParcRepository.findByUser(user);
        if(chefOpt.isPresent()){
            ChefParc chef = chefOpt.get();
            idChefParc = chef.getIdChefParc();
            idLocal = chef.getLocal() != null ? chef.getLocal().getIdLocal() : null;
        }

        // 🔹 Chauffeur
        Optional<Chauffeur> chauffeurOpt = chauffeurRepository.findByUser(user);
        if(chauffeurOpt.isPresent()){
            Chauffeur chauffeur = chauffeurOpt.get();
            idChauffeur = chauffeur.getIdChauffeur();
            if(chauffeur.getLocal() != null){
                idLocal = chauffeur.getLocal().getIdLocal();
            }
        }

        // 🔹 Admin
        Optional<Admin> adminOpt = adminRepository.findByUser(user);
        if(adminOpt.isPresent()){
            Admin admin = adminOpt.get();
            idAdmin = admin.getIdAdmin();
        }

        ProfileResponse response = new ProfileResponse(
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
        GestionParcService.createUser(u.getIdUser(), u.getNom(), u.getPrenom(), u.getMotDePasse(), u.getRole());
        return "USER CREATED";
    }

    // ==================== DASHBOARD ====================

    // Total des véhicules
    @GetMapping("/{idLocal}/total-vehicules")
    public long getTotalVehicules(@PathVariable Long idLocal) {
        return GestionParcService.getTotalVehicules(idLocal);
    }

    // Missions en cours
    @GetMapping("/{idLocal}/missions-en-cours")
    public long getMissionsEnCours(@PathVariable Long idLocal) {
        return GestionParcService.getNbMissionsEnCours(idLocal);
    }

    // Véhicules disponibles
    @GetMapping("/{idLocal}/vehicules-disponibles")
    public long getVehiculesDisponibles(@PathVariable Long idLocal) {
        return GestionParcService.getVehiculesDisponibles(idLocal);
    }

    // Déclarations en attente
    @GetMapping("/declarations-en-attente/{idChef}")
    public long getDeclarationsEnAttente(@PathVariable Long idChef) {
        return GestionParcService.getDeclarationsEnAttente(idChef);
    }

    // Endpoint pour récupérer le nombre d'entretiens en attente d'un chef du parc
    @GetMapping("/entretiens-en-attente/{idChef}")
    public long getEntretiensEnAttente(@PathVariable Long idChef) {
        return GestionParcService.getEntretiensEnAttente(idChef);
    }

    // Recuperer les informations d'un chef du parc a partir de son id
    @GetMapping("/chef-parc/{id}")
    public ResponseEntity<ChefParc> getChefParcById(@PathVariable Long id) {
        return GestionParcService.getChefParcById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    // 🔹 Consulter véhicules
    @GetMapping("/{idLocal}/vehicules")
    public List<Vehicule> getVehicules(@PathVariable Long idLocal){
        return GestionParcService.getVehiculesByLocal(idLocal);
    }

    // 🔹 Modifier état
    @PutMapping("/vehicule/{idVehicule}/etat")
    public Vehicule updateEtat(@PathVariable Long idVehicule,
                               @RequestParam EtatVehicule etat){
        return GestionParcService.updateEtat(idVehicule, etat);
    }
    // ==================== CRUD LOCAL ====================
    @Autowired
    private LocalService localService;

    // 🔹 Ajouter un local
    @PostMapping("/local")
    public Local addLocal(@RequestBody Local l) {
        return localService.save(l);
    }

    // 🔹 Récupérer tous les locaux
    @GetMapping("/local")
    public List<Local> getAllLocaux() {
        return localService.getAll();
    }

    // 🔹 Récupérer un local par id
    @GetMapping("/local/{id}")
    public ResponseEntity<Local> getLocalById(@PathVariable Long id) {
        Local l = localService.getById(id);
        if (l == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(l);
    }

    // 🔹 Mettre à jour un local
    @PutMapping("/local/{id}")
    public ResponseEntity<Local> updateLocal(@PathVariable Long id, @RequestBody Local newLocal) {
        Local updated = localService.update(id, newLocal);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    // 🔹 Supprimer un local
    @DeleteMapping("/local/{id}")
    public ResponseEntity<?> deleteLocal(@PathVariable Long id) {
        try {
            localService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("Local introuvable");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur serveur lors de la suppression");
        }
    }


}

