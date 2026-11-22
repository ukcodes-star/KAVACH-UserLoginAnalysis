package com.loginanalysis.agent.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Carries two distinct outputs:
 * 1. content: compact, token-efficient text representation fed back to the LLM context.
 * 2. details: full structured object for rich UI inspection, telemetry graphs, and audit logging.
 * (Following recodeLearning lesson 14 AgentTool pattern).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentToolResult {
    private String content;
    private Object details;
    private boolean isError;

    public static AgentToolResult success(String content, Object details) {
        return AgentToolResult.builder()
                .content(content)
                .details(details)
                .isError(false)
                .build();
    }

    public static AgentToolResult error(String errorMessage) {
        return AgentToolResult.builder()
                .content("Tool execution error: " + errorMessage)
                .details(errorMessage)
                .isError(true)
                .build();
    }
}
