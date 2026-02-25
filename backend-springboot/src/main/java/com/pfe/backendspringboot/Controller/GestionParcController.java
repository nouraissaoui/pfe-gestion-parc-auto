package com.pfe.backendspringboot.Controller;

import com.pfe.backendspringboot.DTO.LoginRequest;
import com.pfe.backendspringboot.DTO.ProfileResponse;
import com.pfe.backendspringboot.DTO.UserRegistrationDTO;
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

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody UserRegistrationDTO dto) {
        try {
            gestionParcService.createUser(dto);
            return ResponseEntity.ok().body("{\"message\": \"Utilisateur créé avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginData) {
        Object userAuth = gestionParcService.authenticate(loginData.getMail(), loginData.getMotDePasse());

        if (userAuth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email ou mot de passe incorrect");
        }

        // Retourne un profil différent selon le type d'objet trouvé
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
}