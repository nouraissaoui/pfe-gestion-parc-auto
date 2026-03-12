package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Vehicule;
import com.pfe.backendspringboot.Entities.EtatVehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {

    // Nombre total de véhicules dans un local
    long countByLocal_IdLocal(Long idLocal);

    // Véhicules disponibles dans un local
    long countByLocal_IdLocalAndEtat(Long idLocal, EtatVehicule etat);
    List<Vehicule> findByLocal_IdLocal(Long idLocal);
    long countByEtat(EtatVehicule etat);
    // Pour l'Indice de vétusté : Compte les véhicules par année
    @Query("SELECT v.annee, COUNT(v) FROM Vehicule v GROUP BY v.annee")
    List<Object[]> countVehiculesByAnnee();

    // Pour le Taux de disponibilité : Compte par état (DISPONIBLE, EN_MISSION, etc.)
    @Query("SELECT v.etat, COUNT(v) FROM Vehicule v GROUP BY v.etat")
    List<Object[]> countByEtat();

    // La méthode qui te manquait : Calcul de la consommation moyenne par marque
    // On suppose que l'entité Mission a un champ 'consommationCarburant' et est liée à 'Vehicule'
    @Query(value = "SELECT v.marque, AVG(m.consommation_carburant) " +
            "FROM vehicule v " +
            "JOIN missions m ON v.id_vehicule = m.id_vehicule " +
            "GROUP BY v.marque", nativeQuery = true)
    List<Object[]> getConsommationMoyenne();

}
