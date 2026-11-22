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
public class AISecuritySummaryResponseDTO {

    private Long id;
    private long totalAnomaliesAnalyzed;
    private String overallSecuritySituation;
    private String summary;
    private List<String> mostImportantThreats;
    private List<String> commonSuspiciousPatterns;
    private List<String> investigationPriorities;
    private List<String> recommendedActions;
    private String confidence;
    private String threatLevel;
    private String model;

    @Builder.Default
    private boolean advisory = true;

    @Builder.Default
    private String disclaimer = "AI-generated cybersecurity summary is advisory only. Consequential security actions require administrator approval.";

    private LocalDateTime generatedAt;
}
