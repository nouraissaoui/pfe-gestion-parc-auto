package com.pfe.backendspringboot.Service;

import com.pfe.backendspringboot.Entities.*;

import com.pfe.backendspringboot.Repository.*;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final VehiculeRepository vehiculeRepo;
    private final MissionRepository missionRepo;
    private final DeclarationRepository declarationRepo;
    private final EntretienRepository entretienRepo;

    public DashboardService(VehiculeRepository vehiculeRepo,
                            MissionRepository missionRepo,
                            DeclarationRepository declarationRepo,
                            EntretienRepository entretienRepo) {
        this.vehiculeRepo = vehiculeRepo;
        this.missionRepo = missionRepo;
        this.declarationRepo = declarationRepo;
        this.entretienRepo = entretienRepo;
    }

    public long getTotalVehicules(Long idLocal) {
        return vehiculeRepo.countByLocal_IdLocal(idLocal);
    }

    public long getNbMissionsEnCours(Long idLocal) {
        return (long) missionRepo.countMissionsEnCoursByLocal(idLocal, StatutFeuilleDeRoute.TERMINE);
    }

    public long getVehiculesDisponibles(Long idLocal) {
        return vehiculeRepo.countByLocal_IdLocalAndEtat(idLocal, EtatVehicule.DISPONIBLE);
    }

    public long getDeclarationsEnAttente(Long idChefParc) {
        return declarationRepo.countByChefParc_IdChefParcAndStatus(idChefParc, DeclarationStatus.EN_ATTENTE);
    }

    public long getEntretiensEnAttente(Long idChefParc) {
        return entretienRepo.countEntretiensEnAttenteByChef(idChefParc);
    }
}