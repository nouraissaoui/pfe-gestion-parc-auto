package com.pfe.backendspringboot.Service;

import com.pfe.backendspringboot.DTO.UserRegistrationDTO;
import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

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


}