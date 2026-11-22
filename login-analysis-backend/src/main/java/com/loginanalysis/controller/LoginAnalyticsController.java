package com.loginanalysis.controller;

import com.loginanalysis.dto.LoginAnalyticsResponseDTO;
import com.loginanalysis.service.LoginAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class LoginAnalyticsController {

    private final LoginAnalyticsService loginAnalyticsService;

    @GetMapping("/logins")
    public ResponseEntity<LoginAnalyticsResponseDTO> getLoginAnalytics() {

        return ResponseEntity.ok(
                loginAnalyticsService.getLoginAnalytics()
        );
    }
}