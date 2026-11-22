package com.loginanalysis.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GrokChatResponseDTO {
    private String response;
    private String model;
    private String mode;
    private LocalDateTime timestamp;
}
