package com.loginanalysis.dto;

import com.loginanalysis.entity.UserRole;

import java.time.LocalDateTime;

public record RegisterResponseDTO(
        Long id,
        String username,
        String email,
        UserRole role,
        Boolean active,
        LocalDateTime createdAt
) {
}