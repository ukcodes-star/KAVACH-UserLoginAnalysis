package com.loginanalysis.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class GrokAnalysisResponseDTO {
    private String status; // "LIVE" or "SIMULATED"
    private String model;
    private String threatLevel; // "CRITICAL", "HIGH", "MEDIUM", "LOW"
    private String summary;
    private String detailedAnalysis;
    private List<String> mitreAttackTactics;
    private List<String> recommendedActions;
    private LocalDateTime generatedAt;
}
