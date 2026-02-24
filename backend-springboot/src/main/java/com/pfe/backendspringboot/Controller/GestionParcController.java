package com.pfe.backendspringboot.Controller;

import com.pfe.backendspringboot.DTO.ProfileResponse;
import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.ChauffeurRepository;
import com.pfe.backendspringboot.Repository.ChefParcRepository;
import com.pfe.backendspringboot.Service.GestionParcService;
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
    private GestionParcService gestionParcService;

    @Autowired
    private ChefParcRepository chefParcRepository;

    @Autowired
    private ChauffeurRepository chauffeurRepository;

    // Suppression de l'AdminRepository car l'Admin est géré via User

    // ==================== AUTHENTIFICATION ====================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginData) {

        Optional<User> userOpt = gestionParcService.authenticate(
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
        Long idAdmin = null; // Sera l'idUser si le rôle est ADMIN
        Long idLocal = null;

        // 🔹 Logique Chef Parc
        Optional<ChefParc> chefOpt = chefParcRepository.findByUser(user);
        if(chefOpt.isPresent()){
            ChefParc chef = chefOpt.get();
            idChefParc = chef.getIdChefParc();
            idLocal = (chef.getLocal() != null) ? chef.getLocal().getIdLocal() : null;
        }

        // 🔹 Logique Chauffeur
        Optional<Chauffeur> chauffeurOpt = chauffeurRepository.findByUser(user);
        if(chauffeurOpt.isPresent()){
            Chauffeur chauffeur = chauffeurOpt.get();
            idChauffeur = chauffeur.getIdChauffeur();
            if(chauffeur.getLocal() != null){
                idLocal = chauffeur.getLocal().getIdLocal();
            }
        }

        // 🔹 Logique Admin (Simplifiée : pas de table Admin)
        if (user.getRole() == Role.ADMIN) {
            idAdmin = user.getIdUser(); // L'ID de l'admin est son ID utilisateur
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

    @PostMapping("/create")
    public String createUser(@RequestBody User u) {
        gestionParcService.createUser(u.getIdUser(), u.getNom(), u.getPrenom(), u.getMotDePasse(), u.getRole());
        return "USER CREATED";
    }

    // ==================== DASHBOARD & STATS ====================

    @GetMapping("/{idLocal}/total-vehicules")
    public long getTotalVehicules(@PathVariable Long idLocal) {
        return gestionParcService.getTotalVehicules(idLocal);
    }

    @GetMapping("/{idLocal}/missions-en-cours")
    public long getMissionsEnCours(@PathVariable Long idLocal) {
        return gestionParcService.getNbMissionsEnCours(idLocal);
    }

    @GetMapping("/{idLocal}/vehicules-disponibles")
    public long getVehiculesDisponibles(@PathVariable Long idLocal) {
        return gestionParcService.getVehiculesDisponibles(idLocal);
    }

    @GetMapping("/{idLocal}/vehicules-en-mission")
    public long getVehiculesEnMission(@PathVariable Long idLocal) {
        return gestionParcService.getVehiculesEnMission(idLocal);
    }

    @GetMapping("/{idLocal}/vehicules-en-entretien")
    public long getVehiculesEnEntretien(@PathVariable Long idLocal) {
        return gestionParcService.getVehiculesEnEntretien(idLocal);
    }

    @GetMapping("/{idLocal}/vehicules-indisponibles")
    public long getVehiculesIndisponibles(@PathVariable Long idLocal) {
        return gestionParcService.getVehiculesIndisponibles(idLocal);
    }

    @GetMapping("/declarations-en-attente/{idChef}")
    public long getDeclarationsEnAttente(@PathVariable Long idChef) {
        return gestionParcService.getDeclarationsEnAttente(idChef);
    }

    @GetMapping("/entretiens-en-attente/{idChef}")
    public long getEntretiensEnAttente(@PathVariable Long idChef) {
        return gestionParcService.getEntretiensEnAttente(idChef);
    }

    // ==================== GESTION DES VÉHICULES ====================

    @GetMapping("/{idLocal}/vehicules")
    public List<Vehicule> getVehicules(@PathVariable Long idLocal){
        return gestionParcService.getVehiculesByLocal(idLocal);
    }

    @PutMapping("/vehicule/{idVehicule}/etat")
    public ResponseEntity<Vehicule> updateEtat(@PathVariable Long idVehicule, @RequestParam EtatVehicule etat){
        try {
            return ResponseEntity.ok(gestionParcService.updateEtatVehicule(idVehicule, etat));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ==================== CRUD LOCAL (ADMIN) ====================

    @PostMapping("/local")
    public Local addLocal(@RequestBody Local l) {
        return gestionParcService.saveLocal(l);
    }

    @GetMapping("/local")
    public List<Local> getAllLocaux() {
        return gestionParcService.getAllLocaux();
    }

    @GetMapping("/local/{id}")
    public ResponseEntity<Local> getLocalById(@PathVariable Long id) {
        return gestionParcService.getLocalById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/local/{id}")
    public ResponseEntity<Local> updateLocal(@PathVariable Long id, @RequestBody Local newLocal) {
        try {
            return ResponseEntity.ok(gestionParcService.updateLocal(id, newLocal));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/local/{id}")
    public ResponseEntity<?> deleteLocal(@PathVariable Long id) {
        try {
            gestionParcService.deleteLocal(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ==================== AFFECTATION & CHAUFFEURS ====================

    @GetMapping("/local/{idLocal}/chauffeurs")
    public ResponseEntity<List<Chauffeur>> getChauffeursDuLocal(@PathVariable Long idLocal) {
        return ResponseEntity.ok(gestionParcService.getChauffeursByLocal(idLocal));
    }

    @PutMapping("/affecter/{idChauffeur}/{idVehicule}")
    public ResponseEntity<?> affecterVehicule(@PathVariable Long idChauffeur, @PathVariable Long idVehicule) {
        try {
            Chauffeur updatedChauffeur = gestionParcService.affecterVehiculeAChauffeur(idChauffeur, idVehicule);
            return ResponseEntity.ok(updatedChauffeur);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'affectation");
        }
    }
    // Mettre à jour l'état de disponibilité d'un chauffeur
    @PutMapping("/chauffeur/{idChauffeur}/etat")
    public ResponseEntity<Chauffeur> updateEtatChauffeur(
            @PathVariable Long idChauffeur,
            @RequestParam Chauffeur.EtatChauffeur etat) {
        try {
            Chauffeur updated = gestionParcService.updateEtatChauffeur(idChauffeur, etat);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}