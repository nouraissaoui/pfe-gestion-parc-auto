package com.pfe.backendspringboot.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pfe.backendspringboot.Entities.*;
import com.pfe.backendspringboot.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    @Value("${claude.api.key}")
    private String claudeApiKey;

    @Autowired private VehiculeRepository vehiculeRepository;
    @Autowired private ChauffeurRepository chauffeurRepository;
    @Autowired private MissionRepository missionRepository;
    @Autowired private DeclarationRepository declarationRepository;
    @Autowired private FeuilleDeRouteRepository feuilleDeRouteRepository;
    @Autowired private ChefParcRepository chefParcRepository;
    @Autowired private EntretienRepository entretienRepository;
    @Autowired private GarageMaintenanceRepository garageMaintenanceRepository;
    @Autowired private CarteCarburantRepository carteCarburantRepository;
    @Autowired private LocalRepository localRepository;

    @Autowired private GestionParcService gestionParcService;

    private final ObjectMapper mapper = new ObjectMapper();

    private static final String SEP_HEAVY = "─────────────────────────────\n";
    private static final String SEP_LIGHT  = "\n   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n";

    // ================== NORMALISATION ==================
    private String normaliser(String texte) {
        if (texte == null) return "";
        return texte.toLowerCase()
                .replace("é", "e").replace("è", "e").replace("ê", "e").replace("ë", "e")
                .replace("à", "a").replace("â", "a").replace("ä", "a")
                .replace("ù", "u").replace("û", "u").replace("ü", "u")
                .replace("ô", "o").replace("ö", "o")
                .replace("î", "i").replace("ï", "i")
                .replace("ç", "c")
                .trim();
    }

    // ================== MAIN FUNCTION ==================
    public String processMessage(String message, String role, Long userId, Long localId, String userName) {
        String msgN = normaliser(message);

        // DEBUG — à retirer après validation
        System.out.println("=== CHATBOT DEBUG ===");
        System.out.println("Role    : " + role);
        System.out.println("UserId  : " + userId);
        System.out.println("LocalId : " + localId);
        System.out.println("MsgOrig : " + message.replace("\n", "\\n"));
        System.out.println("MsgNorm : " + msgN.replace("\n", "\\n"));
        System.out.println("====================");

        // 1. Salutations
        if (isSalutation(msgN)) {
            return repondreAvecClaude(
                    "L'utilisateur s'appelle " + userName + ", rôle: " + role + ". " +
                            "Message de salutation: \"" + message + "\". " +
                            "Réponds chaleureusement en mentionnant son prénom et propose-lui brièvement ce que tu peux faire. " +
                            "Ne commence pas ta réponse par Bonjour si le message lui-même est une salutation — sois naturel.",
                    role
            );
        }

        // 2. Capacités
        if (msgN.contains("que peux-tu") || msgN.contains("que peux tu") || msgN.contains("aide")
                || msgN.contains("que sais-tu") || msgN.contains("que sais tu")
                || msgN.contains("fonctionnalit") || msgN.contains("comment utiliser")
                || msgN.contains("quoi faire")) {
            return getCapacites(role, userName);
        }

        // ============ ESPACE CHAUFFEUR ============
        if (role.equals("CHAUFFEUR")) {

            if (msgN.contains("historique")
                    || msgN.contains("passee") || msgN.contains("passees")
                    || ((msgN.contains("mission") || msgN.contains("trajet"))
                    && (msgN.contains("terminee") || msgN.contains("terminees")))) {
                return getMissionsTerminees(userId);
            }

            if (msgN.contains("terminer") || msgN.contains("completer") || msgN.contains("finir")
                    || msgN.contains("fin de mission")
                    || msgN.contains("km depart") || msgN.contains("km arrivee")) {
                return handleCompleterMission(message, userId);
            }

            if (msgN.contains("declarer") || msgN.contains("panne") || msgN.contains("accident")
                    || msgN.contains("amende") || msgN.contains("signaler")
                    || msgN.contains("contravention") || msgN.contains("collision")) {
                return handleCreerDeclaration(message, userId);
            }

            if (msgN.contains("mes declarations") || msgN.contains("mes declaration")
                    || msgN.contains("etat de ma declaration") || msgN.contains("statut")
                    || msgN.contains("etat declaration")) {
                return getMesDeclarations(userId);
            }

            if (msgN.contains("feuille") || msgN.contains("carnet") || msgN.contains("route")) {
                return getFeuilleDeRoute(userId);
            }

            if (msgN.contains("chef") || msgN.contains("responsable")) {
                return getMonChef(userId);
            }

            if (msgN.contains("local") || msgN.contains("qui est mon")
                    || msgN.contains("mes infos") || msgN.contains("mon profil")) {
                return getInfoLocal(userId);
            }

            if ((msgN.contains("mission") || msgN.contains("trajet"))
                    && (msgN.contains("aujourd") || msgN.contains("jour") || msgN.contains("en cours"))) {
                return getMissionsAujourdHui(userId);
            }

            if (msgN.contains("mission") || msgN.contains("trajet") || msgN.contains("deplacement")) {
                return getMissions(userId);
            }

            if (msgN.contains("vehicule") || msgN.contains("voiture")
                    || msgN.contains("attribue") || msgN.contains("affecte")) {
                return getMonVehicule(userId);
            }
        }

        // ============ ESPACE CHEF DE PARC ============
        if (role.equals("CHEF_PARC")) {

            // ── STATISTIQUES (priorité haute — avant les autres) ──────────
            if (msgN.contains("stat") || msgN.contains("resume") || msgN.contains("bilan")
                    || msgN.contains("combien") || msgN.contains("total") || msgN.contains("tableau de bord")) {
                return getStats(localId);
            }

            // ── VÉHICULES ──────────────────────────────────────────────
            if (msgN.contains("vehicule") || msgN.contains("vehicules") || msgN.contains("voiture") || msgN.contains("camion")
                    || msgN.contains("liste des vehicules") || msgN.contains("parc vehicule")
                    || msgN.contains("montre") || (msgN.contains("liste") && !msgN.contains("chauffeur")
                    && !msgN.contains("mission") && !msgN.contains("entretien") && !msgN.contains("declaration"))) {

                // Mise à jour état véhicule
                if (msgN.contains("mettre") || msgN.contains("changer") || msgN.contains("modifier")
                        || msgN.contains("passer") || msgN.contains("update")
                        || (msgN.contains("etat") && !msgN.contains("chauffeur"))) {
                    return handleMettreAJourEtatVehicule(message, localId);
                }

                // Affecter véhicule à chauffeur
                if (msgN.contains("affecter") || msgN.contains("attribuer") || msgN.contains("assigner")) {
                    return handleAffecterVehicule(message, localId);
                }

                // Véhicules par état
                if (msgN.contains("disponible") || msgN.contains("libre"))
                    return getVehiculesDisponibles(localId);
                if (msgN.contains("en entretien") || (msgN.contains("entretien") && msgN.contains("vehicule")))
                    return getVehiculesParEtat(localId, EtatVehicule.EN_ENTRETIEN, "En entretien 🔧");
                if (msgN.contains("en mission") && msgN.contains("vehicule"))
                    return getVehiculesParEtat(localId, EtatVehicule.EN_MISSION, "En mission 🛣️");
                if (msgN.contains("indisponible"))
                    return getVehiculesParEtat(localId, EtatVehicule.INDISPONIBLE, "Indisponibles ❌");

                return getVehicules(localId);
            }

            // ── CHAUFFEURS ─────────────────────────────────────────────
            if (msgN.contains("chauffeur") || msgN.contains("conducteur")
                    || msgN.contains("liste des chauffeurs")) {

                // Modifier état chauffeur
                if (msgN.contains("mettre") || msgN.contains("changer") || msgN.contains("modifier")
                        || msgN.contains("passer") || msgN.contains("conge")
                        || msgN.contains("absent") || msgN.contains("vacance")
                        || (msgN.contains("etat") && msgN.contains("chauffeur"))) {
                    return handleMettreAJourEtatChauffeur(message, localId);
                }

                return getChauffeurs(localId);
            }

            // ── MISSIONS ───────────────────────────────────────────────
            if (msgN.contains("mission") || msgN.contains("trajet")
                    || msgN.contains("nouvelle mission") || msgN.contains("creer une mission")) {


                // Missions du jour
                if (msgN.contains("aujourd") || msgN.contains("en cours") || msgN.contains("jour"))
                    return getMissionsAujourdHuiChef(localId);

                return getMissionsChef(localId);
            }

            // ── FEUILLES DE ROUTE ──────────────────────────────────────
            if (msgN.contains("feuille") || msgN.contains("carnet") || msgN.contains("route")) {
                return getFeuillesDeRouteChef(localId);
            }

            // ── DÉCLARATIONS ───────────────────────────────────────────
            if (msgN.contains("declaration") || msgN.contains("declarations")) {

                // Traiter une déclaration
                if (msgN.contains("traiter") || msgN.contains("valider") || msgN.contains("approuver")) {
                    return handleTraiterDeclaration(message, userId, localId);
                }

                // Filtres par statut
                if (msgN.contains("attente") || msgN.contains("en attente"))
                    return getDeclarationsParStatut(localId, DeclarationStatus.EN_ATTENTE);
                if (msgN.contains("traitee") || msgN.contains("traite"))
                    return getDeclarationsParStatut(localId, DeclarationStatus.TRAITE);
                if (msgN.contains("rejetee") || msgN.contains("rejete"))
                    return getDeclarationsParStatut(localId, DeclarationStatus.REJETE);

                // Toutes les déclarations
                return getToutesDeclarations(localId);
            }

            // ── ENTRETIENS ─────────────────────────────────────────────
            if (msgN.contains("entretien") || msgN.contains("vidange") || msgN.contains("revision")) {

                return getEntretiens(localId);
            }

            // ── CARTES CARBURANT ───────────────────────────────────────
            if (msgN.contains("carte") || msgN.contains("carburant") || msgN.contains("solde")
                    || msgN.contains("recharger") || msgN.contains("recharge")) {

                if (msgN.contains("recharger") || msgN.contains("recharge") || msgN.contains("alimenter")) {
                    return handleRechargerCarte(message);
                }

                return getCarteCarburantInfo(message, localId);
            }
        }
        // ============ ESPACE ADMINISTRATEUR ============
        // ============ ESPACE ADMINISTRATEUR ============
        // ============ ESPACE ADMINISTRATEUR ============
        // ============ ESPACE ADMINISTRATEUR ============
        if (role.equals("ADMIN")) {

            // 1. 📊 BILAN GLOBAL
            if (msgN.contains("bilan") || msgN.contains("mission")
                    || msgN.contains("combien") || msgN.contains("flotte")) {
                return getEtatGlobalFlotte();
            }

            // 2. 🏢 LOCAUX / AGENCES
            if (msgN.contains("local") || msgN.contains("locaux") || msgN.contains("locax")
                    || msgN.contains("agence") || msgN.contains("image") || msgN.contains("photo")) {
                return getLocauxAvecImages();
            }

            // 3. 🔍 RECHERCHE VÉHICULE (par matricule)
            if (extraireMatricule(message) != null
                    || msgN.contains("ou est") || msgN.contains("trouve")) {
                return handleTrouverVehiculeAdmin(message);
            }

            // 4. 🏆 PERFORMANCE CHAUFFEURS
            if (msgN.contains("performance") || msgN.contains("meilleur") || msgN.contains("top")) {
                return getPerformanceChauffeurs();
            }

            // 5. 🚗 LISTE GÉNÉRALE DES VÉHICULES
            if (msgN.contains("vehicule") || msgN.contains("voiture")
                    || msgN.contains("donner") || msgN.contains("donenr")) {
                return getEtatGlobalFlotte();
            }
        }
        try {
            return repondreAvecClaude(message, role);
        } catch (Exception e) {
            return "🤖 **Assistant AGIL** : Je n'ai pas compris votre demande.\n" +
                    "💡 *Astuce :* Utilisez des mots comme **bilan**, **locaux**, ou **performance**.";
        }    }
    private String getEtatGlobalFlotte() {
        List<Vehicule> tous = vehiculeRepository.findAll();

        long mission = tous.stream()
                .filter(v -> v.getEtat() == EtatVehicule.EN_MISSION).count();

        long dispo = tous.stream()
                .filter(v -> v.getEtat() == EtatVehicule.DISPONIBLE).count();

        long maintenance = tous.stream()
                .filter(v -> v.getEtat() == EtatVehicule.EN_ENTRETIEN).count();

        return "🌐 **BILAN GLOBAL AGIL**\n" +
                "🚗 Total Véhicules : " + tous.size() + "\n" +
                "🛣️ En Mission     : " + mission + "\n" +
                "✅ Disponibles    : " + dispo + "\n" +
                "🛠️ Maintenance   : " + maintenance;
    }
    // --- RECHERCHE PAR MATRICULE ---
    private String handleTrouverVehiculeAdmin(String message) {

        String matricule = extraireMatricule(message);

        if (matricule == null) {
            return "⚠️ Veuillez préciser le matricule.\nEx: Où est le véhicule 123 TUN 456 ?";
        }

        Optional<Vehicule> vOpt = vehiculeRepository.findAll().stream()
                .filter(v -> v.getMatricule() != null &&
                        v.getMatricule().toLowerCase().contains(matricule.toLowerCase()))
                .findFirst();

        if (vOpt.isEmpty()) {
            return "❌ Aucun véhicule trouvé.";
        }

        Vehicule v = vOpt.get();

        StringBuilder sb = new StringBuilder("🔎 **VÉHICULE TROUVÉ**\n");
        sb.append("🚗 Matricule : ").append(v.getMatricule()).append("\n");
        sb.append("📊 État : ").append(v.getEtat()).append("\n");

        if (v.getLocal() != null) {
            sb.append("📍 Local : ").append(v.getLocal().getNomLocal()).append("\n");
            sb.append("🏙️ Ville : ").append(v.getLocal().getVille()).append("\n");
        }

        if (v.getImage() != null) {
            sb.append("🖼️ [IMG_VEHICULE:").append(v.getIdVehicule()).append("]");
        }

        return sb.toString();
    }
    // --- BILAN GLOBAL ---
    // --- TOP CHAUFFEURS ---
    private String getPerformanceChauffeurs() {

        List<Chauffeur> chauffeurs = chauffeurRepository.findAll();
        List<Mission> missions = missionRepository.findAll();

        StringBuilder sb = new StringBuilder("🏆 **TOP CHAUFFEURS**\n");

        chauffeurs.stream()
                .map(c -> {
                    long count = missions.stream()
                            .filter(m -> m.getChauffeur() != null &&
                                    m.getChauffeur().getIdChauffeur().equals(c.getIdChauffeur()))
                            .count();
                    return new AbstractMap.SimpleEntry<>(c.getNom() + " " + c.getPrenom(), count);
                })
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .forEach(e -> sb.append("👤 ")
                        .append(e.getKey())
                        .append(" : ")
                        .append(e.getValue())
                        .append(" missions\n"));

        return sb.toString();
    } private String getLocauxAvecImages() {
        List<Local> locaux = localRepository.findAll();

        StringBuilder sb = new StringBuilder("🏢 **INFRASTRUCTURE LOCALE**\n");

        for (Local l : locaux) {
            sb.append("\n📍 ").append(l.getNomLocal())
                    .append(" (").append(l.getVille()).append(")");

            if (l.getImages() != null) {
                sb.append("\n🖼️ [IMG_LOCAL:").append(l.getIdLocal()).append("]");
            }
            sb.append("\n----------------------");
        }
        return sb.toString();
    }// ================== MÉTHODES IMAGES (CHEF & CHAUFFEUR) ==================

    private String getVehiculesAvecImages(Long localId) {
        List<Vehicule> list = vehiculeRepository.findByLocal_IdLocal(localId);
        StringBuilder sb = new StringBuilder("🚗 **VÉHICULES DU LOCAL**\n" + SEP_HEAVY);
        for (Vehicule v : list) {
            sb.append("\n🚘 **").append(v.getMatricule()).append("** - ").append(v.getEtat());
            if (v.getImage() != null) sb.append("\n🖼️ [IMG_VEHICULE:").append(v.getIdVehicule()).append("]");
            sb.append(SEP_LIGHT);
        }
        return sb.toString();
    }

    private String getMonVehiculeAvecImage(Long userId) {
        Chauffeur c = chauffeurRepository.findById(userId).orElse(null);
        if (c == null || c.getVehicule() == null) return "❌ Aucun véhicule assigné.";
        Vehicule v = c.getVehicule();
        return "🚗 **VOTRE VÉHICULE**\n" + SEP_HEAVY +
                "Matricule : " + v.getMatricule() + "\n" +
                "Modèle : " + v.getMarque() + " " + v.getModele() + "\n" +
                (v.getImage() != null ? "🖼️ [IMG_VEHICULE:" + v.getIdVehicule() + "]" : "");
    }

    // ================== MÉTHODES TECHNIQUES (MÊME LOGIQUE) ==================




    private String handleMettreAJourEtatVehicule(String message, Long localId) {
        String msgN = normaliser(message);

        // Détecter le nouvel état
        EtatVehicule nouvelEtat = null;
        if (msgN.contains("disponible"))         nouvelEtat = EtatVehicule.DISPONIBLE;
        else if (msgN.contains("en mission"))    nouvelEtat = EtatVehicule.EN_MISSION;
        else if (msgN.contains("entretien"))     nouvelEtat = EtatVehicule.EN_ENTRETIEN;
        else if (msgN.contains("indisponible"))  nouvelEtat = EtatVehicule.INDISPONIBLE;

        // Détecter la matricule ou l'ID du véhicule
        Long idVehicule = extraireIdEntite(message, "vehicule|voiture|id");
        String matricule = extraireMatricule(message);

        if (nouvelEtat == null) {
            return "⚠️ Veuillez préciser le nouvel état :\n\n"
                    + "📝 Format :\n```\nVéhicule [matricule] état [disponible / en mission / entretien / indisponible]\n```\n\n"
                    + "📌 Exemple :\n```\nVéhicule TN-1122-AG état disponible\n```";
        }

        // Chercher le véhicule
        Vehicule vehicule = null;
        if (idVehicule != null) {
            vehicule = vehiculeRepository.findById(idVehicule).orElse(null);
        }
        if (vehicule == null && matricule != null) {
            vehicule = vehiculeRepository.findByLocal_IdLocal(localId).stream()
                    .filter(v -> v.getMatricule() != null
                            && normaliser(v.getMatricule()).contains(normaliser(matricule)))
                    .findFirst().orElse(null);
        }

        if (vehicule == null) {
            List<Vehicule> liste = vehiculeRepository.findByLocal_IdLocal(localId);
            if (liste.isEmpty()) return "📋 Aucun véhicule dans votre local.";

            StringBuilder sb = new StringBuilder("📝 Précisez le véhicule (matricule ou ID) :\n\n");
            sb.append("Format : ```Véhicule [matricule] état ").append(nouvelEtat.name().toLowerCase()).append("```\n\n");
            sb.append(SEP_HEAVY);
            for (Vehicule v : liste) {
                sb.append("🚗  ").append(v.getMatricule())
                        .append("   (ID: ").append(v.getIdVehicule()).append(")")
                        .append("   — ").append(v.getEtat()).append("\n");
            }
            return sb.toString();
        }

        EtatVehicule ancienEtat = vehicule.getEtat();
        gestionParcService.updateEtatVehicule(vehicule.getIdVehicule(), nouvelEtat);

        return "✅ État du véhicule mis à jour !\n\n"
                + SEP_HEAVY
                + "🚗  Matricule  : " + vehicule.getMatricule() + "\n"
                + "🏷️  Modèle     : " + vehicule.getMarque() + " " + vehicule.getModele() + "\n"
                + "📊  Ancien état : " + ancienEtat + "\n"
                + "✅  Nouvel état : " + nouvelEtat + "\n";
    }

    private String handleAffecterVehicule(String message, Long localId) {
        String msgN = normaliser(message);

        String matricule     = extraireMatricule(message);
        Long idVehicule      = extraireIdEntite(message, "vehicule|voiture");
        Long idChauffeur     = extraireIdEntite(message, "chauffeur|conducteur");
        String nomChauffeur  = extraireNomPersonne(message, "chauffeur");

        // Résoudre le véhicule
        Vehicule vehicule = null;
        if (idVehicule != null) {
            vehicule = vehiculeRepository.findById(idVehicule).orElse(null);
        }
        if (vehicule == null && matricule != null) {
            vehicule = vehiculeRepository.findByLocal_IdLocal(localId).stream()
                    .filter(v -> v.getMatricule() != null
                            && normaliser(v.getMatricule()).contains(normaliser(matricule)))
                    .findFirst().orElse(null);
        }

        // Résoudre le chauffeur
        Chauffeur chauffeur = null;
        if (idChauffeur != null) {
            chauffeur = chauffeurRepository.findById(idChauffeur).orElse(null);
        }
        if (chauffeur == null && nomChauffeur != null) {
            chauffeur = chauffeurRepository.findByLocal_IdLocal(localId).stream()
                    .filter(c -> (c.getNom() + " " + c.getPrenom()).toLowerCase().contains(nomChauffeur.toLowerCase())
                            || (c.getPrenom() + " " + c.getNom()).toLowerCase().contains(nomChauffeur.toLowerCase()))
                    .findFirst().orElse(null);
        }

        if (vehicule == null || chauffeur == null) {
            List<Vehicule>  vDispos = vehiculeRepository.findByLocal_IdLocal(localId).stream()
                    .filter(v -> v.getEtat() == EtatVehicule.DISPONIBLE).collect(Collectors.toList());
            List<Chauffeur> cDispos = chauffeurRepository.findByLocal_IdLocal(localId).stream()
                    .filter(c -> c.getEtatChauffeur() == Chauffeur.EtatChauffeur.DISPONIBLE).collect(Collectors.toList());

            StringBuilder sb = new StringBuilder("📝 Format pour affecter un véhicule :\n");
            sb.append("```\naffecter véhicule [matricule] chauffeur [nom ou ID]\n```\n\n");

            if (vehicule == null) {
                sb.append("🚗 Véhicules disponibles :\n").append(SEP_HEAVY);
                if (vDispos.isEmpty()) sb.append("Aucun véhicule disponible.\n");
                else vDispos.forEach(v -> sb.append("  ✅  ").append(v.getMatricule())
                        .append("  (").append(v.getMarque()).append(" ").append(v.getModele())
                        .append(", ID:").append(v.getIdVehicule()).append(")\n"));
            }

            if (chauffeur == null) {
                sb.append("\n👨‍✈️ Chauffeurs disponibles :\n").append(SEP_HEAVY);
                if (cDispos.isEmpty()) sb.append("Aucun chauffeur disponible.\n");
                else cDispos.forEach(c -> sb.append("  ✅  ").append(c.getNom()).append(" ").append(c.getPrenom())
                        .append("  (ID:").append(c.getIdChauffeur()).append(")\n"));
            }
            return sb.toString();
        }

        // Vérifier disponibilité du chauffeur
        if (chauffeur.getEtatChauffeur() != Chauffeur.EtatChauffeur.DISPONIBLE) {
            return "⚠️ Le chauffeur **" + chauffeur.getNom() + " " + chauffeur.getPrenom()
                    + "** n'est pas disponible (état : " + chauffeur.getEtatChauffeur() + ").\n"
                    + "Choisissez un chauffeur disponible.";
        }

        // Vérifier disponibilité du véhicule
        if (vehicule.getEtat() != EtatVehicule.DISPONIBLE) {
            return "⚠️ Le véhicule **" + vehicule.getMatricule()
                    + "** n'est pas disponible (état : " + vehicule.getEtat() + ").\n"
                    + "Choisissez un véhicule disponible.";
        }

        try {
            gestionParcService.affecterVehiculeAChauffeur(chauffeur.getIdChauffeur(), vehicule.getIdVehicule());
            return "✅ Affectation réussie !\n\n"
                    + SEP_HEAVY
                    + "🚗  Véhicule  : " + vehicule.getMatricule()
                    + " (" + vehicule.getMarque() + " " + vehicule.getModele() + ")\n"
                    + "👨‍✈️  Chauffeur : " + chauffeur.getNom() + " " + chauffeur.getPrenom() + "\n"
                    + "📊  État véhicule → EN_MISSION\n";
        } catch (Exception e) {
            return "❌ Erreur lors de l'affectation : " + e.getMessage();
        }
    }

    public String getVehiculesParEtat(Long localId, EtatVehicule etat, String label) {
        List<Vehicule> list = vehiculeRepository.findByLocal_IdLocal(localId).stream()
                .filter(v -> v.getEtat() == etat).collect(Collectors.toList());

        if (list.isEmpty()) return "📋 Aucun véhicule « " + label + " » dans votre local.";

        StringBuilder res = new StringBuilder("🚗 Véhicules " + label + " (" + list.size() + ") :\n");
        res.append(SEP_HEAVY);
        for (int i = 0; i < list.size(); i++) {
            Vehicule v = list.get(i);
            res.append("\n🚗  ").append(v.getMatricule()).append("\n");
            res.append("   🏷️  ").append(v.getMarque()).append(" ").append(v.getModele()).append("\n");
            res.append("   📅  Année     : ").append(v.getAnnee()).append("\n");
            res.append("   ⛽  Carburant : ").append(v.getCarburant()).append("\n");
            if (i < list.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    // =====================================================================
    //                    CHEF DE PARC — CHAUFFEURS
    // =====================================================================

    private String handleMettreAJourEtatChauffeur(String message, Long localId) {
        String msgN = normaliser(message);

        // Détecter le nouvel état
        Chauffeur.EtatChauffeur nouvelEtat = null;
        if (msgN.contains("disponible"))                                      nouvelEtat = Chauffeur.EtatChauffeur.DISPONIBLE;
        else if (msgN.contains("en mission") || msgN.contains("mission"))     nouvelEtat = Chauffeur.EtatChauffeur.EN_MISSION;
        else if (msgN.contains("conge") || msgN.contains("repos")
                || msgN.contains("absent") || msgN.contains("vacance"))       nouvelEtat = Chauffeur.EtatChauffeur.EN_CONGE;

        Long idChauffeur    = extraireIdEntite(message, "chauffeur|conducteur|id");
        String nomChauffeur = extraireNomPersonne(message, "chauffeur");

        if (nouvelEtat == null) {
            return "⚠️ Précisez le nouvel état du chauffeur :\n\n"
                    + "📝 Format :\n```\nChauffeur [nom ou ID] état [disponible / en mission / congé]\n```\n\n"
                    + "📌 Exemple :\n```\nChauffeur Ahmed Ben Ali état congé\n```";
        }

        // Résoudre le chauffeur
        Chauffeur chauffeur = null;
        if (idChauffeur != null)
            chauffeur = chauffeurRepository.findById(idChauffeur).orElse(null);
        if (chauffeur == null && nomChauffeur != null)
            chauffeur = chauffeurRepository.findByLocal_IdLocal(localId).stream()
                    .filter(c -> (c.getNom() + " " + c.getPrenom()).toLowerCase().contains(nomChauffeur.toLowerCase())
                            || (c.getPrenom() + " " + c.getNom()).toLowerCase().contains(nomChauffeur.toLowerCase()))
                    .findFirst().orElse(null);

        if (chauffeur == null) {
            List<Chauffeur> liste = chauffeurRepository.findByLocal_IdLocal(localId);
            StringBuilder sb = new StringBuilder("👨‍✈️ Précisez le chauffeur (nom ou ID) :\n\n");
            sb.append("Format : ```Chauffeur [nom] état ")
                    .append(nouvelEtat.name().toLowerCase().replace("_", " ")).append("```\n\n").append(SEP_HEAVY);
            liste.forEach(c -> sb.append("👤  ").append(c.getNom()).append(" ").append(c.getPrenom())
                    .append("   (ID:").append(c.getIdChauffeur()).append(")  — ").append(c.getEtatChauffeur()).append("\n"));
            return sb.toString();
        }

        Chauffeur.EtatChauffeur ancienEtat = chauffeur.getEtatChauffeur();
        gestionParcService.updateEtatChauffeur(chauffeur.getIdChauffeur(), nouvelEtat);

        return "✅ État du chauffeur mis à jour !\n\n"
                + SEP_HEAVY
                + "👤  Chauffeur   : " + chauffeur.getNom() + " " + chauffeur.getPrenom() + "\n"
                + "📊  Ancien état  : " + ancienEtat + "\n"
                + "✅  Nouvel état  : " + nouvelEtat + "\n"
                + (nouvelEtat == Chauffeur.EtatChauffeur.EN_CONGE
                ? "⚠️  Véhicule libéré automatiquement.\n" : "");
    }



    // =====================================================================
    //                    CHEF DE PARC — FEUILLES DE ROUTE
    // =====================================================================

    private String getFeuillesDeRouteChef(Long localId) {
        List<FeuilleDeRoute> feuilles = feuilleDeRouteRepository.findByLocalId(localId);

        if (feuilles.isEmpty())
            return "📋 Aucune feuille de route trouvée pour votre local.";

        long ouvertes  = feuilles.stream().filter(f -> f.getStatut() == StatutFeuilleDeRoute.OUVERTE).count();
        long enCours   = feuilles.stream().filter(f -> f.getStatut() == StatutFeuilleDeRoute.EN_COURS).count();
        long terminees = feuilles.stream().filter(f -> f.getStatut() == StatutFeuilleDeRoute.CLOTUREE).count();

        StringBuilder res = new StringBuilder("📋 Feuilles de route (" + feuilles.size() + ") :\n");
        res.append("📂 Ouvertes : ").append(ouvertes)
                .append("   |   🔄 En cours : ").append(enCours)
                .append("   |   ✅ Terminées : ").append(terminees).append("\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < feuilles.size(); i++) {
            FeuilleDeRoute f = feuilles.get(i);
            String emoji = switch (f.getStatut()) {
                case OUVERTE   -> "📂";
                case EN_COURS  -> "🔄";
                case CLOTUREE  -> "✅";
                default        -> "•";
            };
            res.append("\n").append(emoji).append("  Feuille #").append(f.getIdFeuille()).append("\n");
            res.append("   📅  Date       : ").append(f.getDateGeneration()).append("\n");
            if (f.getChauffeur() != null)
                res.append("   👨‍✈️  Chauffeur : ").append(f.getChauffeur().getNom())
                        .append(" ").append(f.getChauffeur().getPrenom()).append("\n");
            if (f.getVehicule() != null)
                res.append("   🚗  Véhicule  : ").append(f.getVehicule().getMatricule()).append("\n");

            int nbMissions = f.getMissions() == null ? 0 : f.getMissions().size();
            res.append("   📌  Missions  : ").append(nbMissions).append("\n");
            res.append("   🔄  Statut    : ").append(f.getStatut()).append("\n");
            if (i < feuilles.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    // =====================================================================
    //                    CHEF DE PARC — DÉCLARATIONS
    // =====================================================================

    private String getToutesDeclarations(Long localId) {
        List<Declaration> list = gestionParcService.getAllDeclarationsByLocal(localId);

        if (list.isEmpty()) return "📋 Aucune déclaration pour votre local.";

        long enAttente = list.stream().filter(d -> d.getStatus() == DeclarationStatus.EN_ATTENTE).count();
        long traitees  = list.stream().filter(d -> d.getStatus() == DeclarationStatus.TRAITE).count();
        long rejetees  = list.stream().filter(d -> d.getStatus() == DeclarationStatus.REJETE).count();

        StringBuilder res = new StringBuilder("📋 Toutes les déclarations (" + list.size() + ") :\n");
        res.append("⏳ En attente : ").append(enAttente)
                .append("   |   ✅ Traitées : ").append(traitees)
                .append("   |   ❌ Rejetées : ").append(rejetees).append("\n");
        res.append(SEP_HEAVY);
        res.append(formatDeclarations(list));
        return res.toString();
    }

    private String getDeclarationsParStatut(Long localId, DeclarationStatus statut) {
        List<Declaration> list = gestionParcService.getAllDeclarationsByLocal(localId).stream()
                .filter(d -> d.getStatus() == statut).collect(Collectors.toList());

        String label = switch (statut) {
            case EN_ATTENTE -> "⏳ En attente";
            case TRAITE     -> "✅ Traitées";
            case REJETE     -> "❌ Rejetées";
            default         -> statut.name();
        };

        if (list.isEmpty()) return "📋 Aucune déclaration " + label.toLowerCase() + " pour votre local.";

        StringBuilder res = new StringBuilder("📋 Déclarations " + label + " (" + list.size() + ") :\n");
        res.append(SEP_HEAVY);
        res.append(formatDeclarations(list));
        return res.toString();
    }

    private String formatDeclarations(List<Declaration> list) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < list.size(); i++) {
            Declaration d = list.get(i);
            String emoji = switch (d.getStatus()) {
                case EN_ATTENTE -> "⏳";
                case TRAITE     -> "✅";
                case REJETE     -> "❌";
                default         -> "•";
            };
            sb.append("\n").append(emoji).append("  ID #").append(d.getIdDeclaration())
                    .append("  — ").append(d.getType()).append("\n");
            sb.append("   📝  ").append(d.getDescription()).append("\n");
            if (d.getChauffeur() != null)
                sb.append("   👨‍✈️  Chauffeur : ").append(d.getChauffeur().getNom())
                        .append(" ").append(d.getChauffeur().getPrenom()).append("\n");
            if (d.getVehicule() != null)
                sb.append("   🚗  Véhicule  : ").append(d.getVehicule().getMatricule()).append("\n");
            if (d.getDateCreation() != null)
                sb.append("   📅  Date      : ").append(d.getDateCreation().toLocalDate()).append("\n");
            sb.append("   🔄  Statut    : ").append(d.getStatus()).append("\n");
            if (i < list.size() - 1) sb.append(SEP_LIGHT);
        }
        return sb.toString();
    }

    private String handleTraiterDeclaration(String message, Long userId, Long localId) {
        Long idDeclaration = extraireIdEntite(message, "declaration|dec|id");

        if (idDeclaration == null) {
            List<Declaration> enAttente = gestionParcService.getDeclarationsEnAttenteParLocal(localId);
            if (enAttente.isEmpty())
                return "✅ Aucune déclaration en attente à traiter dans votre local.";

            StringBuilder sb = new StringBuilder("📋 Déclarations en attente à traiter :\n\n");
            sb.append("📝 Format pour traiter :\n");
            sb.append("```\nTraiter déclaration [ID]\n");
            sb.append("Garage ID : [idGarage]  (optionnel pour amendes)\n");
            sb.append("Type entretien : [description]\n");
            sb.append("Date prévue : [AAAA-MM-JJ]\n");
            sb.append("Observations : [texte]\n```\n\n");
            sb.append(SEP_HEAVY);
            enAttente.forEach(d -> {
                sb.append("\n⏳  ID #").append(d.getIdDeclaration())
                        .append("  — ").append(d.getType()).append("\n");
                sb.append("   📝  ").append(d.getDescription()).append("\n");
                if (d.getChauffeur() != null)
                    sb.append("   👨‍✈️  ").append(d.getChauffeur().getNom())
                            .append(" ").append(d.getChauffeur().getPrenom()).append("\n");
                sb.append(SEP_LIGHT);
            });

            List<GarageMaintenance> garages = gestionParcService.getAllGarages();
            if (!garages.isEmpty()) {
                sb.append("\n🏭 Garages disponibles :\n").append(SEP_HEAVY);
                garages.forEach(g -> sb.append("  🔧  ID ").append(g.getIdGarage())
                        .append("  — ").append(g.getNomGarage()).append("\n"));
            }
            return sb.toString();
        }

        Long   idGarage      = extraireIdEntite(message, "garage");
        String typeEntretien = extraireChampLibre(message, "type entretien|type");
        String datePrevue    = extraireDate(message);
        String observations  = extraireObservations(message);

        try {
            gestionParcService.traiterDeclarationEtCreerEntretien(
                    idDeclaration,
                    userId,
                    idGarage,
                    datePrevue != null ? LocalDate.parse(datePrevue) : LocalDate.now(),
                    typeEntretien,
                    observations != null ? observations : "Traité via chatbot"
            );

            return "✅ Déclaration #" + idDeclaration + " traitée avec succès !\n\n"
                    + SEP_HEAVY
                    + "🔧  Un entretien a été créé automatiquement.\n"
                    + "📅  Date prévue : " + (datePrevue != null ? datePrevue : LocalDate.now()) + "\n"
                    + (idGarage != null ? "🏭  Garage ID : " + idGarage + "\n" : "")
                    + "📝  Type : " + (typeEntretien != null ? typeEntretien : "Non précisé") + "\n";
        } catch (Exception e) {
            return "❌ Erreur lors du traitement : " + e.getMessage();
        }
    }

    // =====================================================================
    //                    CHEF DE PARC — ENTRETIENS
    // =====================================================================

    private String getEntretiens(Long localId) {
        List<Entretien> list = gestionParcService.getEntretiensByLocal(localId);

        if (list.isEmpty()) return "📋 Aucun entretien enregistré pour votre local.";

        long periodiques = list.stream()
                .filter(e -> e.getCategorie() == Entretien.Categorie.ENTRETIEN_PERIODIQUE).count();
        long suiteDecl   = list.stream()
                .filter(e -> e.getCategorie() == Entretien.Categorie.ENTRETIEN_SUITE_DECLARATION).count();
        long enAttente   = list.stream()
                .filter(e -> e.getStatus() == Entretien.Status.EN_ATTENTE).count();
        long traites     = list.stream()
                .filter(e -> e.getStatus() == Entretien.Status.TRAITE).count();

        StringBuilder res = new StringBuilder("🔧 Entretiens (" + list.size() + ") :\n");
        res.append("📅 Périodiques : ").append(periodiques)
                .append("   |   🚨 Suite décl. : ").append(suiteDecl).append("\n");
        res.append("⏳ En attente : ").append(enAttente)
                .append("   |   ✅ Traités : ").append(traites).append("\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < list.size(); i++) {
            Entretien e = list.get(i);
            String catEmoji  = e.getCategorie() == Entretien.Categorie.ENTRETIEN_PERIODIQUE ? "📅" : "🚨";
            String statEmoji = e.getStatus() == Entretien.Status.TRAITE ? "✅"
                    : e.getStatus() == Entretien.Status.REJETE ? "❌" : "⏳";

            res.append("\n").append(catEmoji).append(statEmoji)
                    .append("  Entretien #").append(e.getIdEntretien()).append("\n");
            res.append("   🔧  Type      : ").append(e.getTypeEntretien()).append("\n");
            if (e.getVehicule() != null)
                res.append("   🚗  Véhicule  : ").append(e.getVehicule().getMatricule()).append("\n");
            if (e.getGarage() != null)
                res.append("   🏭  Garage    : ").append(e.getGarage().getNomGarage()).append("\n");
            res.append("   📅  Date prévue : ").append(e.getDatePrevue()).append("\n");
            if (e.getDateEffectuee() != null)
                res.append("   ✔️  Effectué le : ").append(e.getDateEffectuee()).append("\n");
            res.append("   📝  Obs.       : ").append(e.getObservations()).append("\n");
            if (i < list.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }


    // =====================================================================
    //                    CHEF DE PARC — CARTES CARBURANT
    // =====================================================================

    private String getCarteCarburantInfo(String message, Long localId) {
        String numeroCarte = extraireNumeroCarte(message);

        if (numeroCarte != null) {
            try {
                CarteCarburant carte = gestionParcService.getCarteByNumero(numeroCarte);
                return formatCarte(carte);
            } catch (Exception e) {
                return "⚠️ Carte introuvable avec le numéro : **" + numeroCarte + "**\n"
                        + "Vérifiez le numéro et réessayez.";
            }
        }

        List<CarteCarburant> cartes = carteCarburantRepository.findAll().stream()
                .filter(c -> c.getVehicule() != null
                        && c.getVehicule().getLocal() != null
                        && c.getVehicule().getLocal().getIdLocal().equals(localId))
                .collect(Collectors.toList());

        if (cartes.isEmpty())
            return "📋 Aucune carte carburant trouvée pour votre local.\n\n"
                    + "Pour consulter une carte spécifique :\n"
                    + "```\nSolde carte [numéro de carte]\n```";

        StringBuilder res = new StringBuilder("💳 Cartes carburant (" + cartes.size() + ") :\n");
        res.append(SEP_HEAVY);
        for (int i = 0; i < cartes.size(); i++) {
            CarteCarburant c = cartes.get(i);
            res.append("\n💳  ").append(c.getNumeroCarte()).append("\n");
            res.append("   🚗  Véhicule : ").append(c.getVehicule().getMatricule()).append("\n");
            res.append("   💰  Solde    : ").append(c.getMontantReel()).append(" TND\n");
            if (c.getDateChargement() != null)
                res.append("   📅  Dernier chargement : ").append(c.getDateChargement()).append("\n");
            if (i < cartes.size() - 1) res.append(SEP_LIGHT);
        }
        res.append("\n\n💡 Pour recharger : ```recharger carte [numéro] montant [valeur]```");
        return res.toString();
    }

    private String handleRechargerCarte(String message) {
        String numeroCarte = extraireNumeroCarte(message);
        Double montant = extraireNombre(message, "montant|recharge|recharger|alimenter");

        if (numeroCarte == null || montant == null) {
            return "📝 Format pour recharger une carte :\n\n"
                    + "```\nRecharger carte [numéro de carte] montant [valeur en TND]\n```\n\n"
                    + "📌 Exemple :\n"
                    + "```\nRecharger carte CC-2024-001 montant 500\n```";
        }

        try {
            CarteCarburant carte = gestionParcService.rechargerCarte(numeroCarte, montant);
            return "✅ Carte rechargée avec succès !\n\n"
                    + SEP_HEAVY
                    + "💳  Numéro         : " + carte.getNumeroCarte() + "\n"
                    + "💰  Montant chargé : " + montant + " TND\n"
                    + "💰  Nouveau solde  : " + carte.getMontantReel() + " TND\n"
                    + "📅  Date           : " + LocalDate.now() + "\n";
        } catch (Exception e) {
            return "❌ Erreur lors de la recharge : " + e.getMessage();
        }
    }

    private String formatCarte(CarteCarburant carte) {
        StringBuilder res = new StringBuilder("💳 Carte carburant :\n\n");
        res.append(SEP_HEAVY);
        res.append("💳  Numéro     : ").append(carte.getNumeroCarte()).append("\n");
        if (carte.getVehicule() != null)
            res.append("🚗  Véhicule  : ").append(carte.getVehicule().getMatricule()).append("\n");
        res.append("💰  Solde actuel       : ").append(carte.getMontantReel()).append(" TND\n");
        res.append("💸  Dernier chargement : ").append(carte.getMontantCharge()).append(" TND\n");
        if (carte.getDateChargement() != null)
            res.append("📅  Date chargement    : ").append(carte.getDateChargement()).append("\n");
        res.append("\n💡 Pour recharger : ```recharger carte ").append(carte.getNumeroCarte()).append(" montant [valeur]```");
        return res.toString();
    }

    // =====================================================================
    //                    CHAUFFEUR — MÉTHODES
    // =====================================================================

    private String handleCompleterMission(String message, Long userId) {
        List<Mission> missions = missionRepository.findByChauffeur_IdChauffeur(userId);
        List<Mission> nonCompletes = missions.stream()
                .filter(m -> m.getKmArrivee() == null || m.getHeureArriveeReelle() == null)
                .collect(Collectors.toList());

        if (nonCompletes.isEmpty())
            return "✅ Toutes vos missions sont déjà complétées !\nAucune information manquante.";

        String msgN = normaliser(message);

        Double kmDepart       = extraireNombre(message, "km.?dep|km.?start|depart");
        Double kmArrivee      = extraireNombre(message, "km.?arr|km.?fin|arrivee|arrivée");
        String heureArr       = extraireHeure(message);
        String heureDepReelle = extraireHeureDep(message);
        String observations   = extraireObservations(message);

        Mission missionCible = null;

        // Chercher par ID
        java.util.regex.Matcher mId = java.util.regex.Pattern
                .compile("(?:mission)?\\s*(?:id|#)\\s*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(message);
        if (mId.find()) {
            Long targetId = Long.parseLong(mId.group(1));
            missionCible = nonCompletes.stream()
                    .filter(m -> m.getIdMission().equals(targetId))
                    .findFirst().orElse(null);
            if (missionCible == null)
                return "⚠️ Aucune mission non terminée avec l'ID " + targetId + ".\n\n"
                        + listerMissionsNonCompletes(nonCompletes);
        }

        // Chercher par numéro d'ordre
        if (missionCible == null) {
            java.util.regex.Matcher mNum = java.util.regex.Pattern
                    .compile("(?:mission|num[eé]ro|n°)\\s*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(message);
            if (mNum.find()) {
                int idx = Integer.parseInt(mNum.group(1)) - 1;
                if (idx >= 0 && idx < nonCompletes.size()) {
                    missionCible = nonCompletes.get(idx);
                } else {
                    return "⚠️ Numéro de mission invalide.\nVous avez " + nonCompletes.size()
                            + " mission(s) non terminée(s).\n\n" + listerMissionsNonCompletes(nonCompletes);
                }
            }
        }

        // Chercher par destination ou départ
        if (missionCible == null) {
            missionCible = nonCompletes.stream()
                    .filter(m ->
                            (m.getDestination() != null && msgN.contains(normaliser(m.getDestination()))) ||
                                    (m.getPointDepart() != null && msgN.contains(normaliser(m.getPointDepart()))))
                    .findFirst().orElse(null);
        }

        // Si une seule mission non complète
        if (missionCible == null && nonCompletes.size() == 1) {
            missionCible = nonCompletes.get(0);
        }

        if (missionCible == null && kmArrivee != null) {
            return "📌 Vous avez " + nonCompletes.size() + " missions non terminées.\n"
                    + "Précisez laquelle en ajoutant le numéro :\n\n"
                    + listerMissionsNonCompletes(nonCompletes)
                    + "\n📝 Exemple :\n```\nmission 2 km depart 12500 km arrivee 12750 heure arrivee 14:30\n```\n\n"
                    + "Ou par destination :\n```\nmission Sfax km arrivee 12750 heure arrivee 14:30\n```";
        }

        if (missionCible != null && kmArrivee != null && heureArr != null) {
            if (kmDepart != null) missionCible.setKmDepart(kmDepart);
            missionCible.setKmArrivee(kmArrivee);
            String heureFormatted = heureArr.length() == 4 ? "0" + heureArr : heureArr;
            missionCible.setHeureArriveeReelle(LocalTime.parse(heureFormatted));
            if (heureDepReelle != null)
                missionCible.setHeureDepartReelle(LocalTime.parse(
                        heureDepReelle.length() == 4 ? "0" + heureDepReelle : heureDepReelle));
            if (observations != null) missionCible.setObservations(observations);
            missionRepository.save(missionCible);

            StringBuilder res = new StringBuilder("✅ Mission complétée avec succès !\n\n");
            res.append(SEP_HEAVY);
            res.append("🛣️  Trajet       : ").append(missionCible.getPointDepart())
                    .append(" → ").append(missionCible.getDestination()).append("\n");
            if (kmDepart != null)
                res.append("📍  KM Départ    : ").append(kmDepart).append("\n");
            res.append("📍  KM Arrivée   : ").append(kmArrivee).append("\n");
            res.append("⏰  Heure arrivée : ").append(heureArr).append("\n");
            if (observations != null)
                res.append("📝  Observations : ").append(observations).append("\n");
            return res.toString();
        }

        StringBuilder rep = new StringBuilder();
        if (nonCompletes.size() == 1) {
            Mission m = nonCompletes.get(0);
            rep.append("📋 Mission à compléter :\n");
            rep.append(SEP_HEAVY);
            rep.append("🛣️  ").append(m.getPointDepart()).append(" → ").append(m.getDestination()).append("\n");
            if (m.getDateMission() != null)
                rep.append("📅  Date    : ").append(m.getDateMission()).append("\n");
            rep.append("⏰  Départ  : ").append(m.getHeureDepartPrevue()).append("\n\n");
        } else {
            rep.append(listerMissionsNonCompletes(nonCompletes)).append("\n");
        }
        rep.append("📝 Format à utiliser :\n```\n");
        if (nonCompletes.size() > 1) rep.append("mission <numéro> ");
        rep.append("km depart 12500 km arrivee 12750 heure arrivee 14:30\n```\n");
        if (nonCompletes.size() > 1)
            rep.append("\nOu par destination :\n```\nmission Sfax km arrivee 12750 heure arrivee 14:30\n```");
        return rep.toString();
    }

    private String listerMissionsNonCompletes(List<Mission> nonCompletes) {
        StringBuilder sb = new StringBuilder("📋 Missions non terminées :\n");
        sb.append(SEP_HEAVY);
        for (int i = 0; i < nonCompletes.size(); i++) {
            Mission m = nonCompletes.get(i);
            sb.append("\n").append(i + 1).append(". 🛣️  ")
                    .append(m.getPointDepart()).append(" → ").append(m.getDestination()).append("\n");
            if (m.getDateMission() != null)
                sb.append("   📅  Date : ").append(m.getDateMission()).append("\n");
            sb.append("   🔑  ID   : ").append(m.getIdMission()).append("\n");
            if (i < nonCompletes.size() - 1) sb.append(SEP_LIGHT);
        }
        return sb.toString();
    }

    private String handleCreerDeclaration(String message, Long userId) {
        String msgN = normaliser(message);

        DeclarationType type = null;
        if (msgN.contains("panne") || msgN.contains("avarie") || msgN.contains("bris")
                || msgN.contains("probleme moteur") || msgN.contains("probleme"))
            type = DeclarationType.PANNE;
        else if (msgN.contains("accident") || msgN.contains("collision") || msgN.contains("choc"))
            type = DeclarationType.ACCIDENT;
        else if (msgN.contains("amende") || msgN.contains("contravention") || msgN.contains("infraction"))
            type = DeclarationType.AMENDE;

        String description = extraireDescription(message);

        if (type != null && description != null && description.length() > 5) {
            try {
                gestionParcService.creerDeclaration(userId, type, description);
                StringBuilder res = new StringBuilder("✅ Déclaration créée avec succès !\n\n");
                res.append(SEP_HEAVY);
                res.append("📌  Type        : ").append(type.name()).append("\n");
                res.append("📝  Description : ").append(description).append("\n");
                res.append("📅  Date        : ").append(LocalDate.now()).append("\n");
                res.append("⏳  Statut      : EN ATTENTE\n\n");
                res.append("👨‍💼 Votre chef de parc a été notifié automatiquement.");
                return res.toString();
            } catch (RuntimeException e) {
                if (e.getMessage().contains("véhicule") || e.getMessage().contains("vehicule"))
                    return "⚠️ Impossible de créer la déclaration : vous n'avez pas de véhicule affecté.\n"
                            + "Contactez votre chef de parc.";
                if (e.getMessage().contains("chef"))
                    return "⚠️ Aucun chef de parc assigné à votre local. Contactez l'administration.";
                return "❌ Erreur : " + e.getMessage();
            }
        }

        String typeDetecte = type != null ? type.name().toLowerCase() : "panne / accident / amende";
        return "📝 Pour créer une déclaration, utilisez ce format :\n\n"
                + "```\nDéclarer une " + typeDetecte + " : [description détaillée]\n```\n\n"
                + "📌 Exemples :\n"
                + "• \"Déclarer une panne    : le moteur chauffe anormalement depuis ce matin\"\n"
                + "• \"Déclarer un accident  : collision légère au parking à 10h30\"\n"
                + "• \"Déclarer une amende   : contravention pour stationnement interdit\"";
    }

    private String getMesDeclarations(Long userId) {
        List<Declaration> list = gestionParcService.getDeclarationsByChauffeur(userId);
        if (list.isEmpty()) return "📋 Vous n'avez aucune déclaration enregistrée.";

        long enAttente = list.stream().filter(d -> d.getStatus() == DeclarationStatus.EN_ATTENTE).count();
        long traitees  = list.stream().filter(d -> d.getStatus() == DeclarationStatus.TRAITE).count();

        StringBuilder res = new StringBuilder("📋 Vos déclarations (" + list.size() + ") :\n");
        res.append("⏳ En attente : ").append(enAttente)
                .append("   |   ✅ Traitées : ").append(traitees).append("\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < list.size(); i++) {
            Declaration d = list.get(i);
            String emoji = switch (d.getStatus()) {
                case EN_ATTENTE -> "⏳";
                case TRAITE     -> "✅";
                case REJETE     -> "❌";
                default         -> "•";
            };
            res.append("\n").append(emoji).append("  ").append(d.getType())
                    .append("  —  ").append(d.getStatus()).append("\n");
            res.append("   📝  ").append(d.getDescription()).append("\n");
            if (d.getDateCreation() != null)
                res.append("   📅  ").append(d.getDateCreation().toLocalDate()).append("\n");
            if (i < list.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    private String getMonVehicule(Long userId) {
        Chauffeur chauffeur = chauffeurRepository.findById(userId).orElse(null);
        if (chauffeur == null) return "Impossible de trouver vos informations.";

        if (chauffeur.getVehicule() == null)
            return "🚗 Vous n'avez pas de véhicule affecté pour le moment.\nContactez votre chef de parc.";

        Vehicule v = chauffeur.getVehicule();
        StringBuilder res = new StringBuilder("🚗 Votre véhicule :\n\n");
        res.append(SEP_HEAVY);
        res.append("📋  Matricule     : ").append(v.getMatricule()).append("\n");
        res.append("🏷️  Marque/Modèle : ").append(v.getMarque()).append(" ").append(v.getModele()).append("\n");
        res.append("📅  Année         : ").append(v.getAnnee()).append("\n");
        res.append("⛽  Carburant     : ").append(v.getCarburant()).append("\n");
        res.append("🔄  État          : ").append(v.getEtat()).append("\n");
        return res.toString();
    }

    private String getFeuilleDeRoute(Long userId) {
        List<FeuilleDeRoute> feuilles = gestionParcService.getFeuillesParChauffeur(userId);
        if (feuilles.isEmpty())
            return "📋 Aucune feuille de route trouvée.\nContactez votre chef de parc.";

        FeuilleDeRoute feuille = feuilles.get(feuilles.size() - 1);
        List<Mission> missions = feuille.getMissions();

        StringBuilder res = new StringBuilder("📋 Votre feuille de route :\n\n");
        res.append(SEP_HEAVY);
        res.append("📅  Générée le : ").append(feuille.getDateGeneration()).append("\n");
        res.append("🚗  Véhicule   : ").append(feuille.getVehicule().getMatricule())
                .append(" (").append(feuille.getVehicule().getMarque()).append(")\n");
        res.append("📌  Statut     : ").append(feuille.getStatut()).append("\n");

        if (missions == null || missions.isEmpty()) {
            res.append("\nAucune mission dans cette feuille.");
        } else {
            long terminees         = missions.stream()
                    .filter(m -> m.getKmArrivee() != null && m.getHeureArriveeReelle() != null).count();
            long enAttenteMissions = missions.size() - terminees;
            res.append("\n📊  Missions : ").append(missions.size())
                    .append("   (✅ ").append(terminees)
                    .append(" terminées   |   ⏳ ").append(enAttenteMissions).append(" en attente)\n");
            res.append(SEP_HEAVY);

            for (int i = 0; i < missions.size(); i++) {
                Mission m = missions.get(i);
                boolean complete = m.getKmArrivee() != null && m.getHeureArriveeReelle() != null;
                res.append("\n").append(complete ? "✅" : "⏳").append("  Mission ").append(i + 1).append(" :\n");
                res.append("   🛣️  ").append(m.getPointDepart()).append(" → ").append(m.getDestination()).append("\n");
                res.append("   ⏰  Départ prévu : ").append(m.getHeureDepartPrevue()).append("\n");
                if (complete) {
                    res.append("   🔢  KM          : ").append(m.getKmDepart())
                            .append(" → ").append(m.getKmArrivee()).append("\n");
                    res.append("   ✔️  Arrivée réelle : ").append(m.getHeureArriveeReelle()).append("\n");
                }
                if (i < missions.size() - 1) res.append(SEP_LIGHT);
            }
        }
        return res.toString();
    }

    private String getMonChef(Long userId) {
        Chauffeur chauffeur = chauffeurRepository.findById(userId).orElse(null);
        if (chauffeur == null) return "Impossible de trouver vos informations.";
        if (chauffeur.getLocal() == null) return "⚠️ Vous n'êtes assigné à aucun local.";

        Local local = chauffeur.getLocal();
        if (local.getChefParc() == null)
            return "⚠️ Aucun chef de parc n'est assigné à votre local (" + local.getNomLocal() + ").";

        ChefParc chef = local.getChefParc();
        StringBuilder res = new StringBuilder("👨‍💼 Votre chef de parc :\n\n");
        res.append(SEP_HEAVY);
        res.append("👤  Nom    : ").append(chef.getNom()).append(" ").append(chef.getPrenom()).append("\n");
        res.append("📧  Email  : ").append(chef.getMail()).append("\n");
        res.append("🏢  Local  : ").append(local.getNomLocal()).append(" — ").append(local.getVille()).append("\n");
        return res.toString();
    }

    private String getInfoLocal(Long userId) {
        Chauffeur chauffeur = chauffeurRepository.findById(userId).orElse(null);
        if (chauffeur == null) return "Impossible de trouver vos informations.";

        StringBuilder res = new StringBuilder("🏢 Vos informations :\n\n");
        res.append(SEP_HEAVY);
        res.append("👤  Nom    : ").append(chauffeur.getNom()).append(" ").append(chauffeur.getPrenom()).append("\n");
        res.append("📧  Email  : ").append(chauffeur.getMail()).append("\n");
        res.append("🔄  État   : ").append(chauffeur.getEtatChauffeur()).append("\n");

        if (chauffeur.getLocal() != null) {
            Local local = chauffeur.getLocal();
            res.append("\n📍  Local   : ").append(local.getNomLocal()).append("\n");
            res.append("🏙️  Ville   : ").append(local.getVille()).append("\n");
            res.append("📫  Adresse : ").append(local.getAdresse()).append("\n");
        } else {
            res.append("\n⚠️ Vous n'êtes assigné à aucun local.");
        }
        return res.toString();
    }

    private String getMissionsAujourdHui(Long userId) {
        List<Mission> list = missionRepository.findByChauffeur_IdChauffeur(userId);
        LocalDate today = LocalDate.now();
        List<Mission> today_m = list.stream()
                .filter(m -> m.getDateMission() != null && m.getDateMission().equals(today))
                .collect(Collectors.toList());

        if (today_m.isEmpty())
            return "📅 Aucune mission programmée pour aujourd'hui (" + today + ").";

        StringBuilder res = new StringBuilder("📅 Missions d'aujourd'hui — " + today
                + " (" + today_m.size() + ") :\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < today_m.size(); i++) {
            Mission m = today_m.get(i);
            boolean complete = m.getKmArrivee() != null && m.getHeureArriveeReelle() != null;
            res.append("\n").append(complete ? "✅" : "⏳").append("  Mission ").append(i + 1).append(" :\n");
            res.append("   🛣️  ").append(m.getPointDepart()).append(" → ").append(m.getDestination()).append("\n");
            res.append("   ⏰  Départ prévu : ").append(m.getHeureDepartPrevue()).append("\n");
            if (i < today_m.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    private String getMissions(Long userId) {
        List<Mission> list = missionRepository.findByChauffeur_IdChauffeur(userId);
        if (list.isEmpty()) return "📋 Vous n'avez aucune mission assignée.";

        long terminees = list.stream()
                .filter(m -> m.getKmArrivee() != null && m.getHeureArriveeReelle() != null).count();

        StringBuilder res = new StringBuilder("📋 Toutes vos missions (" + list.size() + ") :\n");
        res.append("✅ Terminées : ").append(terminees)
                .append("   |   ⏳ En attente : ").append(list.size() - terminees).append("\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < list.size(); i++) {
            Mission m = list.get(i);
            boolean complete = m.getKmArrivee() != null && m.getHeureArriveeReelle() != null;
            res.append("\n").append(complete ? "✅" : "⏳").append("  Mission ").append(i + 1).append(" :\n");
            res.append("   🛣️  ").append(m.getPointDepart()).append(" → ").append(m.getDestination()).append("\n");
            if (m.getDateMission() != null)
                res.append("   📅  Date   : ").append(m.getDateMission()).append("\n");
            res.append("   ⏰  Départ  : ").append(m.getHeureDepartPrevue()).append("\n");
            if (i < list.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    private String getMissionsTerminees(Long userId) {
        List<Mission> list = missionRepository.findByChauffeur_IdChauffeur(userId);
        List<Mission> terminees = list.stream()
                .filter(m -> m.getKmArrivee() != null && m.getHeureArriveeReelle() != null)
                .collect(Collectors.toList());

        if (terminees.isEmpty())
            return "📋 Vous n'avez aucune mission terminée pour le moment.";

        StringBuilder res = new StringBuilder("✅ Missions terminées (" + terminees.size() + ") :\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < terminees.size(); i++) {
            Mission m = terminees.get(i);
            res.append("\n📌  Mission ").append(i + 1).append(" :\n");
            res.append("   🛣️  Trajet         : ").append(m.getPointDepart())
                    .append(" → ").append(m.getDestination()).append("\n");
            if (m.getDateMission() != null)
                res.append("   📅  Date           : ").append(m.getDateMission()).append("\n");
            res.append("   🔢  KM Départ      : ").append(m.getKmDepart()).append("\n");
            res.append("   🔢  KM Arrivée     : ").append(m.getKmArrivee()).append("\n");
            res.append("   ⏰  Arrivée réelle : ").append(m.getHeureArriveeReelle()).append("\n");
            if (i < terminees.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    // =====================================================================
    //                    CHEF DE PARC — MÉTHODES PARTAGÉES
    // =====================================================================

    private String getMissionsAujourdHuiChef(Long localId) {
        List<Mission> all = missionRepository.findAll();
        LocalDate today = LocalDate.now();
        List<Mission> today_m = all.stream()
                .filter(m -> m.getLocal() != null
                        && m.getLocal().getIdLocal().equals(localId)
                        && m.getDateMission() != null
                        && m.getDateMission().equals(today))
                .collect(Collectors.toList());

        if (today_m.isEmpty())
            return "📅 Aucune mission pour votre local aujourd'hui (" + today + ").";

        StringBuilder res = new StringBuilder("📅 Missions d'aujourd'hui — " + today
                + " (" + today_m.size() + ") :\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < today_m.size(); i++) {
            Mission m = today_m.get(i);
            boolean complete = m.getKmArrivee() != null && m.getHeureArriveeReelle() != null;
            res.append("\n").append(complete ? "✅" : "⏳").append("  Mission ").append(i + 1).append(" :\n");
            res.append("   📍  ").append(m.getPointDepart()).append(" → ").append(m.getDestination()).append("\n");
            res.append("   ⏰  Départ : ").append(m.getHeureDepartPrevue()).append("\n");
            if (m.getChauffeur() != null)
                res.append("   👨‍✈️  Chauffeur : ").append(m.getChauffeur().getNom())
                        .append(" ").append(m.getChauffeur().getPrenom()).append("\n");
            if (i < today_m.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    private String getMissionsChef(Long localId) {
        List<Mission> all = missionRepository.findAll().stream()
                .filter(m -> m.getLocal() != null && m.getLocal().getIdLocal().equals(localId))
                .collect(Collectors.toList());

        if (all.isEmpty()) return "📋 Aucune mission trouvée pour votre local.";

        long terminees = all.stream()
                .filter(m -> m.getKmArrivee() != null && m.getHeureArriveeReelle() != null).count();

        StringBuilder res = new StringBuilder("📋 Missions de votre local (" + all.size() + ") :\n");
        res.append("✅ Terminées : ").append(terminees)
                .append("   |   ⏳ En attente : ").append(all.size() - terminees).append("\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < all.size(); i++) {
            Mission m = all.get(i);
            boolean complete = m.getKmArrivee() != null && m.getHeureArriveeReelle() != null;
            res.append("\n").append(complete ? "✅" : "⏳").append("  Mission ").append(i + 1).append(" :\n");
            res.append("   📍  ").append(m.getPointDepart()).append(" → ").append(m.getDestination()).append("\n");
            if (m.getDateMission() != null)
                res.append("   📅  Date   : ").append(m.getDateMission()).append("\n");
            res.append("   ⏰  Départ  : ").append(m.getHeureDepartPrevue()).append("\n");
            if (m.getChauffeur() != null)
                res.append("   👨‍✈️  Chauffeur : ").append(m.getChauffeur().getNom())
                        .append(" ").append(m.getChauffeur().getPrenom()).append("\n");
            if (i < all.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    // =====================================================================
    //                    VÉHICULES (CHEF) — MÉTHODES PUBLIQUES
    // =====================================================================

    public String getVehiculesDisponibles(Long localId) {
        List<Vehicule> list = (localId != null
                ? vehiculeRepository.findByLocal_IdLocal(localId)
                : vehiculeRepository.findAll())
                .stream().filter(v -> v.getEtat() == EtatVehicule.DISPONIBLE)
                .collect(Collectors.toList());

        if (list.isEmpty()) return "😔 Aucun véhicule disponible pour le moment.";

        StringBuilder res = new StringBuilder("✅ Véhicules disponibles (" + list.size() + ") :\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < list.size(); i++) {
            Vehicule v = list.get(i);
            res.append("\n🚗  ").append(v.getMatricule()).append("\n");
            res.append("   🏷️  ").append(v.getMarque()).append(" ").append(v.getModele()).append("\n");
            res.append("   ⛽  Carburant : ").append(v.getCarburant()).append("\n");
            if (i < list.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    public String getVehicules(Long localId) {
        List<Vehicule> list = localId != null
                ? vehiculeRepository.findByLocal_IdLocal(localId)
                : vehiculeRepository.findAll();

        if (list.isEmpty()) return "Aucun véhicule trouvé.";

        long dispo     = list.stream().filter(v -> v.getEtat() == EtatVehicule.DISPONIBLE).count();
        long enMission = list.stream().filter(v -> v.getEtat() == EtatVehicule.EN_MISSION).count();
        long entretien = list.stream().filter(v -> v.getEtat() == EtatVehicule.EN_ENTRETIEN).count();
        long indispo   = list.stream().filter(v -> v.getEtat() == EtatVehicule.INDISPONIBLE).count();

        StringBuilder res = new StringBuilder("🚗 Parc véhicules (" + list.size() + ") :\n");
        res.append("✅ ").append(dispo).append(" dispo   |   🛣️ ").append(enMission)
                .append(" en mission   |   🔧 ").append(entretien)
                .append(" entretien   |   ❌ ").append(indispo).append(" indispo\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < list.size(); i++) {
            Vehicule v = list.get(i);
            String e = switch (v.getEtat()) {
                case DISPONIBLE   -> "✅";
                case EN_MISSION   -> "🛣️";
                case EN_ENTRETIEN -> "🔧";
                case INDISPONIBLE -> "❌";
                default           -> "•";
            };
            res.append("\n").append(e).append("  ").append(v.getMatricule()).append("\n");
            res.append("   🏷️  ").append(v.getMarque()).append(" ").append(v.getModele()).append("\n");
            res.append("   📅  Année     : ").append(v.getAnnee()).append("\n");
            res.append("   ⛽  Carburant : ").append(v.getCarburant()).append("\n");
            if (i < list.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    public String getChauffeurs(Long localId) {
        List<Chauffeur> list = localId != null
                ? chauffeurRepository.findByLocal_IdLocal(localId)
                : chauffeurRepository.findAll();

        if (list.isEmpty()) return "Aucun chauffeur trouvé.";

        long dispo     = list.stream().filter(c -> c.getEtatChauffeur() == Chauffeur.EtatChauffeur.DISPONIBLE).count();
        long enMission = list.stream().filter(c -> c.getEtatChauffeur() == Chauffeur.EtatChauffeur.EN_MISSION).count();
        long enConge   = list.stream().filter(c -> c.getEtatChauffeur() == Chauffeur.EtatChauffeur.EN_CONGE).count();

        StringBuilder res = new StringBuilder("👨‍✈️ Chauffeurs (" + list.size() + ") :\n");
        res.append("✅ Disponibles : ").append(dispo)
                .append("   |   🛣️ En mission : ").append(enMission)
                .append("   |   🏖️ En congé : ").append(enConge).append("\n");
        res.append(SEP_HEAVY);

        for (int i = 0; i < list.size(); i++) {
            Chauffeur c = list.get(i);
            String etatEmoji = switch (c.getEtatChauffeur()) {
                case DISPONIBLE -> "✅";
                case EN_MISSION -> "🛣️";
                case EN_CONGE   -> "🏖️";
                default         -> "•";
            };
            res.append("\n").append(etatEmoji).append("  ")
                    .append(c.getNom()).append(" ").append(c.getPrenom()).append("\n");
            res.append("   📋  État : ").append(c.getEtatChauffeur()).append("\n");
            res.append("   🔑  ID   : ").append(c.getIdChauffeur()).append("\n");
            if (c.getVehicule() != null)
                res.append("   🚗  Véhicule : ").append(c.getVehicule().getMatricule()).append("\n");
            if (i < list.size() - 1) res.append(SEP_LIGHT);
        }
        return res.toString();
    }

    public String getStats(Long localId) {
        List<Vehicule>    v          = localId != null ? vehiculeRepository.findByLocal_IdLocal(localId) : vehiculeRepository.findAll();
        List<Chauffeur>   c          = localId != null ? chauffeurRepository.findByLocal_IdLocal(localId) : chauffeurRepository.findAll();
        List<Mission>     missions   = missionRepository.findAll().stream()
                .filter(m -> m.getLocal() != null && m.getLocal().getIdLocal().equals(localId))
                .collect(Collectors.toList());
        List<Declaration> decls      = gestionParcService.getAllDeclarationsByLocal(localId);
        List<Entretien>   entretiens = gestionParcService.getEntretiensByLocal(localId);

        long vDispo     = v.stream().filter(x -> x.getEtat() == EtatVehicule.DISPONIBLE).count();
        long vMission   = v.stream().filter(x -> x.getEtat() == EtatVehicule.EN_MISSION).count();
        long vEntretien = v.stream().filter(x -> x.getEtat() == EtatVehicule.EN_ENTRETIEN).count();
        long cDispo     = c.stream().filter(x -> x.getEtatChauffeur() == Chauffeur.EtatChauffeur.DISPONIBLE).count();
        long cMission   = c.stream().filter(x -> x.getEtatChauffeur() == Chauffeur.EtatChauffeur.EN_MISSION).count();
        long cConge     = c.stream().filter(x -> x.getEtatChauffeur() == Chauffeur.EtatChauffeur.EN_CONGE).count();
        long mTerminees = missions.stream().filter(m -> m.getKmArrivee() != null && m.getHeureArriveeReelle() != null).count();
        long dEnAttente = decls.stream().filter(d -> d.getStatus() == DeclarationStatus.EN_ATTENTE).count();
        long eEnAttente = entretiens.stream().filter(e -> e.getStatus() == Entretien.Status.EN_ATTENTE).count();

        StringBuilder res = new StringBuilder("📊 Bilan du parc :\n\n");
        res.append(SEP_HEAVY);
        res.append("\n🚗  Véhicules  : ").append(v.size())
                .append("   (✅ ").append(vDispo).append(" dispo")
                .append("   |   🛣️ ").append(vMission).append(" en mission")
                .append("   |   🔧 ").append(vEntretien).append(" entretien)\n");
        res.append("\n👨‍✈️  Chauffeurs : ").append(c.size())
                .append("   (✅ ").append(cDispo).append(" dispo")
                .append("   |   🛣️ ").append(cMission).append(" en mission")
                .append("   |   🏖️ ").append(cConge).append(" en congé)\n");
        res.append("\n📋  Missions   : ").append(missions.size())
                .append("   (✅ ").append(mTerminees).append(" terminées)\n");
        res.append("\n📣  Déclarations en attente : ").append(dEnAttente).append("\n");
        res.append("\n🔧  Entretiens en attente   : ").append(eEnAttente).append("\n");
        return res.toString();
    }

    // =====================================================================
    //                    CLAUDE API
    // =====================================================================

    public String repondreAvecClaude(String userMessage, String role) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-api-key", claudeApiKey);
            headers.set("anthropic-version", "2023-06-01");
            headers.setContentType(MediaType.APPLICATION_JSON);

            String systemPrompt = switch (role) {
                case "CHAUFFEUR" ->
                        "Tu es un assistant intelligent pour un chauffeur de parc automobile chez AGIL Energy Tunisie. " +
                                "Réponds en français, de façon concise. " +
                                "NE COMMENCE JAMAIS ta réponse par une salutation générique (Bonjour, Bonsoir...) sauf si l'utilisateur t'a salué. " +
                                "Si la demande n'est pas claire, explique le format attendu sans salutation. " +
                                "Tu peux aider sur : missions, déclarations (panne/accident/amende), " +
                                "feuille de route, compléter une mission, local et chef. " +
                                "Pour compléter une mission : 'mission <numéro> km depart X km arrivee Y heure arrivee HH:mm'. " +
                                "Pour une déclaration : 'Déclarer une panne/accident/amende : description'.";
                case "CHEF_PARC" ->
                        "Tu es un assistant intelligent pour un chef de parc chez AGIL Energy Tunisie. " +
                                "Réponds en français, de façon concise. " +
                                "NE COMMENCE JAMAIS ta réponse par une salutation générique (Bonjour, Bonsoir...) sauf si l'utilisateur t'a salué. " +
                                "Si la demande n'est pas claire, explique le format attendu sans salutation. " +
                                "Tu gères : véhicules, chauffeurs, missions, feuilles de route, déclarations, entretiens, cartes carburant. " +
                                "Pour affecter un véhicule : 'affecter véhicule [matricule] chauffeur [nom ou ID]'. " +
                                "Pour changer l'état d'un chauffeur : DISPONIBLE, EN_MISSION, EN_CONGE. " +
                                "Pour une mission : chauffeur, véhicule, départ, destination, heure HH:mm, date AAAA-MM-JJ. " +
                                "Pour traiter une déclaration : 'traiter déclaration [ID] garage ID [X] type entretien [type] date prévue [AAAA-MM-JJ]'. " +
                                "Pour un entretien périodique : véhicule, garage ID, type, date prévue. " +
                                "Pour recharger une carte : 'recharger carte [numéro] montant [valeur]'.";
                default ->
                        "Tu es un assistant chez AGIL Energy Tunisie. Réponds en français.";
            };

            Map<String, Object> body = new HashMap<>();
            body.put("model", "claude-haiku-4-5-20251001");
            body.put("max_tokens", 600);
            body.put("system", systemPrompt);
            body.put("messages", List.of(Map.of("role", "user", "content", userMessage)));

            HttpEntity<String> request = new HttpEntity<>(mapper.writeValueAsString(body), headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.anthropic.com/v1/messages", request, Map.class);

            List<Map<String, Object>> content = (List<Map<String, Object>>) response.getBody().get("content");
            return content.get(0).get("text").toString();

        } catch (Exception e) {
            System.err.println("❌ Erreur Claude API: " + e.getMessage());
            return getFallbackResponse(userMessage);
        }
    }

    // =====================================================================
    //                    FALLBACK
    // =====================================================================

    private String getFallbackResponse(String message) {
        String msgN = normaliser(message);
        if (isSalutation(msgN))
            return "Bonjour ! 👋 Je suis votre assistant AGIL. Comment puis-je vous aider ?";
        if (msgN.contains("merci"))
            return "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.";
        if (msgN.contains("comment") && (msgN.contains("allez") || msgN.contains("va")))
            return "Je vais très bien merci ! 😊 Et vous ? Je suis à votre disposition.";
        if (msgN.contains("agil"))
            return "🏢 AGIL Energy est une entreprise tunisienne spécialisée dans la distribution "
                    + "d'énergie et de carburants.\nTapez **aide** pour voir ce que je peux faire.";
        if (msgN.contains("aurevoir") || msgN.contains("au revoir")
                || msgN.contains("bye") || msgN.contains("bonne nuit"))
            return "Au revoir ! 👋 Bonne journée et bonne route !";
        return "Je suis là pour vous aider avec votre travail chez AGIL ! 😊\n"
                + "Tapez **aide** pour voir toutes mes fonctionnalités.";
    }

    // =====================================================================
    //                    CAPACITÉS
    // =====================================================================

    private String getCapacites(String role, String userName) {
        if (role.equals("ADMIN")) return "⚙️ Admin : Stats globales, locaux avec photos, performances.";

        if (role.equals("CHAUFFEUR")) {
            return "Bonjour " + userName + " ! 👋 Voici ce que je peux faire :\n\n"
                    + SEP_HEAVY
                    + "\n📋  Mes missions          → \"Quelles sont mes missions ?\"\n"
                    + "📅  Missions du jour      → \"Missions d'aujourd'hui\"\n"
                    + "✅  Missions terminées    → \"Mes missions terminées\" / \"Historique\"\n"
                    + "📄  Feuille de route      → \"Ma feuille de route\"\n"
                    + "🚗  Mon véhicule          → \"Mon véhicule\" / \"Ma voiture\"\n"
                    + "👨‍💼  Mon chef              → \"Qui est mon chef ?\"\n"
                    + "🏢  Mon local / profil    → \"Mon local\" / \"Mes infos\"\n"
                    + "📝  Mes déclarations      → \"Mes déclarations\"\n"
                    + "🚨  Créer une déclaration → \"Déclarer une panne : moteur en surchauffe\"\n"
                    + "✔️  Compléter une mission → \"km depart 12500 km arrivee 12750 heure arrivee 14:30\"\n"
                    + "    _(plusieurs missions  → \"mission 2 km arrivee 12750 heure arrivee 14:30\")_\n";
        }
        if (role.equals("CHEF_PARC")) {
            return "Bonjour " + userName + " ! 👋 Voici ce que je peux faire :\n\n"
                    + SEP_HEAVY
                    + "\n🚗  VÉHICULES\n"
                    + "   → \"Liste des véhicules\" / \"Véhicules disponibles / en mission / en entretien\"\n"
                    + "   → \"Affecter véhicule [matricule] chauffeur [nom]\"\n"
                    + "   → \"Véhicule [matricule] état disponible / entretien / indisponible\"\n"
                    + SEP_LIGHT
                    + "\n👨‍✈️  CHAUFFEURS\n"
                    + "   → \"Liste des chauffeurs\"\n"
                    + "   → \"Chauffeur [nom] état disponible / en mission / congé\"\n"
                    + SEP_LIGHT
                    + "\n📋  MISSIONS\n"
                    + "   → \"Missions du jour\" / \"Toutes les missions\"\n"
                    + SEP_LIGHT
                    + "\n📄  FEUILLES DE ROUTE\n"
                    + "   → \"Feuilles de route\"\n"
                    + SEP_LIGHT
                    + "\n📣  DÉCLARATIONS\n"
                    + "   → \"Toutes les déclarations\" / \"Déclarations en attente / traitées / rejetées\"\n"
                    + SEP_LIGHT
                    + "\n🔧  ENTRETIENS\n"
                    + "   → \"Liste des entretiens\"\n"
                    + SEP_LIGHT
                    + "\n💳  CARTES CARBURANT\n"
                    + "   → \"Solde carte [numéro]\" / \"Liste des cartes\"\n"
                    + "   → \"Recharger carte [numéro] montant [valeur]\"\n"
                    + SEP_LIGHT
                    + "\n📊  STATISTIQUES\n"
                    + "   → \"Bilan du parc\" / \"Statistiques\"\n";
        }
        return "Bonjour " + userName + " ! 👋 Je suis votre assistant AGIL.\nTapez votre demande pour commencer.";
    }

    // =====================================================================
    //                    UTILITAIRES
    // =====================================================================

    private boolean isSalutation(String msgN) {
        return msgN.matches(".*(bonjour|bonsoir|salut|hello|hi|salam|coucou|hey|bonne journee).*");
    }

    private Double extraireNombre(String message, String pattern) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "(?:" + pattern + ")[\\s:=]+([0-9]+[.,]?[0-9]*)",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) return Double.parseDouble(m.group(1).replace(",", "."));
        } catch (Exception ignored) {}
        return null;
    }

    private String extraireHeure(String message) {
        try {
            // D'abord chercher après un mot-clé (heure depart, heure arrivee, etc.)
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "(?:heure.?arriv|arriv[eé]e|heure.?dep|heure)[\\s:=]*([0-9]{1,2}:[0-9]{2})",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) return m.group(1);
            // Sinon chercher n'importe quelle heure dans le message
            m = java.util.regex.Pattern.compile("\\b([0-9]{1,2}:[0-9]{2})\\b").matcher(message);
            if (m.find()) return m.group(1);
        } catch (Exception ignored) {}
        return null;
    }

    private String extraireHeureDep(String message) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "(?:heure.?dep|depart.?reel)[\\s:=]*([0-9]{1,2}:[0-9]{2})",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) return m.group(1);
        } catch (Exception ignored) {}
        return null;
    }

    private String extraireDescription(String message) {
        try {
            int idx = message.indexOf(":");
            if (idx != -1 && idx < message.length() - 2)
                return message.substring(idx + 1).trim();
            String[] mots = {"panne", "accident", "amende", "déclarer", "declarer", "signaler"};
            for (String mot : mots) {
                int i = message.toLowerCase().indexOf(mot);
                if (i != -1) {
                    String reste = message.substring(i + mot.length()).trim();
                    if (reste.length() > 3) return reste;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String extraireObservations(String message) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "(?:observation|obs|remarque)[s]?[\\s:=]+(.+)",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) return m.group(1).trim();
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Extrait un ID numérique précédé d'un mot-clé (ex: "vehicule 12", "garage id 3")
     */
    private Long extraireIdEntite(String message, String motCle) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "(?:" + motCle + ")[\\s:=#]*(\\d+)",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) return Long.parseLong(m.group(1));
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Extrait une matricule tunisienne.
     * Supporte : TN-1122-AG, TU-123-AB, 123TU456, 123-TU-456
     * CORRIGÉ : regex étendu pour couvrir tous les formats tunisiens
     */
    private String extraireMatricule(String message) {
        try {
            // Regex optimisée pour : 123 TUN 4567, TN-1234-AG, ou 123456 (matricule simple)
            String regex = "\\b(" +
                    "\\d{1,3}[-\\s]?tunis?[-\\s]?\\d{1,4}" + // 123 TUN 4567
                    "|[a-z]{1,3}[-\\s]?\\d{1,4}[-\\s]?[a-z]{1,3}" + // TN-1234-AG
                    "|\\d{3,6}" + // Matricule interne court (ex: 45678)
                    ")\\b";

            java.util.regex.Matcher m = java.util.regex.Pattern.compile(regex,
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);

            if (m.find()) {
                return m.group(1).trim().toUpperCase().replaceAll("\\s+", " ");
            }
        } catch (Exception ignored) {
            // On ignore l'exception pour ne pas faire planter le chatbot
        }
        return null;
    }

    /**
     * Extrait un nom de personne après un mot-clé.
     * CORRIGÉ : support format multiligne "Chauffeur : Nom Prénom"
     */
    private String extraireNomPersonne(String message, String motCle) {
        try {
            // Support format "Chauffeur : Nom Prénom" (avec ou sans nouvelle ligne)
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "(?:" + motCle + ")\\s*[:\\-=]\\s*([A-Za-zÀ-ÿ]+(?:\\s+[A-Za-zÀ-ÿ]+){0,3})",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) {
                String nom = m.group(1).trim();
                // Ignorer les mots-clés métier
                if (!nom.equalsIgnoreCase("disponible") && !nom.equalsIgnoreCase("etat")
                        && !nom.equalsIgnoreCase("id") && !nom.equalsIgnoreCase("liste")
                        && !nom.equalsIgnoreCase("conducteur") && nom.length() > 2)
                    return nom;
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Extrait une date au format AAAA-MM-JJ
     */
    private String extraireDate(String message) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "\\b(\\d{4}-\\d{2}-\\d{2})\\b").matcher(message);
            if (m.find()) return m.group(1);
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Extrait un champ libre après un mot-clé (ex: "type entretien vidange")
     */
    private String extraireChampLibre(String message, String motCle) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "(?:" + motCle + ")[\\s:=]+([^\\n\\r]+?)(?=\\n|garage|date|observation|$)",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) return m.group(1).trim();
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Extrait le point de départ ou destination selon le mot-clé.
     * CORRIGÉ : support format multiligne "Départ : Tunis"
     */
    private String extraireChamp(String message, String motCle) {
        try {
            // Support format multiligne avec ":" (ex: "Départ : Tunis\n")
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "(?:" + motCle + ")\\s*[:\\-=]\\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s,]*?)\\s*(?=\\n|$|vehicule|chauffeur|heure|date|destination|depart|km)",
                    java.util.regex.Pattern.CASE_INSENSITIVE | java.util.regex.Pattern.MULTILINE).matcher(message);
            if (m.find()) {
                String val = m.group(1).trim();
                if (val.length() > 1) return val;
            }
            // Fallback format inline sans ":"
            m = java.util.regex.Pattern.compile(
                    "(?:" + motCle + ")[\\s]+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s]+?)(?=\\n|vehicule|chauffeur|heure|date|destination|depart|km|$)",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) {
                String val = m.group(1).trim();
                if (val.length() > 1) return val;
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Extrait un numéro de carte carburant (ex: CC-2024-001)
     */
    private String extraireNumeroCarte(String message) {
        try {
            // Format standard CC-AAAA-NNN
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "\\b([A-Z]{2,4}[-]\\d{4}[-]\\d{3,6})\\b",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) return m.group(1).toUpperCase();

            // Format alternatif après "carte"
            m = java.util.regex.Pattern.compile(
                    "(?:carte)[\\s:]+([A-Z0-9-]{5,20})",
                    java.util.regex.Pattern.CASE_INSENSITIVE).matcher(message);
            if (m.find()) return m.group(1).trim().toUpperCase();
        } catch (Exception ignored) {}
        return null;
    }
}