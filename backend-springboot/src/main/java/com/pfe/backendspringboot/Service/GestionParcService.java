package com.pfe.backendspringboot.Service;


import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.*;
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
    private AdminRepository adminRepository;

    @Autowired
    private LocalRepository localRepository;


    private final VehiculeRepository vehiculeRepository;
    private final MissionRepository missionRepository;
    private final DeclarationRepository declarationRepository;
    private final EntretienRepository entretienRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public GestionParcService(VehiculeRepository vehiculeRepository,
                              MissionRepository missionRepository,
                              DeclarationRepository declarationRepository,
                              EntretienRepository entretienRepository) {
        this.vehiculeRepository = vehiculeRepository;
        this.missionRepository = missionRepository;
        this.declarationRepository = declarationRepository;
        this.entretienRepository = entretienRepository;
    }

    // ==================== AUTHENTIFICATION ====================
    public Optional<User> authenticate(String mail, String password){
        Optional<User> userOpt = userRepository.findByMail(mail);
        if(userOpt.isPresent()){
            User user = userOpt.get();
            if(passwordEncoder.matches(password, user.getMotDePasse())){
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    public User createUser(long iduser, String nom, String prenom, String rawPassword, Role role){
        User user = new User();
        user.setIdUser(iduser);
        user.setNom(nom);
        user.setPrenom(prenom);

        // Génération automatique du mail
        String email = prenom.toLowerCase() + "." + nom.toLowerCase() + "@agil.com.tn";
        user.setMail(email);

        // Hashage du mot de passe
        user.setMotDePasse(passwordEncoder.encode(rawPassword));
        user.setRole(role);

        return userRepository.save(user);
    }

    // ==================== DASHBOARD ====================
    public long getTotalVehicules(Long idLocal) {
        return vehiculeRepository.countByLocal_IdLocal(idLocal);
    }

    public long getNbMissionsEnCours(Long idLocal) {
        return (long) missionRepository.countMissionsEnCoursByLocal(idLocal, StatutFeuilleDeRoute.TERMINE);
    }

    public long getVehiculesDisponibles(Long idLocal) {
        return vehiculeRepository.countByLocal_IdLocalAndEtat(idLocal, EtatVehicule.DISPONIBLE);
    }

    public long getDeclarationsEnAttente(Long idChefParc) {
        return declarationRepository.countByChefParc_IdChefParcAndStatus(idChefParc, DeclarationStatus.EN_ATTENTE);
    }

    public long getEntretiensEnAttente(Long idChefParc) {
        return entretienRepository.countEntretiensEnAttenteByChef(idChefParc);
    }

    public Optional<ChefParc> getChefParcById(Long id) {
        return chefParcRepository.findById(id);
    }

    // ==================== UTILS ====================
    public Optional<ChefParc> getChefParcByUser(User user){
        return chefParcRepository.findByUser(user);
    }

    public Optional<Chauffeur> getChauffeurByUser(User user){
        return chauffeurRepository.findByUser(user);
    }

    public Optional<Admin> getAdminByUser(User user){
        return adminRepository.findByUser(user);
    }
    //======================gestion des vehicules de son local==========
    // 1️⃣ Consulter véhicules
    public List<Vehicule> getVehiculesByLocal(Long idLocal){
        return vehiculeRepository.findByLocal_IdLocal(idLocal);
    }

    // 2️⃣ Mettre à jour état
    public Vehicule updateEtat(Long idVehicule, EtatVehicule etat){
        Vehicule v = vehiculeRepository.findById(idVehicule)
                .orElseThrow(() -> new RuntimeException("Vehicule introuvable"));

        v.setEtat(etat);
        return vehiculeRepository.save(v);
    }
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


    //==============gestion des locaux==============

    public Local save(Local l) {
        return localRepository.save(l);
    }

    public List<Local> getAll() {
        return localRepository.findAll();
    }

    public Local getById(Long id) {
        return localRepository.findById(id).orElse(null);
    }

    public void delete(Long id) {
        if (!localRepository.existsById(id)) {
            throw new RuntimeException("Local introuvable");
        }
        localRepository.deleteById(id);
    }

    public Local update(Long id, Local newLocal){

        Local existing=localRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Local not found"));

        existing.setNomLocal(newLocal.getNomLocal());
        existing.setAdresse(newLocal.getAdresse());
        existing.setRegion(newLocal.getRegion());
        existing.setVille(newLocal.getVille());
        existing.setImages(newLocal.getImages());

        return localRepository.save(existing);
    }
    // ==================== GESTION DES AFFECTATIONS ====================

    /**
     * Récupère tous les chauffeurs d'un local spécifique.
     * Utile pour le filtrage dans le modal d'affectation.
     */
    public List<Chauffeur> getChauffeursByLocal(Long idLocal) {
        return chauffeurRepository.findByLocal_IdLocal(idLocal);
    }

    /**
     * Réalise l'affectation d'un véhicule à un chauffeur.
     * Si le chauffeur avait déjà un véhicule, il est remplacé par le nouveau.
     */
    public Chauffeur affecterVehiculeAChauffeur(Long idChauffeur, Long idVehicule) {
        Chauffeur chauffeur = chauffeurRepository.findById(idChauffeur)
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        Vehicule vehicule = vehiculeRepository.findById(idVehicule)
                .orElseThrow(() -> new RuntimeException("Vehicule introuvable"));

        // Liaison du véhicule au chauffeur
        chauffeur.setVehicule(vehicule);

        // On met à jour l'état du véhicule pour indiquer qu'il n'est plus "Libre" si nécessaire
        // vehicule.setEtat(EtatVehicule.EN_MISSION); // Optionnel selon vos règles métier

        return chauffeurRepository.save(chauffeur);
    }


}
