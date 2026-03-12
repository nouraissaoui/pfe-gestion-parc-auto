package com.pfe.backendspringboot.Service;

import com.pfe.backendspringboot.DTO.UserRegistrationDTO;
import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class GestionParcService {

    // ==================== REPOSITORIES ====================

    @Autowired
    private ChefParcRepository chefParcRepository;

    @Autowired
    private ChauffeurRepository chauffeurRepository;

    @Autowired
    private LocalRepository localRepository;

    @Autowired
    private VehiculeRepository vehiculeRepository;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private DeclarationRepository declarationRepository;

    @Autowired
    private EntretienRepository entretienRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    @Autowired
    private CarteCarburantRepository carteCarburantRepository;
    @Autowired
    private FeuilleDeRouteRepository feuilleDeRouteRepository;

    // ==================== AUTHENTIFICATION & USERS ====================
    public Object authenticate(String mail, String password) {
        // 1. Chercher dans ChefParc
        Optional<ChefParc> chef = chefParcRepository.findByMail(mail);
        if (chef.isPresent() && passwordEncoder.matches(password, chef.get().getMotDePasse())) {
            return chef.get();
        }

        // 2. Si non trouvé, chercher dans Chauffeur
        Optional<Chauffeur> chauffeur = chauffeurRepository.findByMail(mail);
        if (chauffeur.isPresent() && passwordEncoder.matches(password, chauffeur.get().getMotDePasse())) {
            return chauffeur.get();
        }

        return null; // Ou jeter une exception
    }

    public void createUser(UserRegistrationDTO dto) {
        String encodedPassword = passwordEncoder.encode(dto.getMotDePasse());
        // Génération automatique de l'email si non fourni
        String email = (dto.getMail() != null && !dto.getMail().isEmpty()) ? dto.getMail() :
                (dto.getPrenom().toLowerCase() + "." + dto.getNom().toLowerCase() + "@agil.com.tn");

        if ("CHEF_PARC".equalsIgnoreCase(dto.getRole())) {
            ChefParc chef = new ChefParc();
            chef.setNom(dto.getNom());
            chef.setPrenom(dto.getPrenom());
            chef.setMail(email);
            chef.setMotDePasse(encodedPassword);
            chef.setDateNomination(dto.getDateNomination());
            chef.setAncienneteChef(dto.getAncienneteChef());

            if (dto.getNiveauResponsabilite() != null) {
                chef.setNiveauResponsabilite(NiveauResponsabilite.valueOf(dto.getNiveauResponsabilite().toUpperCase()));
            }

            if (dto.getIdLocal() != null) {
                localRepository.findById(dto.getIdLocal()).ifPresent(chef::setLocal);
            }
            chefParcRepository.save(chef);

        } else if ("CHAUFFEUR".equalsIgnoreCase(dto.getRole())) {
            Chauffeur chauffeur = new Chauffeur();
            chauffeur.setNom(dto.getNom());
            chauffeur.setPrenom(dto.getPrenom());
            chauffeur.setMail(email);
            chauffeur.setMotDePasse(encodedPassword);
            chauffeur.setDatePriseLicense(dto.getDatePriseLicense());
            chauffeur.setAnciennete(dto.getAnciennete());
            chauffeur.setTypeVehiculePermis(dto.getTypeVehiculePermis());
            chauffeur.setDateExpirationPermis(dto.getDateExpirationPermis());
            chauffeur.setRegion(dto.getRegion());

            if (dto.getIdLocal() != null) {
                localRepository.findById(dto.getIdLocal()).ifPresent(chauffeur::setLocal);
            }
            chauffeurRepository.save(chauffeur);
        } else {
            throw new RuntimeException("Rôle '" + dto.getRole() + "' non reconnu.");
        }
    }

    // ==================== GESTION DES LOCAUX (Rôle ADMIN) ====================

    public Local saveLocal(Local l) {
        return localRepository.save(l);
    }

    public List<Local> getAllLocaux() {
        return localRepository.findAll();
    }

    public Optional<Local> getLocalById(Long id) {
        return localRepository.findById(id);
    }

    @Transactional
    public Local updateLocal(Long id, Local newLocal) {
        Local existing = localRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Local introuvable"));

        existing.setNomLocal(newLocal.getNomLocal());
        existing.setAdresse(newLocal.getAdresse());
        existing.setRegion(newLocal.getRegion());
        existing.setVille(newLocal.getVille());
        existing.setImages(newLocal.getImages());

        return localRepository.save(existing);
    }

    public void deleteLocal(Long id) {
        if (!localRepository.existsById(id)) {
            throw new RuntimeException("Impossible de supprimer : Local introuvable");
        }
        localRepository.deleteById(id);
    }

    // ==================== GESTION VÉHICULES DU LOCAL (Chef de Parc) ====================

    public List<Vehicule> getVehiculesByLocal(Long idLocal) {
        return vehiculeRepository.findByLocal_IdLocal(idLocal);
    }

    @Transactional
    public Vehicule updateEtatVehicule(Long idVehicule, EtatVehicule etat) {
        Vehicule v = vehiculeRepository.findById(idVehicule)
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        v.setEtat(etat);

        // Si le véhicule n'est plus disponible, on libère le chauffeur associé
        if (etat == EtatVehicule.EN_ENTRETIEN || etat == EtatVehicule.INDISPONIBLE) {
            chauffeurRepository.findByVehicule(v).ifPresent(chauffeur -> {
                chauffeur.setVehicule(null);
                chauffeurRepository.save(chauffeur);
            });
        }
        return vehiculeRepository.save(v);
    }

    // ==================== GESTION DES AFFECTATIONS ====================

    public List<Chauffeur> getChauffeursByLocal(Long idLocal) {
        return chauffeurRepository.findByLocal_IdLocal(idLocal);
    }

    @Transactional
    public Chauffeur affecterVehiculeAChauffeur(Long idChauffeur, Long idVehicule) {
        Vehicule vehicule = vehiculeRepository.findById(idVehicule)
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        // 1. Désaffecter le véhicule de son ancien chauffeur s'il en avait un
        chauffeurRepository.findByVehicule(vehicule).ifPresent(ancien -> {
            if (!ancien.getIdChauffeur().equals(idChauffeur)) {
                ancien.setVehicule(null);
                chauffeurRepository.save(ancien);
            }
        });

        // 2. Affecter au nouveau chauffeur
        Chauffeur nouveau = chauffeurRepository.findById(idChauffeur)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        nouveau.setVehicule(vehicule);
        vehicule.setEtat(EtatVehicule.EN_MISSION); // Mise à jour automatique de l'état

        return chauffeurRepository.save(nouveau);
    }

    // ==================== DASHBOARD & STATISTIQUES ====================

    public long getTotalVehicules(Long idLocal) {
        return vehiculeRepository.countByLocal_IdLocal(idLocal);
    }

    public long getNbMissionsEnCours(Long idLocal) {
        // Logique corrigée : on compte les missions dont la feuille n'est PAS terminée
        return (long) missionRepository.countMissionsEnCoursByLocal(idLocal, StatutFeuilleDeRoute.EN_COURS);
    }

    public long getVehiculesDisponibles(Long idLocal) {
        return vehiculeRepository.countByLocal_IdLocalAndEtat(idLocal, EtatVehicule.DISPONIBLE);
    }
    // ==================== STATS VÉHICULES DÉTAILLÉES ====================

    public long getVehiculesEnMission(Long idLocal) {
        return vehiculeRepository.countByLocal_IdLocalAndEtat(
                idLocal,
                EtatVehicule.EN_MISSION
        );
    }

    public long getVehiculesEnEntretien(Long idLocal) {
        return vehiculeRepository.countByLocal_IdLocalAndEtat(
                idLocal,
                EtatVehicule.EN_ENTRETIEN
        );
    }

    public long getVehiculesIndisponibles(Long idLocal) {
        return vehiculeRepository.countByLocal_IdLocalAndEtat(
                idLocal,
                EtatVehicule.INDISPONIBLE
        );
    }

    public long getDeclarationsEnAttente(Long idChefParc) {
        return declarationRepository.countByChefParc_IdChefParcAndStatus(idChefParc, DeclarationStatus.EN_ATTENTE);
    }

    public long getEntretiensEnAttente(Long idChefParc) {
        return entretienRepository.countEntretiensEnAttenteByChef(idChefParc);
    }

    // ==================== GESTION DES CHAUFFEURS ====================

    @Transactional
    public Chauffeur updateEtatChauffeur(Long idChauffeur, Chauffeur.EtatChauffeur nouvelEtat) {
        Chauffeur chauffeur = chauffeurRepository.findById(idChauffeur)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        chauffeur.setEtatChauffeur(nouvelEtat);

        // Logique métier : Si le chauffeur part en congé, on libère son véhicule
        if (nouvelEtat == Chauffeur.EtatChauffeur.EN_CONGE) {
            chauffeur.setVehicule(null);
        }

        return chauffeurRepository.save(chauffeur);
    }

    @Transactional
    public Mission affecterMissionManuelle(Mission mission, Long idChauffeur, Long idVehicule, Long idChefParc) {
        Chauffeur chauffeur = chauffeurRepository.findById(idChauffeur)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));
        ChefParc chef = chefParcRepository.findById(idChefParc)
                .orElseThrow(() -> new RuntimeException("Chef de parc introuvable"));

        // 1. Récupérer ou créer la feuille de route
        FeuilleDeRoute feuille = feuilleDeRouteRepository
                .findByChauffeurAndStatut(chauffeur, StatutFeuilleDeRoute.OUVERTE)
                .orElseGet(() -> {
                    // Si nouvelle feuille, on initialise avec le véhicule passé en paramètre
                    Vehicule vInitial = vehiculeRepository.findById(idVehicule)
                            .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

                    vInitial.setEtat(EtatVehicule.EN_MISSION);
                    chauffeur.setEtatChauffeur(Chauffeur.EtatChauffeur.EN_MISSION);
                    chauffeur.setVehicule(vInitial);

                    FeuilleDeRoute nf = new FeuilleDeRoute();
                    nf.setChauffeur(chauffeur);
                    nf.setVehicule(vInitial);
                    nf.setChefParc(chef);
                    nf.setDateGeneration(LocalDate.now());
                    nf.setStatut(StatutFeuilleDeRoute.OUVERTE);
                    return feuilleDeRouteRepository.save(nf);
                });

        // 2. LOGIQUE DE CHANGEMENT DE VÉHICULE
        // Si l'ID envoyé est différent de celui de la feuille de route actuelle
        if (!feuille.getVehicule().getIdVehicule().equals(idVehicule)) {
            Vehicule nouveauVehicule = vehiculeRepository.findById(idVehicule)
                    .orElseThrow(() -> new RuntimeException("Nouveau véhicule introuvable"));

            // Libérer l'ancien véhicule
            Vehicule ancienVehicule = feuille.getVehicule();
            ancienVehicule.setEtat(EtatVehicule.DISPONIBLE);

            // Configurer le nouveau
            nouveauVehicule.setEtat(EtatVehicule.EN_MISSION);
            feuille.setVehicule(nouveauVehicule); // On met à jour la feuille de route
            chauffeur.setVehicule(nouveauVehicule); // On met à jour le chauffeur

            vehiculeRepository.save(ancienVehicule);
            feuilleDeRouteRepository.save(feuille);
        }

        // 3. Finaliser la mission
        mission.setChauffeur(chauffeur);
        mission.setVehicule(feuille.getVehicule());
        mission.setChefDuParc(chef);
        mission.setLocal(chef.getLocal());
        mission.setFeuilleDeRoute(feuille);

        return missionRepository.save(mission);
    }
    // ==================== SUPPRESSION & MODIFICATION MISSIONS/FEUILLES ====================

    @Transactional
    public Mission updateMission(Long idMission, Mission details) {
        Mission m = missionRepository.findById(idMission)
                .orElseThrow(() -> new RuntimeException("Mission introuvable"));

        // ⛔ LOGIQUE DE SÉCURITÉ : Vérifier si la mission est terminée
        if (m.getHeureArriveeReelle() != null || m.getKmArrivee() != null) {
            throw new RuntimeException("Impossible de modifier une mission déjà terminée par le chauffeur.");
        }

        // Mise à jour des informations autorisées
        m.setPointDepart(details.getPointDepart());
        m.setDestination(details.getDestination());
        m.setHeureDepartPrevue(details.getHeureDepartPrevue());
        m.setDescription(details.getDescription());
        m.setDateMission(details.getDateMission());
        m.setBandePrelevement(details.getBandePrelevement());

        return missionRepository.save(m);
    }

    @Transactional
    public void deleteMission(Long idMission) {
        if (!missionRepository.existsById(idMission)) {
            throw new RuntimeException("Mission introuvable");
        }
        missionRepository.deleteById(idMission);
    }

    @Transactional
    public void deleteFeuilleDeRoute(Long idFeuille) {
        FeuilleDeRoute feuille = feuilleDeRouteRepository.findById(idFeuille)
                .orElseThrow(() -> new RuntimeException("Feuille de route introuvable"));

        // 1. Libérer le chauffeur associé
        Chauffeur chauffeur = feuille.getChauffeur();
        if (chauffeur != null) {
            chauffeur.setEtatChauffeur(Chauffeur.EtatChauffeur.DISPONIBLE);
            chauffeur.setVehicule(null);
            chauffeurRepository.save(chauffeur);
        }

        // 2. Libérer le véhicule associé
        Vehicule vehicule = feuille.getVehicule();
        if (vehicule != null) {
            vehicule.setEtat(EtatVehicule.DISPONIBLE);
            vehiculeRepository.save(vehicule);
        }

        // 3. Supprimer les missions liées (si non géré par cascade en DB)
        if (feuille.getMissions() != null) {
            missionRepository.deleteAll(feuille.getMissions());
        }

        // 4. Supprimer la feuille
        feuilleDeRouteRepository.delete(feuille);
    }


    public List<ChefParc> getAllChefsParc() {
        return chefParcRepository.findAll();
    }

    public Optional<ChefParc> getChefParcById(Long id) {
        return chefParcRepository.findById(id);
    }

    @Transactional
    public ChefParc createChefParc(String nom, String prenom, String mail, String motDePasse,
                                   LocalDate dateNomination, int ancienneteChef,
                                   String niveauResponsabilite, Long idLocal) {

        ChefParc chef = new ChefParc();
        chef.setNom(nom);
        chef.setPrenom(prenom);
        chef.setMail(mail);
        chef.setMotDePasse(passwordEncoder.encode(motDePasse));
        chef.setDateNomination(dateNomination);
        chef.setAncienneteChef(ancienneteChef);

        if (niveauResponsabilite != null) {
            chef.setNiveauResponsabilite(NiveauResponsabilite.valueOf(niveauResponsabilite.toUpperCase()));
        }

        if (idLocal != null) {
            localRepository.findById(idLocal).ifPresent(chef::setLocal);
        } else {
            chef.setLocal(null);
        }

        return chefParcRepository.save(chef);
    }

    @Transactional
    public ChefParc updateChefParc(Long id, String nom, String prenom, String mail, String motDePasse,
                                   LocalDate dateNomination, int ancienneteChef,
                                   String niveauResponsabilite, Long idLocal) {

        ChefParc chef = chefParcRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chef Parc introuvable"));

        chef.setNom(nom != null ? nom : chef.getNom());
        chef.setPrenom(prenom != null ? prenom : chef.getPrenom());
        chef.setMail(mail != null ? mail : chef.getMail());
        if (motDePasse != null) {
            chef.setMotDePasse(passwordEncoder.encode(motDePasse));
        }
        chef.setDateNomination(dateNomination != null ? dateNomination : chef.getDateNomination());
        chef.setAncienneteChef(ancienneteChef != 0 ? ancienneteChef : chef.getAncienneteChef());
// Correction : Si niveauResponsabilite est null, on l'applique au chef
        if (niveauResponsabilite != null && !niveauResponsabilite.isEmpty()) {
            chef.setNiveauResponsabilite(NiveauResponsabilite.valueOf(niveauResponsabilite.toUpperCase()));
        } else {
            // Cela permet de remettre le champ à NULL dans la base de données
            chef.setNiveauResponsabilite(null);
        }

        if (idLocal != null) {
            localRepository.findById(idLocal).ifPresent(chef::setLocal);
        } else {
            chef.setLocal(null);
        }

        return chefParcRepository.save(chef);
    }

   // ==================== CRUD VÉHICULES COMPLET ====================

    public List<Vehicule> getAllVehicules() {
        return vehiculeRepository.findAll();
    }

    public Optional<Vehicule> getVehiculeById(Long id) {
        return vehiculeRepository.findById(id);
    }

    @Transactional
    public Vehicule createVehicule(Vehicule v, Long idLocal) {
        if (idLocal != null) {
            Local local = localRepository.findById(idLocal)
                    .orElseThrow(() -> new RuntimeException("Local non trouvé"));
            v.setLocal(local);
        }
        // Par défaut, un nouveau véhicule est disponible
        if (v.getEtat() == null) {
            v.setEtat(EtatVehicule.DISPONIBLE);
        }
        return vehiculeRepository.save(v);
    }

    @Transactional
    public Vehicule updateVehicule(Long id, Vehicule newVehicule, Long idLocal) {
        Vehicule existing = vehiculeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        existing.setMatricule(newVehicule.getMatricule());
        existing.setMarque(newVehicule.getMarque());
        existing.setModele(newVehicule.getModele());
        existing.setAnnee(newVehicule.getAnnee());
        existing.setCarburant(newVehicule.getCarburant());
        existing.setImage(newVehicule.getImage());
        existing.setEtat(newVehicule.getEtat());

        if (idLocal != null) {
            Local local = localRepository.findById(idLocal)
                    .orElseThrow(() -> new RuntimeException("Local non trouvé"));
            existing.setLocal(local);
        } else {
            existing.setLocal(null);
        }

        return vehiculeRepository.save(existing);
    }

    @Transactional
    public void deleteVehicule(Long id) {
        Vehicule vehicule = vehiculeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        // 1. CARTE CARBURANT : Supprimer la carte liée au véhicule
        // (Une carte ne peut pas exister sans véhicule dans ton SQL)
        carteCarburantRepository.findByVehicule_IdVehicule(id).ifPresent(carte -> {
            carteCarburantRepository.delete(carte);
        });

        // 2. MISSIONS : Supprimer ou détacher les missions
        List<Mission> missions = missionRepository.findByVehicule_IdVehicule(id);
        if (!missions.isEmpty()) {
            missionRepository.deleteAll(missions);
        }

        // 3. DECLARATIONS
        List<Declaration> declarations = declarationRepository.findByVehicule_IdVehicule(id);
        if (!declarations.isEmpty()) {
            declarationRepository.deleteAll(declarations);
        }

        // 4. CHAUFFEUR : Libérer le chauffeur qui utilisait ce véhicule
        chauffeurRepository.findByVehicule(vehicule).ifPresent(chauffeur -> {
            chauffeur.setVehicule(null);
            chauffeur.setEtatChauffeur(Chauffeur.EtatChauffeur.DISPONIBLE);
            chauffeurRepository.save(chauffeur);
        });

        // 5. Suppression finale du véhicule
        vehiculeRepository.delete(vehicule);
    }
    public CarteCarburant getCarteByNumero(String numero) {
        return carteCarburantRepository.findByNumeroCarte(numero)
                .orElseThrow(() -> new RuntimeException("Carte introuvable"));
    }

    public CarteCarburant rechargerCarte(String numero, Double montant) {
        CarteCarburant carte = getCarteByNumero(numero);

        // Mise à jour selon votre entité
        carte.setMontantCharge(montant); // Dernier montant chargé
        carte.setMontantReel(carte.getMontantReel() + montant); // Cumul du solde
        carte.setDateChargement(LocalDate.now());

        return carteCarburantRepository.save(carte);
    }
