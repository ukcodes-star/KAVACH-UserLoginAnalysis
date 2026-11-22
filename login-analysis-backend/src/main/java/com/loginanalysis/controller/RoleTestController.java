package com.loginanalysis.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/role-test")
public class RoleTestController {

    // Only ADMIN can access this endpoint
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Welcome ADMIN! You have administrative access.";
    }

    // Both ADMIN and USER can access this endpoint
    @GetMapping("/user")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public String userAccess() {
        return "Welcome! You have authenticated user access.";
    }
}