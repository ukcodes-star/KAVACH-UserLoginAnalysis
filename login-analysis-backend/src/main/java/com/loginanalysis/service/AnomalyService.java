package com.loginanalysis.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.loginanalysis.dto.AnomalyResponseDTO;
import com.loginanalysis.entity.Anomaly;
import com.loginanalysis.entity.AnomalyType;
import com.loginanalysis.entity.Severity;
import com.loginanalysis.exception.ResourceNotFoundException;
import com.loginanalysis.repository.AnomalyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnomalyService {

    private final AnomalyRepository anomalyRepository;


    // =========================================================
    // GET ALL ANOMALIES
    // =========================================================

    @Transactional(readOnly = true)
    public List<AnomalyResponseDTO> getAllAnomalies() {

        return anomalyRepository
                .findAllByOrderByDetectedAtDesc()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
    // GET ANOMALIES FOR USER
    // =========================================================

    @Transactional(readOnly = true)
    public List<AnomalyResponseDTO> getUserAnomalies(
            Long userId
    ) {

        return anomalyRepository
                .findByUserIdOrderByDetectedAtDesc(userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
    // GET BY SEVERITY
    // =========================================================

    @Transactional(readOnly = true)
    public List<AnomalyResponseDTO> getBySeverity(
            Severity severity
    ) {

        return anomalyRepository
                .findBySeverityOrderByDetectedAtDesc(severity)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
    // GET BY TYPE
    // =========================================================

    @Transactional(readOnly = true)
    public List<AnomalyResponseDTO> getByType(
            AnomalyType anomalyType
    ) {

        return anomalyRepository
                .findByAnomalyTypeOrderByDetectedAtDesc(anomalyType)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
    // GET ANOMALY BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public AnomalyResponseDTO getById(Long id) {

        Anomaly anomaly = anomalyRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Anomaly not found with id: " + id
                        ));

        return convertToResponse(anomaly);
    }


    // =========================================================
    // ENTITY → DTO
    // =========================================================

    private AnomalyResponseDTO convertToResponse(
            Anomaly anomaly
    ) {

        return AnomalyResponseDTO.builder()
                .id(anomaly.getId())
                .userId(anomaly.getUser().getId())
                .username(anomaly.getUser().getUsername())
                .loginLogId(anomaly.getLoginLog().getId())
                .anomalyType(anomaly.getAnomalyType())
                .description(anomaly.getDescription())
                .riskScore(anomaly.getRiskScore())
                .severity(anomaly.getSeverity())
                .detectedAt(anomaly.getDetectedAt())
                .build();
    }


    @Transactional(readOnly = true)
    public List<AnomalyResponseDTO> getRecentCriticalAnomalies() {

        return anomalyRepository
                .findTop10BySeverityOrderByDetectedAtDesc(Severity.CRITICAL)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
// PAGINATION: GET ALL ANOMALIES
// =========================================================

    @Transactional(readOnly = true)
    public Page<AnomalyResponseDTO> getAllAnomalies(Pageable pageable) {

        return anomalyRepository
                .findAllByOrderByDetectedAtDesc(pageable)
                .map(this::convertToResponse);
    }


// =========================================================
// PAGINATION: GET ANOMALIES FOR A USER
// =========================================================

    @Transactional(readOnly = true)
    public Page<AnomalyResponseDTO> getUserAnomalies(
            Long userId,
            Pageable pageable
    ) {

        return anomalyRepository
                .findByUserIdOrderByDetectedAtDesc(userId, pageable)
                .map(this::convertToResponse);
    }


// =========================================================
// PAGINATION: FILTER BY SEVERITY
// =========================================================

    @Transactional(readOnly = true)
    public Page<AnomalyResponseDTO> getBySeverity(
            Severity severity,
            Pageable pageable
    ) {

        return anomalyRepository
                .findBySeverityOrderByDetectedAtDesc(severity, pageable)
                .map(this::convertToResponse);
    }


// =========================================================
// PAGINATION: FILTER BY ANOMALY TYPE
// =========================================================

    @Transactional(readOnly = true)
    public Page<AnomalyResponseDTO> getByType(
            AnomalyType anomalyType,
            Pageable pageable
    ) {

        return anomalyRepository
                .findByAnomalyTypeOrderByDetectedAtDesc(anomalyType, pageable)
                .map(this::convertToResponse);
    }

    // Combined filtering, sorting and pagination for all anomalies

    @Transactional(readOnly = true)
    public Page<AnomalyResponseDTO> searchAnomalies(
            Severity severity,
            AnomalyType anomalyType,
            Pageable pageable) {

        return anomalyRepository
                .searchAnomalies(severity, anomalyType, pageable)
                .map(this::convertToResponse);
    }


// Combined filtering, sorting and pagination for a particular user

    @Transactional(readOnly = true)
    public Page<AnomalyResponseDTO> searchUserAnomalies(
            Long userId,
            Severity severity,
            AnomalyType anomalyType,
            Pageable pageable) {

        return anomalyRepository
                .searchUserAnomalies(userId, severity, anomalyType, pageable)
                .map(this::convertToResponse);
    }
}