// ==================== GESTION DES CHAUFFEURS (CRUD COMPLET) ====================

    public List<Chauffeur> getAllChauffeurs() {
        return chauffeurRepository.findAll();
    }

    public Optional<Chauffeur> getChauffeurById(Long id) {
        return chauffeurRepository.findById(id);
    }

    @Transactional
    public Chauffeur createChauffeur(Chauffeur chauffeur) {
        // 1. Validation du mot de passe (obligatoire à la création)
        if (chauffeur.getMotDePasse() == null || chauffeur.getMotDePasse().isEmpty()) {
            throw new RuntimeException("Le mot de passe est obligatoire pour la création.");
        }
        chauffeur.setMotDePasse(passwordEncoder.encode(chauffeur.getMotDePasse()));

        // 2. Gestion du Local (depuis le body)
        if (chauffeur.getLocal() != null && chauffeur.getLocal().getIdLocal() != null) {
            Local local = localRepository.findById(chauffeur.getLocal().getIdLocal())
                    .orElseThrow(() -> new RuntimeException("Local non trouvé"));
            chauffeur.setLocal(local);
        }

        return chauffeurRepository.save(chauffeur);
    }

    @Transactional
    public Chauffeur updateChauffeur(Long id, Chauffeur data) {
        Chauffeur existing = chauffeurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        // Mise à jour des champs simples
        existing.setNom(data.getNom());
        existing.setPrenom(data.getPrenom());
        existing.setMail(data.getMail());
        existing.setRegion(data.getRegion());
        existing.setAnciennete(data.getAnciennete());
        existing.setEtatChauffeur(data.getEtatChauffeur());
        existing.setTypeVehiculePermis(data.getTypeVehiculePermis());
        existing.setDateExpirationPermis(data.getDateExpirationPermis());
        existing.setDatePriseLicense(data.getDatePriseLicense());

        // 3. Protection du mot de passe (si vide dans le body, on garde l'ancien)
        if (data.getMotDePasse() != null && !data.getMotDePasse().isEmpty()) {
            existing.setMotDePasse(passwordEncoder.encode(data.getMotDePasse()));
        }

        // 4. Mise à jour du Local (depuis le body)
        if (data.getLocal() != null && data.getLocal().getIdLocal() != null) {
            Local local = localRepository.findById(data.getLocal().getIdLocal())
                    .orElseThrow(() -> new RuntimeException("Local non trouvé"));
            existing.setLocal(local);
        } else {
            existing.setLocal(null); // Permet de retirer l'affectation
        }

        return chauffeurRepository.save(existing);
    }
    @Transactional
    public void deleteChauffeur(Long id) {
        Chauffeur chauffeur = chauffeurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        // 1. MISSIONS : Supprimer les missions liées au chauffeur
        List<Mission> missions = missionRepository.findByChauffeur_IdChauffeur(id);
        if (!missions.isEmpty()) {
            missionRepository.deleteAll(missions);
        }

        // 2. FEUILLE_DE_ROUTE : Supprimer les feuilles de route
        List<FeuilleDeRoute> feuilles = feuilleDeRouteRepository.findByChauffeur_IdChauffeur(id);
        if (!feuilles.isEmpty()) {
            feuilleDeRouteRepository.deleteAll(feuilles);
        }

        // 3. DECLARATION : Supprimer les déclarations faites par ce chauffeur
        List<Declaration> declarations = declarationRepository.findByChauffeur_IdChauffeur(id);
        if (!declarations.isEmpty()) {
            declarationRepository.deleteAll(declarations);
        }

        // 4. VEHICULE : Si le chauffeur avait un véhicule, on remet le véhicule en DISPONIBLE
        if (chauffeur.getVehicule() != null) {
            Vehicule v = chauffeur.getVehicule();
            v.setEtat(EtatVehicule.DISPONIBLE);
            vehiculeRepository.save(v);
        }

        // 5. Suppression finale du chauffeur
        chauffeurRepository.delete(chauffeur);
    }


    @Transactional
    public Declaration creerDeclaration(Long idChauffeur, DeclarationType type, String description) {
        // 1. Récupérer le chauffeur
        Chauffeur chauffeur = chauffeurRepository.findById(idChauffeur)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        // 2. Vérifier si le chauffeur a un véhicule affecté
        if (chauffeur.getVehicule() == null) {
            throw new RuntimeException("Le chauffeur n'a pas de véhicule affecté pour faire une déclaration.");
        }

        // 3. Identifier le Chef de Parc du local du chauffeur
        Local localChauffeur = chauffeur.getLocal();
        if (localChauffeur == null || localChauffeur.getChefParc() == null) {
            throw new RuntimeException("Aucun chef de parc n'est assigné au local de ce chauffeur.");
        }

        // 4. Créer la déclaration
        Declaration declaration = Declaration.builder()
                .type(type)
                .description(description)
                .dateCreation(LocalDateTime.now())
                .status(DeclarationStatus.EN_ATTENTE)
                .chauffeur(chauffeur)
                .vehicule(chauffeur.getVehicule())
                .chefParc(localChauffeur.getChefParc()) // Envoi automatique au chef du parc local
                .build();

        return declarationRepository.save(declaration);
    }

    public List<Declaration> getDeclarationsByChauffeur(Long idChauffeur) {
        return declarationRepository.findByChauffeur_IdChauffeur(idChauffeur);
    }
    // Dans GestionParcService.java
    @Transactional
    public void supprimerDeclaration(Long idDeclaration, Long idChauffeur) {
        Declaration declaration = declarationRepository.findById(idDeclaration)
                .orElseThrow(() -> new RuntimeException("Déclaration introuvable"));

        // Vérifier que c'est bien le propriétaire qui supprime
        if (!declaration.getChauffeur().getIdChauffeur().equals(idChauffeur)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à supprimer cette déclaration.");
        }

        // Optionnel : Empêcher la suppression si le chef l'a déjà validée/traitée
        if (declaration.getStatus() != DeclarationStatus.EN_ATTENTE) {
            throw new RuntimeException("Impossible de supprimer une déclaration déjà traitée.");
        }

        declarationRepository.delete(declaration);
    }
