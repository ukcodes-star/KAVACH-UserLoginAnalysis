package com.loginanalysis.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRiskResponseDTO {

    private Long userId;

    private String username;

    private Integer riskScore;

    private String riskLevel;

    private Long anomalyCount;
}