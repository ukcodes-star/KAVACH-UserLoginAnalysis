package com.loginanalysis.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GrokStatusDTO {
    private boolean live;
    private String model;
    private String message;
}
