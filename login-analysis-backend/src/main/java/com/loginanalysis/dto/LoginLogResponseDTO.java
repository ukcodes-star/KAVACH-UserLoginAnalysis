package com.loginanalysis.dto;

import com.loginanalysis.entity.LoginStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class LoginLogResponseDTO {

    private Long id;

    private Long userId;

    private String username;

    private LocalDateTime loginTime;

    private String ipAddress;

    private String location;

    private String device;

    private LoginStatus status;
}