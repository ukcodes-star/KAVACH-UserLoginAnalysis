package com.loginanalysis.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAnalyticsResponseDTO {

    private long totalLogins;

    private long successfulLogins;

    private long failedLogins;

    private double failedLoginRate;

    private List<DailyLoginStatDTO> last7Days;
}