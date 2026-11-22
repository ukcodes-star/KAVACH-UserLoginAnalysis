package com.loginanalysis.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskDashboardResponseDTO {

    private long totalAnomalies;

    private long criticalAnomalies;

    private long highAnomalies;

    private long mediumAnomalies;

    private long lowAnomalies;

    private long totalUsers;

    private long riskyUsers;
}