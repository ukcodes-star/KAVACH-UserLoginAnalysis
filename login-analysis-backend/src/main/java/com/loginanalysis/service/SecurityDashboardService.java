package com.loginanalysis.service;

import com.loginanalysis.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.loginanalysis.dto.TopRiskyUserDTO;
import com.loginanalysis.service.AnomalyService;
import com.loginanalysis.dto.AnomalyResponseDTO;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SecurityDashboardService {

    private final RiskService riskService;
    private final LoginAnalyticsService loginAnalyticsService;
    private final AnomalyService anomalyService;

    @Transactional(readOnly = true)
    public SecurityDashboardResponseDTO getDashboard() {

        // Get risk information
        RiskDashboardResponseDTO risk =
                riskService.getDashboardSummary();

        // Get login analytics
        LoginAnalyticsResponseDTO loginAnalytics =
                loginAnalyticsService.getLoginAnalytics();

        var topRiskyUsers = riskService.getTopRiskyUsers();

        var recentCriticalAnomalies =
                anomalyService.getRecentCriticalAnomalies();

        return SecurityDashboardResponseDTO.builder()

                // -------------------------
                // Risk
                // -------------------------

                .totalUsers(risk.getTotalUsers())
                .riskyUsers(risk.getRiskyUsers())

                // -------------------------
                // Anomalies
                // -------------------------

                .totalAnomalies(risk.getTotalAnomalies())
                .criticalAnomalies(risk.getCriticalAnomalies())
                .highAnomalies(risk.getHighAnomalies())
                .mediumAnomalies(risk.getMediumAnomalies())
                .lowAnomalies(risk.getLowAnomalies())

                // -------------------------
                // Login analytics
                // -------------------------

                .totalLogins(loginAnalytics.getTotalLogins())
                .successfulLogins(
                        loginAnalytics.getSuccessfulLogins()
                )
                .failedLogins(
                        loginAnalytics.getFailedLogins()
                )
                .failedLoginRate(
                        loginAnalytics.getFailedLoginRate()
                )

                // -------------------------
                // Trend
                // -------------------------

                .last7Days(
                        loginAnalytics.getLast7Days()
                )

                .topRiskyUsers(topRiskyUsers)
                .recentCriticalAnomalies(recentCriticalAnomalies)

                .build();
    }

    public List<TopRiskyUserDTO> getTopRiskyUsers() {
        return riskService.getTopRiskyUsers();
    }

    @Transactional(readOnly = true)
    public List<AnomalyResponseDTO> getRecentCriticalAnomalies() {
        return anomalyService.getRecentCriticalAnomalies();
    }
}