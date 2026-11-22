package com.loginanalysis.dto;

import com.loginanalysis.entity.UserRole;

public record LoginResponseDTO(

        Long id,
        String username,
        String email,
        UserRole role,
        Boolean active,
        String message,
        String accessToken,
        String tokenType,
        long expiresIn

) {
}