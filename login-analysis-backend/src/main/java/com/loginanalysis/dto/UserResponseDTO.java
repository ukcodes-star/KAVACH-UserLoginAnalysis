package com.loginanalysis.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponseDTO {

    private Long id;

    private String username;

    private String email;

    private Boolean active;

    private LocalDateTime createdAt;
}