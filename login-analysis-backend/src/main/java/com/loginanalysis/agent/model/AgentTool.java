package com.loginanalysis.agent.model;

import java.util.Map;

/**
 * Enterprise AgentTool Interface
 * Directly mirrors the AgentTool contract from recodeLearning (lesson 14):
 * - Explicit parameter definition schema
 * - Dual output (content for LLM + structured details for UI)
 * - Parallel vs sequential execution safety
 * - Assigned agent specialization
 */
public interface AgentTool {

    String getName();

    String getDescription();

    Map<String, Object> getParameterSchema();

    boolean isParallelSafe();

    AgentRole getAssignedRole();

    AgentToolResult execute(Map<String, Object> arguments);
}
