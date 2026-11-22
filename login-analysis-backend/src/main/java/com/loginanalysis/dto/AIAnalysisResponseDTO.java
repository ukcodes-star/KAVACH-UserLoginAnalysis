package com.loginanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIAnalysisResponseDTO {

    private Long id;
    private Long anomalyId;
    private String summary;
    private String riskExplanation;
    private List<String> suspiciousIndicators;
    private List<String> potentialSecurityImplications;
    private List<String> recommendations;
    private String confidence;
    private String threatLevel;
    private String model;

    @Builder.Default
    private boolean advisory = true;

    @Builder.Default
    private String disclaimer = "AI-generated cybersecurity analysis is advisory only. Consequential security actions require administrator approval.";

    private LocalDateTime generatedAt;
}
