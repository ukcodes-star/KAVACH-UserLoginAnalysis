package com.loginanalysis.dto;

import com.loginanalysis.entity.AnomalyType;
import com.loginanalysis.entity.Severity;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnomalyResponseDTO {

    private Long id;

    private Long userId;

    private String username;

    private Long loginLogId;

    private AnomalyType anomalyType;

    private String description;

    private Integer riskScore;

    private Severity severity;

    private LocalDateTime detectedAt;
}