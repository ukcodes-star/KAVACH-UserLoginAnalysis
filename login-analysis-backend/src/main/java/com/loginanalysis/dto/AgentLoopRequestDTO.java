package com.loginanalysis.dto;

import com.loginanalysis.agent.model.AgentRole;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentLoopRequestDTO {

    @NotBlank(message = "Prompt cannot be empty")
    private String prompt;

    @Builder.Default
    private AgentRole agentRole = AgentRole.DUAL_COLLABORATIVE;

    @Builder.Default
    private List<String> steeringMessages = new ArrayList<>();

    @Builder.Default
    private List<String> followUpMessages = new ArrayList<>();

    private String context;
}