// ==================== LOGIQUE CHAUFFEUR ====================

    /**
     * Récupère toutes les feuilles de route assignées à un chauffeur spécifique
     */
    public List<FeuilleDeRoute> getFeuillesParChauffeur(Long idChauffeur) {
        return feuilleDeRouteRepository.findByChauffeur_IdChauffeur(idChauffeur);
    }

    /**
     * Met à jour les données réelles d'une mission existante
     */
    @Transactional
    public Mission completerMissionDonneesReelles(Long idMission, Double kmDep, Double kmArr, LocalTime hDep, LocalTime hArr) {
        Mission mission = missionRepository.findById(idMission)
                .orElseThrow(() -> new RuntimeException("Mission ID " + idMission + " introuvable"));

        mission.setKmArrivee(kmArr);
        mission.setKmDepart(kmDep);
        mission.setHeureDepartReelle(hDep);
        mission.setHeureArriveeReelle(hArr);

        return missionRepository.save(mission);
    }
    @Transactional
    public void deleteChefParc(Long id) {
        ChefParc chef = chefParcRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chef de parc introuvable avec l'ID : " + id));

        // --- CORRECTION FEUILLE DE ROUTE ---
        // On enlève le "Du" pour correspondre à l'entité
        List<FeuilleDeRoute> feuilles = feuilleDeRouteRepository.findByChefParc_IdChefParc(id);
        if (!feuilles.isEmpty()) {
            feuilleDeRouteRepository.deleteAll(feuilles);
        }

        // 3. Table CARTE_CARBURANT
        // Vérifiez si CarteCarburant utilise "chefDuParc" ou "chefParc" dans son entité.
        // Si vous avez une erreur sur celle-ci, retirez aussi le "Du".
        List<CarteCarburant> cartes = carteCarburantRepository.findByChefDuParc_IdChefParc(id);
        if (!cartes.isEmpty()) {
            carteCarburantRepository.deleteAll(cartes);
        }

        // 4. Table DECLARATION (C'est déjà corrigé ici, bien joué !)
        List<Declaration> declarations = declarationRepository.findByChefParc_IdChefParc(id);
        if (!declarations.isEmpty()) {
            declarationRepository.deleteAll(declarations);
        }

        // 5. Table ENTRETIEN (Suppression forcée)
        List<Entretien> entretiens = entretienRepository.findByChefDuParc_IdChefParc(id);
        if (!entretiens.isEmpty()) {
            entretienRepository.deleteAll(entretiens);
        }

        // 6. Table MISSIONS (Suppression forcée)
        List<Mission> missions = missionRepository.findByChefDuParc_IdChefParc(id);
        if (!missions.isEmpty()) {
            missionRepository.deleteAll(missions);
        }

        // 7. Table LOCAL (Relation 1:1)
        // On libère simplement le local sans le supprimer (généralement le bâtiment reste)
        localRepository.findAll().stream()
                .filter(l -> chef.equals(l.getChefParc()))
                .forEach(l -> {
                    l.setChefParc(null);
                    localRepository.save(l);
                });

        // 8. Suppression finale du Chef
        chefParcRepository.delete(chef);

        // Flush pour valider immédiatement
        chefParcRepository.flush();
    }}