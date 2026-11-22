package com.loginanalysis.service;

import com.loginanalysis.dto.RiskDashboardResponseDTO;
import com.loginanalysis.dto.TopRiskyUserDTO;
import com.loginanalysis.dto.UserRiskResponseDTO;
import com.loginanalysis.entity.Anomaly;
import com.loginanalysis.entity.Severity;
import com.loginanalysis.entity.User;
import com.loginanalysis.exception.ResourceNotFoundException;
import com.loginanalysis.repository.AnomalyRepository;
import com.loginanalysis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.loginanalysis.repository.TopRiskyUserProjection;
import java.util.ArrayList;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskService {

    private final UserRepository userRepository;
    private final AnomalyRepository anomalyRepository;

    @Transactional(readOnly = true)
    public UserRiskResponseDTO calculateUserRisk(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        LocalDateTime last24Hours =
                LocalDateTime.now().minusHours(24);

        List<Anomaly> anomalies =
                anomalyRepository
                        .findByUserIdAndDetectedAtAfterOrderByDetectedAtDesc(
                                userId,
                                last24Hours
                        );

        int totalRisk = anomalies.stream()
                .mapToInt(Anomaly::getRiskScore)
                .sum();

        int riskScore = Math.min(totalRisk, 100);

        String riskLevel = determineRiskLevel(riskScore);

        return UserRiskResponseDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .anomalyCount((long) anomalies.size())
                .build();
    }

    @Transactional(readOnly = true)
    public RiskDashboardResponseDTO getDashboardSummary() {

        long totalAnomalies = anomalyRepository.count();

        long criticalAnomalies =
                anomalyRepository.countBySeverity(Severity.CRITICAL);

        long highAnomalies =
                anomalyRepository.countBySeverity(Severity.HIGH);

        long mediumAnomalies =
                anomalyRepository.countBySeverity(Severity.MEDIUM);

        long lowAnomalies =
                anomalyRepository.countBySeverity(Severity.LOW);

        long totalUsers = userRepository.count();

        long riskyUsers = anomalyRepository.countRiskyUsersSince(
                LocalDateTime.now().minusHours(24)
        );

        return RiskDashboardResponseDTO.builder()
                .totalAnomalies(totalAnomalies)
                .criticalAnomalies(criticalAnomalies)
                .highAnomalies(highAnomalies)
                .mediumAnomalies(mediumAnomalies)
                .lowAnomalies(lowAnomalies)
                .totalUsers(totalUsers)
                .riskyUsers(riskyUsers)
                .build();
    }

    private long calculateRiskyUsers() {

        long riskyUsers = 0;

        List<User> users = userRepository.findAll();

        for (User user : users) {

            UserRiskResponseDTO risk =
                    calculateUserRisk(user.getId());

            if (risk.getRiskScore() >= 60) {
                riskyUsers++;
            }
        }

        return riskyUsers;
    }

    private String determineRiskLevel(int riskScore) {

        if (riskScore >= 80) {
            return "CRITICAL";
        }

        if (riskScore >= 60) {
            return "HIGH";
        }

        if (riskScore >= 30) {
            return "MEDIUM";
        }

        return "LOW";
    }

    @Transactional(readOnly = true)
    public List<TopRiskyUserDTO> getTopRiskyUsers() {

        LocalDateTime since = LocalDateTime.now().minusHours(24);

        List<TopRiskyUserProjection> results =
                anomalyRepository.findTopRiskyUsersSince(since);

        List<TopRiskyUserDTO> response = new ArrayList<>();

        for (TopRiskyUserProjection result : results) {

            int score = Math.toIntExact(result.getRiskScore());

            response.add(
                    TopRiskyUserDTO.builder()
                            .userId(result.getUserId())
                            .username(result.getUsername())
                            .riskScore(score)
                            .anomalyCount(result.getAnomalyCount())
                            .riskLevel(determineRiskLevel(score))
                            .build()
            );
        }

        return response;
    }
}