package com.loginanalysis.dto;

import lombok.*;

import java.util.List;
import com.loginanalysis.dto.TopRiskyUserDTO;
import com.loginanalysis.dto.AnomalyResponseDTO;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityDashboardResponseDTO {

    // Risk summary
    private long totalUsers;
    private long riskyUsers;

    // Anomaly summary
    private long totalAnomalies;
    private long criticalAnomalies;
    private long highAnomalies;
    private long mediumAnomalies;
    private long lowAnomalies;

    // Login summary
    private long totalLogins;
    private long successfulLogins;
    private long failedLogins;
    private double failedLoginRate;

    // Last 7 days
    private List<DailyLoginStatDTO> last7Days;


    private List<TopRiskyUserDTO> topRiskyUsers;

    private List<AnomalyResponseDTO> recentCriticalAnomalies;
}