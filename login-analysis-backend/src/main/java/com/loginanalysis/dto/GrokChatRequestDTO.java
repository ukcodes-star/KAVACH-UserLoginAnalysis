package com.loginanalysis.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GrokChatRequestDTO {

    @NotBlank(message = "Prompt cannot be blank")
    private String prompt;

    private String context;
}
