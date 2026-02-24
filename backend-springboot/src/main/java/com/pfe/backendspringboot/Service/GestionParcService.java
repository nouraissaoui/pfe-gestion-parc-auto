package com.pfe.backendspringboot.Service;

import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GestionParcService {

    // ==================== REPOSITORIES ====================
    @Autowired
    private UserRepository userRepository;

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

    // ==================== AUTHENTIFICATION & USERS ====================

    public Optional<User> authenticate(String mail, String password) {
        return userRepository.findByMail(mail)
                .filter(user -> passwordEncoder.matches(password, user.getMotDePasse()));
    }

    public User createUser(long iduser, String nom, String prenom, String rawPassword, Role role) {
        User user = new User();
        user.setIdUser(iduser);
        user.setNom(nom);
        user.setPrenom(prenom);

        // Génération du mail professionnel
        String email = prenom.toLowerCase() + "." + nom.toLowerCase() + "@agil.com.tn";
        user.setMail(email);

        user.setMotDePasse(passwordEncoder.encode(rawPassword));
        user.setRole(role);

        return userRepository.save(user);
    }

    public Optional<ChefParc> getChefParcByUser(User user) {
        return chefParcRepository.findByUser(user);
    }

    public Optional<Chauffeur> getChauffeurByUser(User user) {
        return chauffeurRepository.findByUser(user);
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
}