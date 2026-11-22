package com.loginanalysis.controller;

import com.loginanalysis.agent.TwoLoopAgentService;
import com.loginanalysis.agent.model.AgentTool;
import com.loginanalysis.agent.tools.SecurityToolsRegistry;
import com.loginanalysis.dto.*;
import com.loginanalysis.service.GrokAIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AIAnalysisController {

    private final GrokAIService grokAiService;
    private final TwoLoopAgentService twoLoopAgentService;
    private final SecurityToolsRegistry securityToolsRegistry;

    /**
     * Health and model readiness status check.
     */
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<GrokStatusDTO> getStatus() {
        return ResponseEntity.ok(grokAiService.getStatus());
    }

    /**
     * Feature A & B: AI Anomaly Explanation and Advisory Security Recommendations.
     */
    @PostMapping({"/analyze/anomaly/{anomalyId}", "/analyze-anomaly/{anomalyId}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<AIAnalysisResponseDTO> analyzeAnomaly(@PathVariable Long anomalyId) {
        return ResponseEntity.ok(grokAiService.analyzeAnomaly(anomalyId));
    }

    /**
     * Feature C: Executive Security Incident Summary across recent anomalies.
     */
    @RequestMapping(value = {"/analyze/security-summary", "/summary"}, method = {RequestMethod.POST, RequestMethod.GET})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AISecuritySummaryResponseDTO> generateSecuritySummary() {
        return ResponseEntity.ok(grokAiService.generateSecuritySummary());
    }

    /**
     * Feature D: AI Analysis History (Paginated).
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<AIAnalysisResponseDTO>> getHistory(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(grokAiService.getAnalysisHistory(pageable));
    }

    /**
     * Feature D: Retrieve specific historical analysis record by ID.
     */
    @GetMapping("/history/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<AIAnalysisResponseDTO> getHistoryById(@PathVariable Long id) {
        return ResponseEntity.ok(grokAiService.getAnalysisById(id));
    }

    /**
     * Behavioral risk assessment for a specific user account.
     */
    @PostMapping("/analyze-user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<GrokAnalysisResponseDTO> analyzeUser(@PathVariable Long userId) {
        return ResponseEntity.ok(grokAiService.analyzeUserRisk(userId));
    }

    /**
     * Interactive Two-Loop Agent endpoint (Following recodeLearning lesson 17 & 14 architecture).
     * Supports steering queues, follow-up queues, and execution of all 13 application tools!
     */
    @PostMapping("/agent-loop")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<AgentLoopResponseDTO> runAgentLoop(@Valid @RequestBody AgentLoopRequestDTO request) {
        return ResponseEntity.ok(twoLoopAgentService.runTwoLoopAgent(request));
    }

    /**
     * Lists all registered application tools available for agent execution.
     */
    @GetMapping("/agent-tools")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Map<String, Object>>> getAgentTools() {
        List<Map<String, Object>> list = securityToolsRegistry.getAllTools().stream()
                .map(t -> Map.of(
                        "name", (Object) t.getName(),
                        "description", t.getDescription(),
                        "parameters", t.getParameterSchema(),
                        "assignedRole", t.getAssignedRole() != null ? t.getAssignedRole().name() : "ALL",
                        "parallelSafe", t.isParallelSafe()
                ))
                .toList();
        return ResponseEntity.ok(list);
    }

    /**
     * Interactive cybersecurity analyst chat assistant (enhanced to use the Two-Loop Agent).
     */
    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<GrokChatResponseDTO> chat(@Valid @RequestBody GrokChatRequestDTO request) {
        // Run Two-Loop Agent with all tools
        AgentLoopRequestDTO loopRequest = AgentLoopRequestDTO.builder()
                .prompt(request.getPrompt())
                .context(request.getContext())
                .build();
        AgentLoopResponseDTO loopResponse = twoLoopAgentService.runTwoLoopAgent(loopRequest);

        return ResponseEntity.ok(GrokChatResponseDTO.builder()
                .response(loopResponse.getFinalResponse())
                .model(loopResponse.getModel())
                .mode(loopResponse.getMode())
                .timestamp(loopResponse.getCompletedAt())
                .build());
    }
}
