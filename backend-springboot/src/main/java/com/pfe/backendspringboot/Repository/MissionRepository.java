package com.pfe.backendspringboot.Repository;

import com.pfe.backendspringboot.Entities.Mission;
import com.pfe.backendspringboot.Entities.StatutFeuilleDeRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {

    // a fin de Compter les missions en cours dans un local
        @Query("SELECT COUNT(m) " +
                "FROM Mission m " +
                "WHERE m.local.idLocal = :idLocal " +
                "AND m.feuilleDeRoute.statut <> :statut")
        int countMissionsEnCoursByLocal(@Param("idLocal") Long idLocal,
                                        @Param("statut") StatutFeuilleDeRoute statut);
    }
