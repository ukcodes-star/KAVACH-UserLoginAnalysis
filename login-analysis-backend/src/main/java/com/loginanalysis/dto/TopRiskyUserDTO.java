package com.loginanalysis.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopRiskyUserDTO {

    private Long userId;

    private String username;

    private Integer riskScore;

    private Long anomalyCount;

    private String riskLevel;
}