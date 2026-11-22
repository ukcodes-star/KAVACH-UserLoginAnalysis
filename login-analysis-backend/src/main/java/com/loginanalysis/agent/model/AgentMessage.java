package com.loginanalysis.agent.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentMessage {
    private String role; // "system", "user", "assistant", "tool"
    private String content;
    private String name;
    private String toolCallId;
    private List<ToolCall> toolCalls;
    private AgentRole agentRole;

    public static AgentMessage system(String content) {
        return AgentMessage.builder().role("system").content(content).build();
    }

    public static AgentMessage user(String content) {
        return AgentMessage.builder().role("user").content(content).build();
    }

    public static AgentMessage assistant(String content, AgentRole role) {
        return AgentMessage.builder().role("assistant").content(content).agentRole(role).build();
    }

    public static AgentMessage toolResult(String toolCallId, String toolName, String content) {
        return AgentMessage.builder()
                .role("tool")
                .toolCallId(toolCallId)
                .name(toolName)
                .content(content)
                .build();
    }
}
