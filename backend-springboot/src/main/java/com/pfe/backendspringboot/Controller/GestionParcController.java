package com.pfe.backendspringboot.Controller;

import com.pfe.backendspringboot.DTO.LoginRequest;
import com.pfe.backendspringboot.DTO.ProfileResponse;
import com.pfe.backendspringboot.DTO.UserRegistrationDTO;
import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.ChauffeurRepository;
import com.pfe.backendspringboot.Repository.ChefParcRepository;
import com.pfe.backendspringboot.Service.GestionParcService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody UserRegistrationDTO dto) {
        try {
            gestionParcService.createUser(dto);
            return ResponseEntity.ok().body("{\"message\": \"Utilisateur créé avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginData) {

        // 1. Vérification de l'Admin unique (statique)
        if (adminEmail.equals(loginData.getMail()) && adminPassword.equals(loginData.getMotDePasse())) {
            ProfileResponse adminRes = new ProfileResponse(
                    0L, // ID fictif pour l'admin
                    "Admin",
                    "System",
                    adminEmail,
                    "ADMIN",
                    null
            );
            return ResponseEntity.ok(adminRes);
        }

        // 2. Si ce n'est pas l'admin, on vérifie les utilisateurs en base de données
        Object userAuth = gestionParcService.authenticate(loginData.getMail(), loginData.getMotDePasse());

        if (userAuth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email ou mot de passe incorrect");
        }

        // 3. Identification du type d'utilisateur (Chef ou Chauffeur)
        if (userAuth instanceof ChefParc chef) {
            ProfileResponse res = new ProfileResponse(
                    chef.getIdChefParc(),
                    chef.getNom(),
                    chef.getPrenom(),
                    chef.getMail(),
                    "CHEF_PARC",
                    (chef.getLocal() != null) ? chef.getLocal().getIdLocal() : null
            );
            return ResponseEntity.ok(res);
        }

        if (userAuth instanceof Chauffeur chauffeur) {
            ProfileResponse res = new ProfileResponse(
                    chauffeur.getIdChauffeur(),
                    chauffeur.getNom(),
                    chauffeur.getPrenom(),
                    chauffeur.getMail(),
                    "CHAUFFEUR",
                    (chauffeur.getLocal() != null) ? chauffeur.getLocal().getIdLocal() : null
            );
            return ResponseEntity.ok(res);
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Type utilisateur inconnu");
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
    // ===== GET ALL CHEFS =====
    @GetMapping("/chefparc")
    public List<ChefParc> getAllChefs() {
        return gestionParcService.getAllChefsParc();
    }

    // ===== GET CHEF BY ID =====
    @GetMapping("/chefparc/{id}")
    public ResponseEntity<ChefParc> getChefById(@PathVariable Long id) {
        return gestionParcService.getChefParcById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping("/chefparc")
    public ResponseEntity<?> createChefParc(@RequestBody Map<String, Object> payload) {
        try {
            String nom = (String) payload.get("nom");
            String prenom = (String) payload.get("prenom");
            String mail = (String) payload.get("mail");
            String motDePasse = (String) payload.get("motDePasse");
            String niveau = (String) payload.get("niveauResponsabilite");
            LocalDate dateNomination = payload.get("dateNomination") != null ?
                    LocalDate.parse((String) payload.get("dateNomination")) : null;
            int anciennete = payload.get("ancienneteChef") != null ? (Integer) payload.get("ancienneteChef") : 0;
            Long idLocal = payload.get("idLocal") != null ? Long.valueOf(payload.get("idLocal").toString()) : null;

            ChefParc chef = gestionParcService.createChefParc(
                    nom, prenom, mail, motDePasse, dateNomination, anciennete, niveau, idLocal
            );
            return ResponseEntity.ok(chef);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PutMapping("/chefparc/{id}")
    public ResponseEntity<?> updateChefParc(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            String nom = (String) payload.get("nom");
            String prenom = (String) payload.get("prenom");
            String mail = (String) payload.get("mail");
            String motDePasse = (String) payload.get("motDePasse");
            String niveau = (String) payload.get("niveauResponsabilite");
            LocalDate dateNomination = payload.get("dateNomination") != null ?
                    LocalDate.parse((String) payload.get("dateNomination")) : null;
            int anciennete = payload.get("ancienneteChef") != null ? (Integer) payload.get("ancienneteChef") : 0;
            Long idLocal = payload.get("idLocal") != null ? Long.valueOf(payload.get("idLocal").toString()) : null;

            ChefParc chef = gestionParcService.updateChefParc(
                    id, nom, prenom, mail, motDePasse, dateNomination, anciennete, niveau, idLocal
            );
            return ResponseEntity.ok(chef);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/chefparc/{id}")
    public ResponseEntity<?> deleteChefParc(@PathVariable Long id) {
        try {
            gestionParcService.deleteChefParc(id);
            return ResponseEntity.ok("Chef Parc supprimé avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    // ==================== CRUD VÉHICULE (API) ====================

    // 1. Obtenir tous les véhicules du système
    @GetMapping("/vehicules")
    public List<Vehicule> getAllVehicules() {
        return gestionParcService.getAllVehicules();
    }

    // 2. Obtenir un véhicule par son ID
    @GetMapping("/vehicule/{id}")
    public ResponseEntity<Vehicule> getVehiculeById(@PathVariable Long id) {
        return gestionParcService.getVehiculeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Ajouter un véhicule et l'affecter à un local
    @PostMapping("/vehicule")
    public ResponseEntity<?> addVehicule(@RequestBody Vehicule v, @RequestParam(required = false) Long idLocal) {
        try {
            Vehicule saved = gestionParcService.createVehicule(v, idLocal);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

    // 4. Modifier un véhicule
    @PutMapping("/vehicule/{id}")
    public ResponseEntity<?> updateVehicule(@PathVariable Long id, @RequestBody Vehicule v, @RequestParam(required = false) Long idLocal) {
        try {
            Vehicule updated = gestionParcService.updateVehicule(id, v, idLocal);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // 5. Supprimer un véhicule
    @DeleteMapping("/vehicule/{id}")
    public ResponseEntity<?> deleteVehicule(@PathVariable Long id) {
        try {
            gestionParcService.deleteVehicule(id);
            return ResponseEntity.ok().body("{\"message\": \"Véhicule supprimé avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

}