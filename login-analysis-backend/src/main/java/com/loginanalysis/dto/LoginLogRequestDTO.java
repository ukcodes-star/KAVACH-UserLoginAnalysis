package com.loginanalysis.dto;

import com.loginanalysis.entity.LoginStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class LoginLogRequestDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    private LocalDateTime loginTime;

    @NotBlank(message = "IP address is required")
    private String ipAddress;

    private String location;

    private String device;

    @NotNull(message = "Login status is required")
    private LoginStatus status;
}