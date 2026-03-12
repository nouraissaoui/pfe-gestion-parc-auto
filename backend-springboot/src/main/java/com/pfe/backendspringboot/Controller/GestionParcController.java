package com.pfe.backendspringboot.Controller;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.pfe.backendspringboot.DTO.LoginRequest;
import com.pfe.backendspringboot.DTO.ProfileResponse;
import com.pfe.backendspringboot.DTO.UserRegistrationDTO;
import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.*;
import com.pfe.backendspringboot.Service.GestionParcService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gestion-parc")
@CrossOrigin(origins = "http://localhost:4200")
public class GestionParcController {

    @Autowired
    private GestionParcService gestionParcService;
    @Autowired
    private MissionRepository missionRepository;
    @Autowired
    private FeuilleDeRouteRepository feuilleDeRouteRepository;

    @Autowired
    private DeclarationRepository declarationRepository;

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
    @PostMapping("/mission/affecter/{idChauffeur}/{idVehicule}/{idChef}")
    public ResponseEntity<?> creerMissionManuelle(
            @RequestBody Mission mission,
            @PathVariable Long idChauffeur,
            @PathVariable Long idVehicule,
            @PathVariable Long idChef) {
        try {
            Mission nouvelleMission = gestionParcService.affecterMissionManuelle(mission, idChauffeur, idVehicule, idChef);
            return ResponseEntity.ok(nouvelleMission);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    // Récupérer toutes les missions d'une feuille de route spécifique
    @GetMapping("/feuille-de-route/{idFeuille}/missions")
    public ResponseEntity<List<Mission>> getMissionsDeLaFeuille(@PathVariable Long idFeuille) {
        return feuilleDeRouteRepository.findById(idFeuille)
                .map(f -> ResponseEntity.ok(f.getMissions()))
                .orElse(ResponseEntity.notFound().build());
    }

    // Modifier une mission existante dans le carnet
    @PutMapping("/mission/modifier/{idMission}")
    public ResponseEntity<Mission> modifierMission(@PathVariable Long idMission, @RequestBody Mission missionDetails) {
        return missionRepository.findById(idMission).map(m -> {
            m.setPointDepart(missionDetails.getPointDepart());
            m.setDestination(missionDetails.getDestination());
            m.setHeureDepartPrevue(missionDetails.getHeureDepartPrevue());
            m.setDescription(missionDetails.getDescription());
            return ResponseEntity.ok(missionRepository.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }
    // Dans GestionParcController.java

    @GetMapping("/local/{idLocal}/feuilles-actives")
    public ResponseEntity<List<FeuilleDeRoute>> getFeuillesActives(@PathVariable Long idLocal) {
        // On appelle la méthode que vous avez ajoutée dans le repository
        List<FeuilleDeRoute> feuilles = feuilleDeRouteRepository.findByLocalId(idLocal);
        return ResponseEntity.ok(feuilles);
    }


    // Supprimer une mission
    @DeleteMapping("/mission/supprimer/{idMission}")
    public ResponseEntity<?> supprimerMission(@PathVariable Long idMission) {
        try {
            gestionParcService.deleteMission(idMission);
            return ResponseEntity.ok().body("{\"message\": \"Mission supprimée avec succès\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Supprimer une feuille de route complète
    @DeleteMapping("/feuille-de-route/supprimer/{idFeuille}")
    public ResponseEntity<?> supprimerFeuille(@PathVariable Long idFeuille) {
        try {
            gestionParcService.deleteFeuilleDeRoute(idFeuille);
            return ResponseEntity.ok().body("{\"message\": \"Feuille de route et missions supprimées, ressources libérées\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"error\": \"" + e.getMessage() + "\"}");
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
            return ResponseEntity.ok().body("{\"message\": \"Chef Parc et ses références ont été traités avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la suppression : " + e.getMessage());
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
            // Utilisation d'une Map pour garantir un JSON valide
            return ResponseEntity.ok(Collections.singletonMap("message", "Véhicule supprimé"));
        } catch (EmptyResultDataAccessException  e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("error", "Véhicule introuvable ID: " + id));
        } catch (Exception e) {
            // Erreur de contrainte (ex: véhicule lié à une mission)
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Collections.singletonMap("error", "Impossible de supprimer : le véhicule est utilisé ailleurs."));
        }
    }
// ==================== GESTION DES CARTES CARBURANT ====================

    @GetMapping("/carte/{numero}")
    public ResponseEntity<CarteCarburant> getCarte(@PathVariable String numero) {
        try {
            return ResponseEntity.ok(gestionParcService.getCarteByNumero(numero));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/carte/recharger/{numero}")
    public ResponseEntity<?> recharger(@PathVariable String numero, @RequestBody Map<String, Double> payload) {
        try {
            Double montant = payload.get("montant");
            CarteCarburant updated = gestionParcService.rechargerCarte(numero, montant);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // ==================== CRUD CHAUFFEUR (API) ====================

    @GetMapping("/chauffeurs")
    public List<Chauffeur> getAllChauffeurs() {
        return gestionParcService.getAllChauffeurs();
    }

    @GetMapping("/chauffeur/{id}")
    public ResponseEntity<Chauffeur> getChauffeurById(@PathVariable Long id) {
        return gestionParcService.getChauffeurById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/chauffeur")
    public ResponseEntity<?> addChauffeur(@RequestBody Chauffeur c) {
        try {
            Chauffeur saved = gestionParcService.createChauffeur(c);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/chauffeur/{id}")
    public ResponseEntity<?> updateChauffeur(@PathVariable Long id, @RequestBody Chauffeur c) {
        try {
            Chauffeur updated = gestionParcService.updateChauffeur(id, c);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    /*@DeleteMapping("/chauffeur/{id}")
    public ResponseEntity<?> deleteChauffeur(@PathVariable Long id) {
        try {
            gestionParcService.deleteChauffeur(id);
            return ResponseEntity.ok().body("{\"message\": \"Chauffeur supprimé avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }*/
    // ==================== GESTION DES DÉCLARATIONS (Chauffeur) ====================
/*
    @PostMapping("/declaration/creer")
    public ResponseEntity<?> createDeclaration(@RequestBody Map<String, Object> payload) {
        try {
            Long idChauffeur = Long.valueOf(payload.get("idChauffeur").toString());
            DeclarationType type = DeclarationType.valueOf(payload.get("type").toString().toUpperCase());
            String description = payload.get("description").toString();

            Declaration nouvelle = gestionParcService.creerDeclaration(idChauffeur, type, description);
            return ResponseEntity.ok(nouvelle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/chauffeur/{idChauffeur}/declarations")
    public ResponseEntity<List<Declaration>> getMesDeclarations(@PathVariable Long idChauffeur) {
        return ResponseEntity.ok(gestionParcService.getDeclarationsByChauffeur(idChauffeur));
    }

    // Optionnel : Pour que le Chef de Parc puisse valider/traiter une déclaration
    @PutMapping("/declaration/{idDeclaration}/statut")
    public ResponseEntity<?> updateStatutDeclaration(
            @PathVariable Long idDeclaration,
            @RequestParam DeclarationStatus status) {
        try {
            Declaration dec = declarationRepository.findById(idDeclaration)
                    .orElseThrow(() -> new RuntimeException("Déclaration introuvable"));
            dec.setStatus(status);
            return ResponseEntity.ok(declarationRepository.save(dec));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }*/
    // Récupérer tous les entretiens d'un local
    @GetMapping("/local/{idLocal}/entretiens")
    public ResponseEntity<List<Entretien>> getEntretiensByLocal(@PathVariable Long idLocal) {
        return ResponseEntity.ok(gestionParcService.getEntretiensByLocal(idLocal));
    }

    // Planifier un entretien périodique
    @PostMapping("/entretien/periodique")
    public ResponseEntity<Entretien> planifierEntretien(
            @RequestBody Entretien entretien,
            @RequestParam Long idVehicule,
            @RequestParam Long idGarage,
            @RequestParam Long idChef) {
        return ResponseEntity.ok(gestionParcService.creerEntretienPeriodique(entretien, idVehicule, idGarage, idChef));
    }

    // Mettre à jour un entretien (ex: passer à TRAITE)
    @PutMapping("/entretien/{id}")
    public ResponseEntity<Entretien> updateEntretien(@PathVariable Long id, @RequestBody Entretien details) {
        return ResponseEntity.ok(gestionParcService.updateEntretien(id, details));
    }

    // Supprimer un entretien
    @DeleteMapping("/entretien/{id}")
    public ResponseEntity<Void> deleteEntretien(@PathVariable Long id) {
        gestionParcService.deleteEntretien(id);
        return ResponseEntity.ok().build();
    }

    // Liste des garages pour les formulaires
    @GetMapping("/garages")
    public ResponseEntity<List<GarageMaintenance>> getGarages() {
        return ResponseEntity.ok(gestionParcService.getAllGarages());
    }
    //traitement des declarations
    // Liste des déclarations à traiter pour le local
    @GetMapping("/local/{idLocal}/declarations-en-attente")
    public ResponseEntity<List<Declaration>> getDeclarationsEnAttenteLocal(@PathVariable Long idLocal) {
        return ResponseEntity.ok(gestionParcService.getDeclarationsEnAttenteParLocal(idLocal));
    }

    // Historique complet des déclarations du local
    @GetMapping("/local/{idLocal}/declarations-toutes")
    public ResponseEntity<List<Declaration>> getToutesDeclarationsLocal(@PathVariable Long idLocal) {
        return ResponseEntity.ok(gestionParcService.getAllDeclarationsByLocal(idLocal));
    }

    // Action de validation du traitement (Crée l'entretien automatiquement)
    @PostMapping("/declaration/{idDec}/traiter")
    public ResponseEntity<?> validerTraitement(
            @PathVariable Long idDec,
            @RequestParam Long idChef,
            @RequestParam Long idGarage,
            @RequestParam String typeEntretien,
            @RequestParam String datePrevue,
            @RequestParam String obs) {
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(datePrevue);
            Entretien e = gestionParcService.traiterDeclarationEtCreerEntretien(idDec, idChef, idGarage, date, typeEntretien, obs);
            return ResponseEntity.ok(e);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }
    @GetMapping("/chauffeur/{idChauffeur}/missions")
    public ResponseEntity<List<Mission>> getMissionsChauffeur(@PathVariable Long idChauffeur) {
        System.out.println("Requête des missions pour le chauffeur ID : " + idChauffeur);

        // On récupère la liste via le repository
        List<Mission> missions = missionRepository.findByChauffeur_IdChauffeur(idChauffeur);

        // Si la liste est nulle, on renvoie une liste vide pour éviter l'erreur Angular
        if (missions == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        System.out.println("Nombre de missions trouvées : " + missions.size());
        return ResponseEntity.ok(missions);
    }
    // AJOUTEZ CECI DANS GestionParcController.java
    /*@PutMapping("/declaration/modifier/{id}")
    public ResponseEntity<?> modifierContenuDeclaration(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        try {
            return declarationRepository.findById(id).map(dec -> {
                // On met à jour les champs reçus depuis Angular
                dec.setType(DeclarationType.valueOf(payload.get("type").toString().toUpperCase()));
                dec.setDescription(payload.get("description").toString());
                dec.setStatus(DeclarationStatus.EN_ATTENTE); // On repasse en attente après modif

                Declaration updated = declarationRepository.save(dec);
                return ResponseEntity.ok(updated);
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    @DeleteMapping("/declarations/{id}")
    public ResponseEntity<?> supprimerDeclaration(@PathVariable Long id, @RequestParam Long idChauffeur) {
        try {
            gestionParcService.supprimerDeclaration(id, idChauffeur);
            return ResponseEntity.ok().body("{\"message\": \"Déclaration supprimée avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }*/
    // ==================== ENDPOINTS CHAUFFEUR ====================

    @GetMapping("/chauffeur/{idChauffeur}/feuilles")
    public ResponseEntity<List<FeuilleDeRoute>> getFeuillesChauffeur(@PathVariable Long idChauffeur) {
        List<FeuilleDeRoute> feuilles = gestionParcService.getFeuillesParChauffeur(idChauffeur);
        return ResponseEntity.ok(feuilles);
    }

    /**
     * ÉTAPE 2 : Le chauffeur complète les champs vides
     * PUT http://localhost:8080/api/gestion-parc/mission/{id}/completer
     */
    // Remplacez votre méthode existante par celle-ci
    @PutMapping("/mission/{idMission}/completer")
    public ResponseEntity<?> completerMission(@PathVariable Long idMission, @RequestBody Map<String, Object> updates) {
        try {
            // On récupère la mission existante
            Mission mission = missionRepository.findById(idMission)
                    .orElseThrow(() -> new RuntimeException("Mission introuvable"));

            // On met à jour seulement les champs de fin de mission
            if (updates.containsKey("kmDepart")) mission.setKmDepart(Double.valueOf(updates.get("kmDepart").toString()));
            if (updates.containsKey("kmArrivee")) mission.setKmArrivee(Double.valueOf(updates.get("kmArrivee").toString()));
            if (updates.containsKey("observations")) mission.setObservations((String) updates.get("observations"));

            // Gestion des heures (conversion String -> LocalTime)
            if (updates.containsKey("heureDepartReelle"))
                mission.setHeureDepartReelle(LocalTime.parse((String) updates.get("heureDepartReelle")));
            if (updates.containsKey("heureArriveeReelle"))
                mission.setHeureArriveeReelle(LocalTime.parse((String) updates.get("heureArriveeReelle")));

            return ResponseEntity.ok(missionRepository.save(mission));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/declaration/creer")
    public ResponseEntity<?> createDeclaration(@RequestBody Map<String, Object> payload) {
        try {
            Long idChauffeur = Long.valueOf(payload.get("idChauffeur").toString());
            DeclarationType type = DeclarationType.valueOf(payload.get("type").toString().toUpperCase());
            String description = payload.get("description").toString();

            Declaration nouvelle = gestionParcService.creerDeclaration(idChauffeur, type, description);
            return ResponseEntity.ok(nouvelle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/chauffeur/{idChauffeur}/declarations")
    public ResponseEntity<List<Declaration>> getMesDeclarations(@PathVariable Long idChauffeur) {
        return ResponseEntity.ok(gestionParcService.getDeclarationsByChauffeur(idChauffeur));
    }

    // Optionnel : Pour que le Chef de Parc puisse valider/traiter une déclaration
    @PutMapping("/declaration/{idDeclaration}/statut")
    public ResponseEntity<?> updateStatutDeclaration(
            @PathVariable Long idDeclaration,
            @RequestParam DeclarationStatus status) {
        try {
            Declaration dec = declarationRepository.findById(idDeclaration)
                    .orElseThrow(() -> new RuntimeException("Déclaration introuvable"));
            dec.setStatus(status);
            return ResponseEntity.ok(declarationRepository.save(dec));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    // Dans GestionParcController.java

    // AJOUTEZ CECI DANS GestionParcController.java
    @PutMapping("/declaration/modifier/{id}")
    public ResponseEntity<?> modifierContenuDeclaration(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        try {
            return declarationRepository.findById(id).map(dec -> {
                // On met à jour les champs reçus depuis Angular
                dec.setType(DeclarationType.valueOf(payload.get("type").toString().toUpperCase()));
                dec.setDescription(payload.get("description").toString());
                dec.setStatus(DeclarationStatus.EN_ATTENTE); // On repasse en attente après modif

                Declaration updated = declarationRepository.save(dec);
                return ResponseEntity.ok(updated);
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    @DeleteMapping("/declarations/{id}")
    public ResponseEntity<?> supprimerDeclaration(@PathVariable Long id, @RequestParam Long idChauffeur) {
        try {
            gestionParcService.supprimerDeclaration(id, idChauffeur);
            return ResponseEntity.ok().body("{\"message\": \"Déclaration supprimée avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
    @DeleteMapping("/chauffeur/{id}")
    public ResponseEntity<?> deleteChauffeur(@PathVariable Long id) {
        try {
            gestionParcService.deleteChauffeur(id);
            return ResponseEntity.ok().body("{\"message\": \"Chauffeur supprimé avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }


}