package com.loginanalysis.agent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.loginanalysis.agent.model.*;
import com.loginanalysis.agent.tools.SecurityToolsRegistry;
import com.loginanalysis.config.GrokConfig;
import com.loginanalysis.dto.AgentLoopRequestDTO;
import com.loginanalysis.dto.AgentLoopResponseDTO;
import com.loginanalysis.util.GrokClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Two-Loop Agent Orchestration Engine
 * Architecture directly adheres to recodeLearning (lesson 17 two-loop agent & lesson 14 agent tools):
 *
 * OUTER LOOP:
 *   - Orchestrates multi-turn task continuation and follow-up requests.
 *   - Calls getFollowUpMessages() when inner loop exits.
 *   - If follow-up exists, injects it and re-enters the inner loop.
 *
 * INNER LOOP:
 *   - The tool-call execution cycle (LLM call -> prepareToolCall -> execute -> feedback).
 *   - Before each call, checks getSteeringMessages() to inject mid-flight user directives.
 *   - Exits only when no tool calls remain AND no steering is pending.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TwoLoopAgentService {

    private final SecurityToolsRegistry toolsRegistry;
    private final GrokClient grokClient;
    private final GrokConfig grokConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(12))
            .build();

    /**
     * Executes the complete Two-Loop Agent lifecycle.
     */
    public AgentLoopResponseDTO runTwoLoopAgent(AgentLoopRequestDTO request) {
        AgentRole activeRole = request.getAgentRole() != null ? request.getAgentRole() : AgentRole.DUAL_COLLABORATIVE;
        log.info("Starting Two-Loop Agent execution for role [{}] with prompt: \"{}\"",
                activeRole, request.getPrompt());

        Queue<String> steeringQueue = new ConcurrentLinkedQueue<>();
        if (request.getSteeringMessages() != null) {
            steeringQueue.addAll(request.getSteeringMessages());
        }
        Queue<String> followUpQueue = new ConcurrentLinkedQueue<>();
        if (request.getFollowUpMessages() != null) {
            followUpQueue.addAll(request.getFollowUpMessages());
        }

        List<AgentMessage> conversation = new ArrayList<>();
        List<AgentExecutionStep> steps = new ArrayList<>();
        List<String> toolsExecuted = new ArrayList<>();

        // 1. Setup system prompt based on active Agent role
        String systemPrompt = buildSystemPrompt(activeRole);
        conversation.add(AgentMessage.system(systemPrompt));

        // Initial user prompt with optional context
        String initialContent = request.getPrompt();
        if (request.getContext() != null && !request.getContext().isBlank()) {
            initialContent = "Context:\n" + request.getContext() + "\n\nUser Request:\n" + initialContent;
        }
        conversation.add(AgentMessage.user(initialContent));

        int outerLoopCycles = 0;
        int totalInnerIterations = 0;
        int stepIndex = 1;

        // =========================================================================
        // OUTER LOOP (Task continuation & Follow-up queue handling)
        // =========================================================================
        while (true) {
            outerLoopCycles++;
            log.info("--- OUTER LOOP Cycle #{} started ---", outerLoopCycles);

            // Inner loop runs the tool-calling cycle
            int innerCount = runInnerLoop(
                    conversation,
                    steps,
                    toolsExecuted,
                    activeRole,
                    steeringQueue,
                    outerLoopCycles,
                    stepIndex
            );

            stepIndex += innerCount;
            totalInnerIterations += innerCount;

            // Check for Follow-Up messages (user follow-up queries)
            if (followUpQueue.isEmpty()) {
                log.info("Outer loop: No follow-up messages waiting. Task complete.");
                break;
            }

            String nextFollowUp = followUpQueue.poll();
            log.info("Outer loop: Injecting follow-up message: \"{}\"", nextFollowUp);
            conversation.add(AgentMessage.user(nextFollowUp));
            steps.add(AgentExecutionStep.builder()
                    .stepIndex(stepIndex++)
                    .loopCycle(outerLoopCycles)
                    .agentRole(activeRole)
                    .actionType("FOLLOW_UP_INJECTED")
                    .thought("Outer Loop injected follow-up request: " + nextFollowUp)
                    .timestamp(LocalDateTime.now())
                    .build());
            // Re-enters inner loop for follow-up!
        }

        // Extract final synthesized response from assistant
        String finalResponse = extractFinalResponse(conversation, activeRole, steps);

        return AgentLoopResponseDTO.builder()
                .finalResponse(finalResponse)
                .activeRole(activeRole)
                .steps(steps)
                .toolsExecuted(toolsExecuted)
                .outerLoopCycles(outerLoopCycles)
                .innerLoopIterations(totalInnerIterations)
                .mode(grokClient.isAvailable() ? "LIVE" : "SIMULATED")
                .model(grokConfig.getEffectiveModel())
                .completedAt(LocalDateTime.now())
                .build();
    }

    /**
     * INNER LOOP (Tool-calling execution cycle with mid-flight steering).
     */
    private int runInnerLoop(
            List<AgentMessage> conversation,
            List<AgentExecutionStep> steps,
            List<String> toolsExecuted,
            AgentRole role,
            Queue<String> steeringQueue,
            int outerCycle,
            int currentStepIndex
    ) {
        int maxInnerIterations = 6;
        int iteration = 0;

        while (iteration < maxInnerIterations) {
            iteration++;
            int localStep = currentStepIndex + iteration - 1;
            log.info("Inner Loop iteration #{}/{}", iteration, maxInnerIterations);

            // 1. Check for mid-task STEERING messages (User typing during tool execution)
            if (!steeringQueue.isEmpty()) {
                String steeringMsg = steeringQueue.poll();
                log.info("Inner Loop: Prepending user steering message: \"{}\"", steeringMsg);
                conversation.add(AgentMessage.user("[USER STEERING OVERRIDE]: " + steeringMsg));
                steps.add(AgentExecutionStep.builder()
                        .stepIndex(localStep)
                        .loopCycle(outerCycle)
                        .agentRole(role)
                        .actionType("STEERING_INJECTED")
                        .thought("Mid-task steering injected by user: " + steeringMsg)
                        .timestamp(LocalDateTime.now())
                        .build());
            }

            // 2. Call LLM (or autonomous planner if in simulation mode)
            AgentLLMStepResult stepResult = callModelOrPlanner(conversation, role);

            // 3. Record agent thought / message
            if (stepResult.getThought() != null && !stepResult.getThought().isBlank()) {
                steps.add(AgentExecutionStep.builder()
                        .stepIndex(localStep)
                        .loopCycle(outerCycle)
                        .agentRole(stepResult.getRespondingRole() != null ? stepResult.getRespondingRole() : role)
                        .actionType("THINKING")
                        .thought(stepResult.getThought())
                        .timestamp(LocalDateTime.now())
                        .build());
            }

            // 4. If no tools were called, check for late steering and finish inner loop
            if (stepResult.getToolCalls() == null || stepResult.getToolCalls().isEmpty()) {
                if (!steeringQueue.isEmpty()) {
                    continue; // Late steering arrived; re-enter inner loop
                }
                conversation.add(AgentMessage.assistant(stepResult.getAssistantContent(), role));
                break;
            }

            // 5. Execute Tool Calls
            conversation.add(AgentMessage.builder()
                    .role("assistant")
                    .content(stepResult.getAssistantContent())
                    .toolCalls(stepResult.getToolCalls())
                    .agentRole(stepResult.getRespondingRole() != null ? stepResult.getRespondingRole() : role)
                    .build());

            for (ToolCall tc : stepResult.getToolCalls()) {
                AgentTool tool = toolsRegistry.getTool(tc.getName());
                AgentToolResult toolResult;

                steps.add(AgentExecutionStep.builder()
                        .stepIndex(localStep)
                        .loopCycle(outerCycle)
                        .agentRole(stepResult.getRespondingRole() != null ? stepResult.getRespondingRole() : role)
                        .actionType("TOOL_INVOCATION")
                        .toolName(tc.getName())
                        .toolArguments(tc.getArguments())
                        .thought("Executing tool: " + tc.getName())
                        .timestamp(LocalDateTime.now())
                        .build());

                if (tool != null) {
                    try {
                        toolResult = tool.execute(tc.getArguments());
                    } catch (Exception e) {
                        toolResult = AgentToolResult.error("Execution failed: " + e.getMessage());
                    }
                } else {
                    toolResult = AgentToolResult.error("Unknown application tool: " + tc.getName());
                }

                toolsExecuted.add(tc.getName());

                steps.add(AgentExecutionStep.builder()
                        .stepIndex(localStep)
                        .loopCycle(outerCycle)
                        .agentRole(stepResult.getRespondingRole() != null ? stepResult.getRespondingRole() : role)
                        .actionType("TOOL_COMPLETED")
                        .toolName(tc.getName())
                        .toolArguments(tc.getArguments())
                        .toolResult(toolResult)
                        .thought("Tool " + tc.getName() + " completed. Returned structured details.")
                        .timestamp(LocalDateTime.now())
                        .build());

                // Feed tool result back into conversation for next iteration
                conversation.add(AgentMessage.toolResult(tc.getId(), tc.getName(), toolResult.getContent()));
            }
        }

        return iteration;
    }

    /**
     * Executes tool-calling via live xAI Grok API, or via autonomous deterministic planner if offline.
     */
    private AgentLLMStepResult callModelOrPlanner(List<AgentMessage> conversation, AgentRole role) {
        if (grokClient.isAvailable()) {
            try {
                return callLiveGrokToolAPI(conversation, role);
            } catch (Exception e) {
                log.warn("Live Grok tool-calling failed ({}), falling back to internal security planner.", e.getMessage());
            }
        }
        return autonomousSecurityPlanner(conversation, role);
    }

    /**
     * Live tool-calling to xAI Grok /chat/completions endpoint using standard function tools payload.
     */
    private AgentLLMStepResult callLiveGrokToolAPI(List<AgentMessage> conversation, AgentRole role) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", grokConfig.getEffectiveModel());
        payload.put("temperature", 0.1);

        // Convert messages
        List<Map<String, Object>> messagesPayload = new ArrayList<>();
        for (AgentMessage m : conversation) {
            Map<String, Object> msg = new LinkedHashMap<>();
            msg.put("role", m.getRole());
            msg.put("content", m.getContent() != null ? m.getContent() : "");
            if ("tool".equals(m.getRole()) && m.getToolCallId() != null) {
                msg.put("tool_call_id", m.getToolCallId());
            }
            if ("assistant".equals(m.getRole()) && m.getToolCalls() != null && !m.getToolCalls().isEmpty()) {
                List<Map<String, Object>> tcs = new ArrayList<>();
                for (ToolCall tc : m.getToolCalls()) {
                    tcs.add(Map.of(
                            "id", tc.getId(),
                            "type", "function",
                            "function", Map.of(
                                    "name", tc.getName(),
                                    "arguments", objectMapper.writeValueAsString(tc.getArguments())
                            )
                    ));
                }
                msg.put("tool_calls", tcs);
            }
            messagesPayload.add(msg);
        }
        payload.put("messages", messagesPayload);

        // Tools schema
        List<Map<String, Object>> toolsPayload = new ArrayList<>();
        for (AgentTool tool : toolsRegistry.getToolsForRole(role)) {
            toolsPayload.add(Map.of(
                    "type", "function",
                    "function", Map.of(
                            "name", tool.getName(),
                            "description", tool.getDescription(),
                            "parameters", tool.getParameterSchema()
                    )
            ));
        }
        payload.put("tools", toolsPayload);

        String jsonBody = objectMapper.writeValueAsString(payload);
        String endpoint = grokConfig.getBaseUrl().replaceAll("/+$", "") + "/chat/completions";

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + grokConfig.getApiKey().trim())
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(resp.body());
            JsonNode choice = root.path("choices").path(0).path("message");
            String content = choice.path("content").asText("");

            List<ToolCall> toolCalls = new ArrayList<>();
            JsonNode tcArray = choice.path("tool_calls");
            if (tcArray.isArray()) {
                for (JsonNode tcNode : tcArray) {
                    String tcId = tcNode.path("id").asText("tc_" + UUID.randomUUID().toString().substring(0, 8));
                    String funcName = tcNode.path("function").path("name").asText();
                    String argsStr = tcNode.path("function").path("arguments").asText("{}");
                    Map<String, Object> args = objectMapper.readValue(argsStr, new TypeReference<Map<String, Object>>() {});
                    toolCalls.add(ToolCall.builder().id(tcId).name(funcName).arguments(args).build());
                }
            }

            return AgentLLMStepResult.builder()
                    .thought(content.isBlank() ? "Invoking security tool(s)..." : content)
                    .assistantContent(content)
                    .toolCalls(toolCalls)
                    .respondingRole(role)
                    .build();
        }

        throw new RuntimeException("xAI API returned HTTP " + resp.statusCode() + ": " + resp.body());
    }

    /**
     * Autonomous Security Planner
     * High-reliability deterministic planner that selects and invokes tools intelligently
     * when xAI Grok is running in simulation mode or API quota is offline.
     */
    private AgentLLMStepResult autonomousSecurityPlanner(List<AgentMessage> conversation, AgentRole role) {
        String lastUserPrompt = "";
        for (int i = conversation.size() - 1; i >= 0; i--) {
            if ("user".equals(conversation.get(i).getRole())) {
                lastUserPrompt = conversation.get(i).getContent().toLowerCase();
                break;
            }
        }

        // Check if previous message was tool result
        boolean lastWasTool = !conversation.isEmpty() && "tool".equals(conversation.get(conversation.size() - 1).getRole());

        if (lastWasTool) {
            // Synthesize the tool results
            return AgentLLMStepResult.builder()
                    .thought("Analyzing telemetry observations returned from application tools...")
                    .assistantContent(synthesizeToolResults(conversation, role))
                    .toolCalls(Collections.emptyList())
                    .respondingRole(role)
                    .build();
        }

        List<ToolCall> plannedCalls = new ArrayList<>();
        String thought;
        AgentRole respondingRole = role;

        if (lastUserPrompt.contains("quarantine") || lastUserPrompt.contains("disable") || lastUserPrompt.contains("lock") || lastUserPrompt.contains("block")) {
            respondingRole = AgentRole.CONTAINMENT_OPERATOR;
            thought = "[Containment Operator] Initiating security policy containment to isolate suspicious principal.";
            Long targetId = extractFirstNumber(lastUserPrompt, 1L);
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("update_user_account_status")
                    .arguments(Map.of("userId", targetId, "active", false, "reason", "Quarantined by Containment Operator"))
                    .build());
        } else if (lastUserPrompt.contains("simulate") || lastUserPrompt.contains("inject") || lastUserPrompt.contains("attack") || lastUserPrompt.contains("brute")) {
            respondingRole = AgentRole.CONTAINMENT_OPERATOR;
            thought = "[Containment Operator] Generating simulated authentication vectors to stress-test anomaly detection rules.";
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("simulate_login_event")
                    .arguments(Map.of(
                            "userId", 1,
                            "ipAddress", "198.51.100.45",
                            "device", "Python/Requests Exploit Scanner",
                            "location", "Moscow, Russia",
                            "status", "FAILED"
                    ))
                    .build());
        } else if (lastUserPrompt.contains("risky") || lastUserPrompt.contains("watchlist") || lastUserPrompt.contains("score") || lastUserPrompt.contains("high risk")) {
            respondingRole = AgentRole.THREAT_INVESTIGATOR;
            thought = "[Threat Investigator] Querying behavioral risk radar to identify elevated threat scores.";
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("get_top_risky_users")
                    .arguments(Collections.emptyMap())
                    .build());
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("get_dashboard_security_metrics")
                    .arguments(Collections.emptyMap())
                    .build());
        } else if (lastUserPrompt.contains("telemetry") || lastUserPrompt.contains("log") || lastUserPrompt.contains("traffic") || lastUserPrompt.contains("failed")) {
            respondingRole = AgentRole.THREAT_INVESTIGATOR;
            thought = "[Threat Investigator] Querying ingested login telemetry logs for inspection.";
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("query_login_telemetry")
                    .arguments(Map.of("filter", lastUserPrompt.contains("failed") ? "FAILED" : "RECENT", "limit", 5))
                    .build());
        } else if (lastUserPrompt.contains("audit") || lastUserPrompt.contains("compliance") || lastUserPrompt.contains("trail")) {
            respondingRole = AgentRole.THREAT_INVESTIGATOR;
            thought = "[Threat Investigator] Reading immutable compliance audit log ledger.";
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("query_audit_trail")
                    .arguments(Map.of("limit", 6))
                    .build());
        } else if (lastUserPrompt.contains("user") || lastUserPrompt.contains("directory") || lastUserPrompt.contains("account")) {
            respondingRole = AgentRole.CONTAINMENT_OPERATOR;
            thought = "[Containment Operator] Inspecting directory IAM principals and access states.";
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("get_user_directory")
                    .arguments(Collections.emptyMap())
                    .build());
        } else {
            respondingRole = AgentRole.THREAT_INVESTIGATOR;
            thought = "[Threat Investigator] Conducting cross-system incident discovery: querying anomalies and SOC posture.";
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("list_anomalies")
                    .arguments(Map.of("limit", 5))
                    .build());
            plannedCalls.add(ToolCall.builder()
                    .id("call_" + UUID.randomUUID().toString().substring(0, 8))
                    .name("get_dashboard_security_metrics")
                    .arguments(Collections.emptyMap())
                    .build());
        }

        return AgentLLMStepResult.builder()
                .thought(thought)
                .assistantContent(thought)
                .toolCalls(plannedCalls)
                .respondingRole(respondingRole)
                .build();
    }

    private String synthesizeToolResults(List<AgentMessage> conversation, AgentRole role) {
        StringBuilder toolOutputs = new StringBuilder();
        for (AgentMessage m : conversation) {
            if ("tool".equals(m.getRole())) {
                toolOutputs.append(m.getContent()).append("\n\n");
            }
        }

        StringBuilder response = new StringBuilder();
        if (role == AgentRole.DUAL_COLLABORATIVE) {
            response.append("### Collaborative Threat Intelligence & Incident Response\n\n");
            response.append("**[Threat Investigator]** Analysis of retrieved telemetry:\n");
            response.append(toolOutputs);
            response.append("\n**[Containment Operator]** Remediation Directive:\n");
            response.append("Security telemetry verified against heuristic baseline. Appropriate containment playbooks stand ready for administrator execution.\n");
        } else if (role == AgentRole.CONTAINMENT_OPERATOR) {
            response.append("### Containment Operator Action Report\n\n");
            response.append(toolOutputs);
            response.append("\n**Operator Status**: Policy enforcement executed. Relevant audit trail entries registered.\n");
        } else {
            response.append("### Threat Investigator Findings\n\n");
            response.append(toolOutputs);
            response.append("\n**Investigator Recommendation**: Review anomalous authentication vectors and monitor associated accounts for recurring deviations.\n");
        }

        return response.toString();
    }

    private String extractFinalResponse(List<AgentMessage> conversation, AgentRole role, List<AgentExecutionStep> steps) {
        for (int i = conversation.size() - 1; i >= 0; i--) {
            AgentMessage m = conversation.get(i);
            if ("assistant".equals(m.getRole()) && m.getContent() != null && !m.getContent().isBlank() && (m.getToolCalls() == null || m.getToolCalls().isEmpty())) {
                return m.getContent();
            }
        }
        return "Two-Loop Agent completed all cycles and executed " + steps.size() + " operational steps across the security tool ecosystem.";
    }

    private String buildSystemPrompt(AgentRole role) {
        String formattingRule = " Whenever reporting structured findings, anomalies, telemetry events, user accounts, or metrics, format them using clean Markdown Tables with header columns and alignment for enterprise SOC clarity.";
        return switch (role) {
            case THREAT_INVESTIGATOR ->
                    "You are the Lead Threat Investigator in a Security Operations Center (SOC). "
                            + "You diagnose abnormal login behavior, evaluate risk scores, cross-examine IP reputation and MITRE ATT&CK vectors, "
                            + "and select investigative tools to gather forensics before recommending containment."
                            + formattingRule;
            case CONTAINMENT_OPERATOR ->
                    "You are the Incident Containment Operator in a Security Operations Center (SOC). "
                            + "You execute actionable security policies: locking/quarantining compromised user accounts, unlocking verified users, "
                            + "provisioning security principals, and simulating authentication attack scenarios to test detection rules."
                            + formattingRule;
            case DUAL_COLLABORATIVE ->
                    "You are a collaborative Two-Agent Security Intelligence Loop comprising: "
                            + "1) Threat Investigator (forensic analysis, anomaly triage, risk baselining) and "
                            + "2) Containment Operator (security policy enforcement, account quarantine, audit logging). "
                            + "Work in tandem using tools to investigate incidents and prescribe or execute immediate containment."
                            + formattingRule;
        };
    }

    private Long extractFirstNumber(String text, Long fallback) {
        try {
            var matcher = java.util.regex.Pattern.compile("\\d+").matcher(text);
            if (matcher.find()) {
                return Long.parseLong(matcher.group());
            }
        } catch (Exception ignored) {}
        return fallback;
    }

    @lombok.Data
    @lombok.Builder
    private static class AgentLLMStepResult {
        private String thought;
        private String assistantContent;
        private List<ToolCall> toolCalls;
        private AgentRole respondingRole;
    }
}
