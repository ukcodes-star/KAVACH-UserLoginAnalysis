
package com.loginanalysis.controller;
import org.springframework.http.HttpStatus;
import com.loginanalysis.dto.RiskDashboardResponseDTO;
import com.loginanalysis.dto.UserRiskResponseDTO;
import com.loginanalysis.service.RiskService;
import com.loginanalysis.service.UserAuthorizationService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class RiskController {


    private final RiskService riskService;
    private final UserAuthorizationService userAuthorizationService;

    // ADMIN or USER: Get risk information for a particular user
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<?> getUserRisk(@PathVariable Long userId) {

        boolean hasAccess =
                userAuthorizationService.checkUserAccess(userId);

        if (!hasAccess) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("You do not have permission to access this user's data");
        }

        return ResponseEntity.ok(
                riskService.calculateUserRisk(userId)
        );
    }

    // ADMIN ONLY: Get overall risk dashboard
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RiskDashboardResponseDTO> getDashboardSummary() {

        return ResponseEntity.ok(
                riskService.getDashboardSummary()
        );
    }
}
