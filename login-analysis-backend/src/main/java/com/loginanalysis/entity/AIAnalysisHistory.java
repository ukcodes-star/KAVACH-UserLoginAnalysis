package com.loginanalysis.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analysis_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIAnalysisHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anomaly_id")
    private Anomaly anomaly;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "cached_anomaly_id")
    private Long cachedAnomalyId;

    @Column(name = "cached_user_id")
    private Long cachedUserId;

    @Column(length = 100)
    private String username;

    @Column(nullable = false, length = 50)
    private String analysisType;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String riskExplanation;

    @Column(columnDefinition = "TEXT")
    private String indicatorsJson;

    @Column(columnDefinition = "TEXT")
    private String recommendationsJson;

    @Column(length = 20)
    private String confidence;

    @Column(length = 20)
    private String threatLevel;

    @Column(length = 100)
    private String model;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isAdvisory = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isAdvisory == null) {
            isAdvisory = true;
        }
    }
}
