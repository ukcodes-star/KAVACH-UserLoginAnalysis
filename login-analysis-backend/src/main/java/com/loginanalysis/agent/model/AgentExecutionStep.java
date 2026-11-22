package com.loginanalysis.agent.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentExecutionStep {
    private int stepIndex;
    private int loopCycle; // outer loop iteration count
    private AgentRole agentRole; // which agent took this action
    private String thought; // chain of thought or reasoning
    private String actionType; // "THINKING", "TOOL_INVOCATION", "TOOL_COMPLETED", "STEERING_INJECTED", "FINAL_ANSWER"
    private String toolName;
    private Map<String, Object> toolArguments;
    private AgentToolResult toolResult;
    private LocalDateTime timestamp;
}
