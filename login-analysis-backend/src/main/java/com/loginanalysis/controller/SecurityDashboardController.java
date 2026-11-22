package com.loginanalysis.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.loginanalysis.dto.AnomalyResponseDTO;
import com.loginanalysis.dto.SecurityDashboardResponseDTO;
import com.loginanalysis.service.SecurityDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.loginanalysis.dto.TopRiskyUserDTO;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasRole('ADMIN')")
public class SecurityDashboardController {

    private final SecurityDashboardService securityDashboardService;

    @GetMapping("/security")
    public ResponseEntity<SecurityDashboardResponseDTO> getSecurityDashboard() {

        return ResponseEntity.ok(
                securityDashboardService.getDashboard()
        );
    }

    @GetMapping("/top-risky-users")
    public ResponseEntity<List<TopRiskyUserDTO>> getTopRiskyUsers() {

        return ResponseEntity.ok(
                securityDashboardService.getTopRiskyUsers()
        );
    }

    @GetMapping("/recent-critical-anomalies")
    public ResponseEntity<List<AnomalyResponseDTO>>
    getRecentCriticalAnomalies() {

        return ResponseEntity.ok(
                securityDashboardService.getRecentCriticalAnomalies()
        );
    }
}