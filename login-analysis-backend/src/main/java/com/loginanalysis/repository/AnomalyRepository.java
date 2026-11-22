package com.loginanalysis.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.loginanalysis.entity.Anomaly;
import com.loginanalysis.entity.AnomalyType;
import com.loginanalysis.entity.Severity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnomalyRepository
        extends JpaRepository<Anomaly, Long> {

    List<Anomaly> findAllByOrderByDetectedAtDesc();

    List<Anomaly> findByUserIdOrderByDetectedAtDesc(
            Long userId
    );

    List<Anomaly> findBySeverityOrderByDetectedAtDesc(
            Severity severity
    );

    List<Anomaly> findByAnomalyTypeOrderByDetectedAtDesc(
            AnomalyType anomalyType
    );

    long countBySeverity(Severity severity);

    boolean existsByUserIdAndAnomalyTypeAndLoginLogId(
            Long userId,
            AnomalyType anomalyType,
            Long loginLogId
    );

    List<Anomaly> findByUserIdAndDetectedAtAfterOrderByDetectedAtDesc(
            Long userId,
            LocalDateTime time
    );

    @Query(value = """
    SELECT COUNT(*)
    FROM (
        SELECT user_id
        FROM anomalies
        WHERE detected_at > :since
        GROUP BY user_id
        HAVING SUM(risk_score) >= 60
    ) AS risky_users
    """, nativeQuery = true)
    long countRiskyUsersSince(
            @Param("since") LocalDateTime since
    );

    @Query(value = """
    SELECT
        a.user_id AS "userId",
        u.username AS "username",
        LEAST(SUM(a.risk_score), 100) AS "riskScore",
        COUNT(a.id) AS "anomalyCount"
    FROM anomalies a
    JOIN users u ON u.id = a.user_id
    WHERE a.detected_at > :since
    GROUP BY a.user_id, u.username
    HAVING SUM(a.risk_score) > 0
    ORDER BY "riskScore" DESC
    LIMIT 10
    """, nativeQuery = true)
    List<TopRiskyUserProjection> findTopRiskyUsersSince(
            @Param("since") LocalDateTime since
    );

    List<Anomaly> findTop10BySeverityOrderByDetectedAtDesc(
            Severity severity
    );

    // Pagination: Get all anomalies
    Page<Anomaly> findAllByOrderByDetectedAtDesc(Pageable pageable);

    // Pagination: Get anomalies belonging to a particular user
    Page<Anomaly> findByUserIdOrderByDetectedAtDesc(
            Long userId,
            Pageable pageable
    );

    // Pagination: Filter anomalies by severity
    Page<Anomaly> findBySeverityOrderByDetectedAtDesc(
            Severity severity,
            Pageable pageable
    );

    // Pagination: Filter anomalies by type
    Page<Anomaly> findByAnomalyTypeOrderByDetectedAtDesc(
            AnomalyType anomalyType,
            Pageable pageable
    );

    // Combined filtering with pagination and dynamic sorting

    @Query("""
    SELECT a FROM Anomaly a
    WHERE (:severity IS NULL OR a.severity = :severity)
    AND (:anomalyType IS NULL OR a.anomalyType = :anomalyType)
    """)
    Page<Anomaly> searchAnomalies(
            @Param("severity") Severity severity,
            @Param("anomalyType") AnomalyType anomalyType,
            Pageable pageable
    );

    @Query("""
    SELECT a FROM Anomaly a
    WHERE a.user.id = :userId
    AND (:severity IS NULL OR a.severity = :severity)
    AND (:anomalyType IS NULL OR a.anomalyType = :anomalyType)
    """)
    Page<Anomaly> searchUserAnomalies(
            @Param("userId") Long userId,
            @Param("severity") Severity severity,
            @Param("anomalyType") AnomalyType anomalyType,
            Pageable pageable
    );
}