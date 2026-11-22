
package com.loginanalysis.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestParam;
import com.loginanalysis.dto.AnomalyResponseDTO;
import com.loginanalysis.entity.AnomalyType;
import com.loginanalysis.entity.Severity;
import com.loginanalysis.service.AnomalyService;
import com.loginanalysis.service.UserAuthorizationService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/anomalies")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AnomalyController {

    private final AnomalyService anomalyService;
    private final UserAuthorizationService userAuthorizationService;

    // ADMIN ONLY: Get all anomalies with pagination
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AnomalyResponseDTO>> getAllAnomalies(

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10") int size,

            @RequestParam(required = false) Severity severity,

            @RequestParam(required = false) AnomalyType type,

            @RequestParam(defaultValue = "detectedAt") String sortBy,

            @RequestParam(defaultValue = "desc") String direction
    ) {

        Pageable pageable = createPageable(page, size, sortBy, direction);

        return ResponseEntity.ok(
                anomalyService.searchAnomalies(severity, type, pageable)
        );
    }

    // ADMIN or USER: Get anomaly by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<AnomalyResponseDTO> getById(
            @PathVariable Long id
    ) {

        AnomalyResponseDTO anomaly = anomalyService.getById(id);

        // Check ownership using the userId stored in the anomaly
        userAuthorizationService.checkUserAccess(anomaly.getUserId());

        return ResponseEntity.ok(anomaly);
    }

    // ADMIN or USER: Get anomalies for a particular user
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<AnomalyResponseDTO>> getUserAnomalies(
            @PathVariable Long userId
    ) {

        // USER can access only their own anomalies
        // ADMIN can access anomalies belonging to any user
        userAuthorizationService.checkUserAccess(userId);

        return ResponseEntity.ok(
                anomalyService.getUserAnomalies(userId)
        );
    }

    // ADMIN or USER: Get user anomalies with pagination
    @GetMapping("/user/{userId}/paginated")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<AnomalyResponseDTO>> getUserAnomaliesPaginated(

            @PathVariable Long userId,

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10") int size,

            @RequestParam(required = false) Severity severity,

            @RequestParam(required = false) AnomalyType type,

            @RequestParam(defaultValue = "detectedAt") String sortBy,

            @RequestParam(defaultValue = "desc") String direction
    ) {

        userAuthorizationService.checkUserAccess(userId);

        Pageable pageable = createPageable(page, size, sortBy, direction);

        return ResponseEntity.ok(
                anomalyService.searchUserAnomalies(
                        userId, severity, type, pageable
                )
        );
    }

    // ADMIN ONLY: Filter anomalies by severity
    @GetMapping("/severity/{severity}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AnomalyResponseDTO>> getBySeverity(
            @PathVariable Severity severity
    ) {

        return ResponseEntity.ok(
                anomalyService.getBySeverity(severity)
        );
    }

    // ADMIN ONLY: Filter anomalies by type
    @GetMapping("/type/{type}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AnomalyResponseDTO>> getByType(
            @PathVariable AnomalyType type
    ) {

        return ResponseEntity.ok(
                anomalyService.getByType(type)
        );
    }



    private Pageable createPageable(
            int page,
            int size,
            String sortBy,
            String direction) {

        if (page < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page number cannot be negative"
            );
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page size must be between 1 and 100"
            );
        }

        List<String> allowedFields = List.of(
                "id",
                "detectedAt",
                "riskScore",
                "severity",
                "anomalyType"
        );

        if (!allowedFields.contains(sortBy)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid sort field. Allowed fields: " + allowedFields
            );
        }

        Sort.Direction sortDirection;

        try {
            sortDirection = Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Direction must be either asc or desc"
            );
        }

        return PageRequest.of(
                page,
                size,
                Sort.by(sortDirection, sortBy)
        );
    }
}
