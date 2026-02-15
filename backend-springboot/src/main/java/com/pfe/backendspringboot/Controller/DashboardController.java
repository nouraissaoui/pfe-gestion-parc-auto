package com.pfe.backendspringboot.Controller;

import com.pfe.backendspringboot.Service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // Total des véhicules
    @GetMapping("/{idLocal}/total-vehicules")
    public long getTotalVehicules(@PathVariable Long idLocal) {
        return dashboardService.getTotalVehicules(idLocal);
    }

    // Missions en cours
    @GetMapping("/{idLocal}/missions-en-cours")
    public long getMissionsEnCours(@PathVariable Long idLocal) {
        return dashboardService.getNbMissionsEnCours(idLocal);
    }

    // Véhicules disponibles
    @GetMapping("/{idLocal}/vehicules-disponibles")
    public long getVehiculesDisponibles(@PathVariable Long idLocal) {
        return dashboardService.getVehiculesDisponibles(idLocal);
    }

    // Déclarations en attente
    @GetMapping("/declarations-en-attente/{idChef}")
    public long getDeclarationsEnAttente(@PathVariable Long idChef) {
        return dashboardService.getDeclarationsEnAttente(idChef);
    }

    // Entretiens en attente
    // Endpoint pour récupérer le nombre d'entretiens en attente d'un chef du parc
    @GetMapping("/en-attente/{idChef}")
    public long getEntretiensEnAttente(@PathVariable Long idChef) {
        return dashboardService.getEntretiensEnAttente(idChef);
    }
}