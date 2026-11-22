package com.loginanalysis.dto;

import com.loginanalysis.agent.model.AgentExecutionStep;
import com.loginanalysis.agent.model.AgentRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentLoopResponseDTO {

    private String finalResponse;

    private AgentRole activeRole;

    @Builder.Default
    private List<AgentExecutionStep> steps = new ArrayList<>();

    @Builder.Default
    private List<String> toolsExecuted = new ArrayList<>();

    private int outerLoopCycles;

    private int innerLoopIterations;

    private String mode; // "LIVE" or "SIMULATED"

    private String model;

    @Builder.Default
    private LocalDateTime completedAt = LocalDateTime.now();
}
