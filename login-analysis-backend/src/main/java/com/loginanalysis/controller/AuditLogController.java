
package com.loginanalysis.controller;

import com.loginanalysis.entity.AuditLog;
import com.loginanalysis.service.AuditLogService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    // Get all audit logs
    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {

        return ResponseEntity.ok(
                auditLogService.getAllAuditLogs()
        );
    }

    // Get audit logs by username
    @GetMapping("/user/{username}")
    public ResponseEntity<List<AuditLog>> getLogsByUsername(
            @PathVariable String username) {

        return ResponseEntity.ok(
                auditLogService.getLogsByUsername(username)
        );
    }

    // Get audit logs by action
    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditLog>> getLogsByAction(
            @PathVariable String action) {

        return ResponseEntity.ok(
                auditLogService.getLogsByAction(action)
        );
    }
}
