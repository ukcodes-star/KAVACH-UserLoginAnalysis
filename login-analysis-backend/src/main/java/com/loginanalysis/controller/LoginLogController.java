
package com.loginanalysis.controller;

import com.loginanalysis.dto.LoginLogRequestDTO;
import com.loginanalysis.dto.LoginLogResponseDTO;
import com.loginanalysis.service.LoginLogService;
import com.loginanalysis.service.UserAuthorizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/login-logs")
@CrossOrigin(origins = "http://localhost:5173")
public class LoginLogController {

    private final LoginLogService loginLogService;
    private final UserAuthorizationService userAuthorizationService;

    public LoginLogController(
            LoginLogService loginLogService,
            UserAuthorizationService userAuthorizationService
    ) {
        this.loginLogService = loginLogService;
        this.userAuthorizationService = userAuthorizationService;
    }

    // ADMIN only: Create login logs
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoginLogResponseDTO> createLoginLog(
            @Valid @RequestBody LoginLogRequestDTO request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(loginLogService.createLoginLog(request));
    }

    // ADMIN only: View all login logs
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LoginLogResponseDTO>> getAllLogs() {
        return ResponseEntity.ok(
                loginLogService.getAllLogs()
        );
    }

    // ADMIN: Any user's logs
    // USER: Only their own logs
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<LoginLogResponseDTO>> getUserLogs(
            @PathVariable Long userId
    ) {
        userAuthorizationService.checkUserAccess(userId);

        return ResponseEntity.ok(
                loginLogService.getUserLogs(userId)
        );
    }

    // ADMIN only: View all failed login logs
    @GetMapping("/failed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LoginLogResponseDTO>> getFailedLogs() {
        return ResponseEntity.ok(
                loginLogService.getFailedLogs()
        );
    }

    // ADMIN only: View recent login logs
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LoginLogResponseDTO>> getRecentLogs(
            @RequestParam(defaultValue = "24") int hours
    ) {
        return ResponseEntity.ok(
                loginLogService.getRecentLogs(hours)
        );
    }
}
