package com.loginanalysis.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.loginanalysis.config.GrokConfig;
import com.loginanalysis.dto.*;
import com.loginanalysis.entity.*;
import com.loginanalysis.exception.ResourceNotFoundException;
import com.loginanalysis.repository.AIAnalysisRepository;
import com.loginanalysis.repository.AnomalyRepository;
import com.loginanalysis.repository.LoginLogRepository;
import com.loginanalysis.repository.UserRepository;
import com.loginanalysis.util.GrokClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GrokAIService {

    private final AnomalyRepository anomalyRepository;
    private final UserRepository userRepository;
    private final LoginLogRepository loginLogRepository;
    private final AIAnalysisRepository aiAnalysisRepository;
    private final GrokConfig grokConfig;
    private final GrokClient grokClient;
    private final UserAuthorizationService userAuthorizationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GrokStatusDTO getStatus() {
        boolean available = grokClient.isAvailable();
        return GrokStatusDTO.builder()
                .live(available)
                .model(grokConfig.getEffectiveModel())
                .message(available
                        ? "xAI Grok AI integration active (" + grokConfig.getEffectiveModel() + ")."
                        : "xAI Grok AI in simulation mode. Configure XAI_API_KEY in .env to enable live inference.")
                .build();
    }

    /**
     * Feature A & B: Anomaly Explanation and Security Recommendations
     * Explains the anomaly, outlines suspicious indicators, potential security implications,
     * and recommends administrator-approval required remediation actions.
     */
    @Transactional
    public AIAnalysisResponseDTO analyzeAnomaly(Long anomalyId) {
        Anomaly anomaly = anomalyRepository.findById(anomalyId)
                .orElseThrow(() -> new ResourceNotFoundException("Anomaly not found with id: " + anomalyId));

        // Authorization check: User can only analyze their own anomaly; Admin can analyze any
        userAuthorizationService.checkUserAccess(anomaly.getUser().getId());

        AIAnalysisResponseDTO responseDTO;

        if (grokClient.isAvailable()) {
            try {
                String systemPrompt = "You are Grok CyberCop, an expert cybersecurity threat analysis intelligence system. "
                        + "Analyze the following authentication anomaly. "
                        + "You MUST return ONLY a valid, raw JSON object (no markdown fences, no explanatory text outside JSON) with this exact schema:\n"
                        + "{\n"
                        + "  \"summary\": \"Concise incident overview\",\n"
                        + "  \"riskExplanation\": \"Detailed explanation of why this activity is suspicious and potential threat vectors\",\n"
                        + "  \"suspiciousIndicators\": [\"Indicator 1\", \"Indicator 2\"],\n"
                        + "  \"potentialSecurityImplications\": [\"Implication 1\", \"Implication 2\"],\n"
                        + "  \"recommendations\": [\"Actionable advisory recommendation 1\", \"Actionable advisory recommendation 2\"],\n"
                        + "  \"confidence\": \"HIGH\"\n"
                        + "}\n"
                        + "Rules: Never execute actions; recommendations are advisory for administrators. Do not invent passwords or tokens.";

                String userPrompt = buildSanitizedAnomalyPrompt(anomaly);
                String rawAiResponse = grokClient.chatCompletion(systemPrompt, userPrompt);

                responseDTO = parseAndValidateAnomalyResponse(rawAiResponse, anomaly);
            } catch (Exception e) {
                log.warn("xAI Grok API invocation failed for anomaly [{}]: {}. Engaging deterministic advisory fallback.",
                        anomalyId, e.getMessage());
                responseDTO = buildFallbackAnomalyAnalysis(anomaly);
            }
        } else {
            log.info("xAI Grok is not live. Using deterministic security advisory fallback for anomaly [{}].", anomalyId);
            responseDTO = buildFallbackAnomalyAnalysis(anomaly);
        }

        // Feature D: Persist AI Analysis History in PostgreSQL
        try {
            AIAnalysisHistory history = AIAnalysisHistory.builder()
                    .anomaly(anomaly)
                    .user(anomaly.getUser())
                    .cachedAnomalyId(anomaly.getId())
                    .cachedUserId(anomaly.getUser().getId())
                    .username(anomaly.getUser().getUsername())
                    .analysisType("ANOMALY_EXPLANATION")
                    .summary(responseDTO.getSummary())
                    .riskExplanation(responseDTO.getRiskExplanation())
                    .indicatorsJson(objectMapper.writeValueAsString(responseDTO.getSuspiciousIndicators()))
                    .recommendationsJson(objectMapper.writeValueAsString(responseDTO.getRecommendations()))
                    .confidence(responseDTO.getConfidence())
                    .threatLevel(responseDTO.getThreatLevel())
                    .model(responseDTO.getModel())
                    .isAdvisory(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            AIAnalysisHistory saved = aiAnalysisRepository.save(history);
            responseDTO.setId(saved.getId());
        } catch (Exception ex) {
            log.error("Failed to persist AI analysis history: {}", ex.getMessage());
        }

        return responseDTO;
    }

    /**
     * Feature C: Security Incident Summary
     * Generates an executive security posture summary across recent anomalies.
     */
    @Transactional
    public AISecuritySummaryResponseDTO generateSecuritySummary() {
        // Enforce administrator access
        if (!userAuthorizationService.isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("Administrator role required to generate system-wide security summary.");
        }

        List<Anomaly> recentAnomalies = anomalyRepository.findAllByOrderByDetectedAtDesc().stream().limit(15).toList();
        long totalUsers = userRepository.count();

        AISecuritySummaryResponseDTO summaryDTO;

        if (grokClient.isAvailable()) {
            try {
                String systemPrompt = "You are Grok CyberCop SOC Lead. Analyze the recent security incident anomalies across the system. "
                        + "You MUST return ONLY a valid raw JSON object (no markdown code blocks, no text outside JSON) with this exact schema:\n"
                        + "{\n"
                        + "  \"overallSecuritySituation\": \"High-level assessment of current system exposure and threat level\",\n"
                        + "  \"summary\": \"Executive summary of recent detected authentication incidents\",\n"
                        + "  \"mostImportantThreats\": [\"Key threat vector 1\", \"Key threat vector 2\"],\n"
                        + "  \"commonSuspiciousPatterns\": [\"Pattern 1\", \"Pattern 2\"],\n"
                        + "  \"investigationPriorities\": [\"Priority 1\", \"Priority 2\"],\n"
                        + "  \"recommendedActions\": [\"Admin recommendation 1\", \"Admin recommendation 2\"],\n"
                        + "  \"confidence\": \"HIGH\",\n"
                        + "  \"threatLevel\": \"HIGH\"\n"
                        + "}\n"
                        + "All recommendations are strictly advisory and require administrator review.";

                String userPrompt = buildSanitizedSecuritySummaryPrompt(recentAnomalies, totalUsers);
                String rawAiResponse = grokClient.chatCompletion(systemPrompt, userPrompt);

                summaryDTO = parseAndValidateSummaryResponse(rawAiResponse, recentAnomalies.size());
            } catch (Exception e) {
                log.warn("xAI Grok summary call failed: {}. Engaging deterministic summary fallback.", e.getMessage());
                summaryDTO = buildFallbackSecuritySummary(recentAnomalies, totalUsers);
            }
        } else {
            summaryDTO = buildFallbackSecuritySummary(recentAnomalies, totalUsers);
        }

        // Persist incident summary in history
        try {
            User adminUser = userAuthorizationService.getCurrentUser();
            AIAnalysisHistory history = AIAnalysisHistory.builder()
                    .user(adminUser)
                    .cachedUserId(adminUser != null ? adminUser.getId() : null)
                    .username(adminUser != null ? adminUser.getUsername() : "ADMIN")
                    .analysisType("SECURITY_SUMMARY")
                    .summary(summaryDTO.getSummary())
                    .riskExplanation(summaryDTO.getOverallSecuritySituation())
                    .indicatorsJson(objectMapper.writeValueAsString(summaryDTO.getCommonSuspiciousPatterns()))
                    .recommendationsJson(objectMapper.writeValueAsString(summaryDTO.getRecommendedActions()))
                    .confidence(summaryDTO.getConfidence())
                    .threatLevel(summaryDTO.getThreatLevel())
                    .model(summaryDTO.getModel())
                    .isAdvisory(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            AIAnalysisHistory saved = aiAnalysisRepository.save(history);
            summaryDTO.setId(saved.getId());
        } catch (Exception ex) {
            log.error("Failed to persist security summary in history: {}", ex.getMessage());
        }

        return summaryDTO;
    }

    /**
     * Feature D: Retrieve Analysis History (Paginated)
     */
    public Page<AIAnalysisResponseDTO> getAnalysisHistory(Pageable pageable) {
        User currentUser = userAuthorizationService.getCurrentUser();
        Page<AIAnalysisHistory> page;

        if (currentUser.getRole() == UserRole.ADMIN) {
            page = aiAnalysisRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            page = aiAnalysisRepository.findByCachedUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable);
        }

        return page.map(this::mapHistoryToResponseDTO);
    }

    /**
     * Feature D: Retrieve Specific Analysis Record by ID
     */
    public AIAnalysisResponseDTO getAnalysisById(Long id) {
        AIAnalysisHistory history = aiAnalysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AI Analysis record not found with id: " + id));

        if (history.getCachedUserId() != null) {
            userAuthorizationService.checkUserAccess(history.getCachedUserId());
        }

        return mapHistoryToResponseDTO(history);
    }

    /**
     * Behavioral risk assessment for a specific user account.
     */
    @Transactional
    public GrokAnalysisResponseDTO analyzeUserRisk(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        userAuthorizationService.checkUserAccess(userId);

        List<Anomaly> userAnomalies = anomalyRepository.findByUserIdOrderByDetectedAtDesc(userId);
        List<LoginLog> recentLogs = loginLogRepository.findByUserIdOrderByLoginTimeDesc(userId);

        if (grokClient.isAvailable()) {
            try {
                String systemPrompt = "You are Grok CyberCop, an AI threat intelligence specialist. Perform a comprehensive identity and behavioral risk analysis for this account. Assess likelihood of account compromise, insider threat, or credential harvesting. Provide an executive summary and mitigation guidance in markdown.";
                String userPrompt = "User: " + sanitize(user.getUsername()) + " (ID: " + user.getId() + ")\n"
                        + "Total Anomalies: " + userAnomalies.size() + "\n"
                        + "Recent Anomaly Sample: " + userAnomalies.stream().limit(5).map(a -> a.getAnomalyType().name() + " (" + a.getSeverity() + ")").toList() + "\n"
                        + "Recent Logins Count: " + recentLogs.size();

                String aiText = grokClient.chatCompletion(systemPrompt, userPrompt);

                return GrokAnalysisResponseDTO.builder()
                        .status("LIVE")
                        .model(grokConfig.getEffectiveModel())
                        .threatLevel(userAnomalies.stream().anyMatch(a -> a.getSeverity() == Severity.CRITICAL) ? "CRITICAL" : "HIGH")
                        .summary("Grok AI Behavioral Risk Evaluation for @" + user.getUsername())
                        .detailedAnalysis(aiText)
                        .mitreAttackTactics(List.of("T1078 - Valid Accounts", "T1087 - Account Discovery", "T1110 - Brute Force"))
                        .recommendedActions(List.of(
                                "Enforce immediate MFA re-verification",
                                "Revoke active session tokens",
                                "Inspect originating IP subnets"
                        ))
                        .generatedAt(LocalDateTime.now())
                        .build();
            } catch (Exception e) {
                log.warn("Live Grok user analysis error: {}", e.getMessage());
            }
        }

        return GrokAnalysisResponseDTO.builder()
                .status("SIMULATED")
                .model("xAI-Grok-Advisory-Engine")
                .threatLevel(userAnomalies.isEmpty() ? "LOW" : "MEDIUM")
                .summary("Deterministic Behavioral Risk Evaluation for @" + user.getUsername())
                .detailedAnalysis("### Behavioral Baseline Assessment\nAccount @" + user.getUsername() + " exhibits " + userAnomalies.size() + " recorded anomalies across " + recentLogs.size() + " total login events.")
                .mitreAttackTactics(List.of("T1078 - Valid Accounts"))
                .recommendedActions(List.of("Monitor subsequent authentication events", "Verify user profile settings"))
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Interactive cybersecurity analyst chat assistant.
     */
    public GrokChatResponseDTO chatWithSecurityAssistant(GrokChatRequestDTO request) {
        if (grokClient.isAvailable()) {
            try {
                String systemPrompt = "You are Grok CyberCop, an AI cybersecurity assistant integrated into an enterprise Login Security & Anomaly Detection system. "
                        + "You assist SOC analysts in identifying attacks, diagnosing abnormal login behavior, interpreting MITRE ATT&CK techniques, and drafting containment steps. "
                        + "Respond clearly, professionally, and concisely using markdown. Do not execute commands.";

                String userPrompt = sanitize(request.getPrompt());
                if (request.getContext() != null && !request.getContext().isBlank()) {
                    userPrompt = "Context:\n" + sanitize(request.getContext()) + "\n\nAnalyst Question:\n" + userPrompt;
                }

                String response = grokClient.chatCompletion(systemPrompt, userPrompt);

                return GrokChatResponseDTO.builder()
                        .response(response)
                        .model(grokConfig.getEffectiveModel())
                        .mode("LIVE")
                        .timestamp(LocalDateTime.now())
                        .build();
            } catch (Exception e) {
                log.warn("Live Grok chat failed: {}", e.getMessage());
            }
        }

        return GrokChatResponseDTO.builder()
                .response("I am currently in advisory fallback mode. All heuristic anomaly tracking and security logging remain fully operational.")
                .model("xAI-Grok-Advisory-Engine")
                .mode("SIMULATED")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // =========================================================================
    // SANITIZATION AND PROMPT BUILDING (Prevents Prompt Injection & Data Leakage)
    // =========================================================================

    private String sanitize(String input) {
        if (input == null) return "";
        return input.replaceAll("[\\r\\n]+", " ")
                .replace("```", "")
                .replace("<|im_start|>", "")
                .replace("<|im_end|>", "")
                .trim();
    }

    private String buildSanitizedAnomalyPrompt(Anomaly anomaly) {
        StringBuilder sb = new StringBuilder();
        sb.append("ANOMALY_ID: ").append(anomaly.getId()).append("\n");
        sb.append("ANOMALY_TYPE: ").append(anomaly.getAnomalyType()).append("\n");
        sb.append("SEVERITY: ").append(anomaly.getSeverity()).append("\n");
        sb.append("RISK_SCORE: ").append(anomaly.getRiskScore()).append(" out of 100\n");
        sb.append("DETECTED_AT: ").append(anomaly.getDetectedAt()).append("\n");
        sb.append("SYSTEM_FLAG: ").append(sanitize(anomaly.getDescription())).append("\n");

        if (anomaly.getLoginLog() != null) {
            LoginLog log = anomaly.getLoginLog();
            sb.append("LOGIN_METADATA:\n");
            sb.append("  - IP_ADDRESS: ").append(sanitize(log.getIpAddress())).append("\n");
            sb.append("  - DEVICE: ").append(sanitize(log.getDevice())).append("\n");
            sb.append("  - LOCATION: ").append(sanitize(log.getLocation())).append("\n");
            sb.append("  - STATUS: ").append(log.getStatus()).append("\n");
        }

        sb.append("INSTRUCTIONS: Provide structured risk explanation, suspicious indicators, implications, and advisory recommendations.");
        return sb.toString();
    }

    private String buildSanitizedSecuritySummaryPrompt(List<Anomaly> anomalies, long totalUsers) {
        StringBuilder sb = new StringBuilder();
        sb.append("MONITORED_ACCOUNTS: ").append(totalUsers).append("\n");
        sb.append("RECENT_ANOMALIES_SAMPLE_COUNT: ").append(anomalies.size()).append("\n");
        sb.append("INCIDENT_STREAM:\n");
        for (Anomaly a : anomalies) {
            sb.append("  * ").append(a.getAnomalyType()).append(" | Severity: ").append(a.getSeverity())
                    .append(" | Risk: ").append(a.getRiskScore()).append("/100 | Flag: ").append(sanitize(a.getDescription())).append("\n");
        }
        sb.append("INSTRUCTIONS: Summarize overall threat landscape, patterns, and advisory recommendations.");
        return sb.toString();
    }

    // =========================================================================
    // PARSING, VALIDATION AND FALLBACKS
    // =========================================================================

    private AIAnalysisResponseDTO parseAndValidateAnomalyResponse(String rawResponse, Anomaly anomaly) {
        try {
            String cleanedJson = cleanJsonContent(rawResponse);
            JsonNode root = objectMapper.readTree(cleanedJson);

            String summary = root.path("summary").asText(anomaly.getDescription());
            String riskExplanation = root.path("riskExplanation").asText(
                    "Behavioral deviation detected matching " + anomaly.getAnomalyType() + " with risk score " + anomaly.getRiskScore() + "/100.");

            List<String> indicators = extractJsonStringList(root.path("suspiciousIndicators"));
            if (indicators.isEmpty()) {
                indicators = defaultIndicators(anomaly.getAnomalyType());
            }

            List<String> implications = extractJsonStringList(root.path("potentialSecurityImplications"));
            if (implications.isEmpty()) {
                implications = List.of("Potential unauthorized account access", "Risk of credential exposure");
            }

            List<String> recommendations = extractJsonStringList(root.path("recommendations"));
            if (recommendations.isEmpty()) {
                recommendations = defaultRecommendations(anomaly.getAnomalyType());
            }

            String confidence = root.path("confidence").asText("HIGH").toUpperCase();
            if (!Set.of("LOW", "MEDIUM", "HIGH").contains(confidence)) {
                confidence = "MEDIUM";
            }

            return AIAnalysisResponseDTO.builder()
                    .anomalyId(anomaly.getId())
                    .summary(summary)
                    .riskExplanation(riskExplanation)
                    .suspiciousIndicators(indicators)
                    .potentialSecurityImplications(implications)
                    .recommendations(recommendations)
                    .confidence(confidence)
                    .threatLevel(anomaly.getSeverity().name())
                    .model(grokConfig.getEffectiveModel())
                    .advisory(true)
                    .generatedAt(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse JSON response from Grok: {}. Using deterministic parsing fallback.", e.getMessage());
            return buildFallbackAnomalyAnalysis(anomaly);
        }
    }

    private AISecuritySummaryResponseDTO parseAndValidateSummaryResponse(String rawResponse, int analyzedCount) {
        try {
            String cleanedJson = cleanJsonContent(rawResponse);
            JsonNode root = objectMapper.readTree(cleanedJson);

            String overall = root.path("overallSecuritySituation").asText("Moderate security exposure with active anomaly monitoring.");
            String summary = root.path("summary").asText("SOC security audit evaluated " + analyzedCount + " recent incident signals.");

            List<String> threats = extractJsonStringList(root.path("mostImportantThreats"));
            if (threats.isEmpty()) threats = List.of("Credential brute force attempts", "Unusual geographic access vectors");

            List<String> patterns = extractJsonStringList(root.path("commonSuspiciousPatterns"));
            if (patterns.isEmpty()) patterns = List.of("Off-hours authentication attempts", "New device logins");

            List<String> priorities = extractJsonStringList(root.path("investigationPriorities"));
            if (priorities.isEmpty()) priorities = List.of("Investigate high-risk source IP addresses", "Audit dormant accounts");

            List<String> recommendations = extractJsonStringList(root.path("recommendedActions"));
            if (recommendations.isEmpty()) recommendations = List.of("Enforce MFA verification", "Verify abnormal IP ranges");

            String confidence = root.path("confidence").asText("HIGH");
            String threatLevel = root.path("threatLevel").asText("MEDIUM");

            return AISecuritySummaryResponseDTO.builder()
                    .totalAnomaliesAnalyzed(analyzedCount)
                    .overallSecuritySituation(overall)
                    .summary(summary)
                    .mostImportantThreats(threats)
                    .commonSuspiciousPatterns(patterns)
                    .investigationPriorities(priorities)
                    .recommendedActions(recommendations)
                    .confidence(confidence)
                    .threatLevel(threatLevel)
                    .model(grokConfig.getEffectiveModel())
                    .advisory(true)
                    .generatedAt(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse security summary from Grok: {}. Using fallback summary.", e.getMessage());
            return buildFallbackSecuritySummary(Collections.emptyList(), 0);
        }
    }

    private String cleanJsonContent(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private List<String> extractJsonStringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) {
                if (item.isTextual() && !item.asText().isBlank()) {
                    list.add(item.asText().trim());
                }
            }
        }
        return list;
    }

    private AIAnalysisResponseDTO buildFallbackAnomalyAnalysis(Anomaly anomaly) {
        AnomalyType type = anomaly.getAnomalyType();
        String summary = "Automated advisory security evaluation for " + type + " (Risk Score: " + anomaly.getRiskScore() + "/100).";
        String explanation = switch (type) {
            case BRUTE_FORCE -> "Multiple rapid failed authentication attempts detected within a condensed timeframe, typical of automated password guessing or dictionary attacks.";
            case FAILED_LOGIN -> "Authentication attempt failed. Repeated occurrences may indicate unauthorized discovery or forgotten credentials.";
            case UNUSUAL_LOGIN_TIME -> "Login occurred outside normal operating hours, representing a temporal deviation from typical user behavioral patterns.";
            case NEW_IP -> "Authentication request originated from an unrecognized IP address subnet not previously observed for this user.";
            case NEW_DEVICE -> "Login attempt recorded from a new browser or device fingerprint, indicating potential session roaming or third-party access.";
            case INACTIVE_USER_LOGIN -> "Authentication event on an account that had been dormant for an extended period, which can be an indicator of dormant account takeover.";
        };

        return AIAnalysisResponseDTO.builder()
                .anomalyId(anomaly.getId())
                .summary(summary)
                .riskExplanation(explanation)
                .suspiciousIndicators(defaultIndicators(type))
                .potentialSecurityImplications(List.of(
                        "Risk of unauthorized account access",
                        "Potential reconnaissance or credential compromise"
                ))
                .recommendations(defaultRecommendations(type))
                .confidence("HIGH")
                .threatLevel(anomaly.getSeverity().name())
                .model("xAI-Grok-Advisory-Engine")
                .advisory(true)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private AISecuritySummaryResponseDTO buildFallbackSecuritySummary(List<Anomaly> anomalies, long totalUsers) {
        boolean hasCritical = anomalies.stream().anyMatch(a -> a.getSeverity() == Severity.CRITICAL);
        String threatLevel = hasCritical ? "CRITICAL" : (anomalies.isEmpty() ? "LOW" : "HIGH");

        return AISecuritySummaryResponseDTO.builder()
                .totalAnomaliesAnalyzed(anomalies.size())
                .overallSecuritySituation("System is actively monitoring " + totalUsers + " user accounts. "
                        + (anomalies.isEmpty() ? "No critical security anomalies detected." : anomalies.size() + " security anomalies recorded."))
                .summary("Periodic SOC posture assessment: Heuristic anomaly engine is continuously tracking login deviations.")
                .mostImportantThreats(List.of(
                        "Automated credential brute-force attempts",
                        "Anomalous off-hours authentications",
                        "Unrecognized foreign IP addresses"
                ))
                .commonSuspiciousPatterns(List.of(
                        "Repeated failed logins followed by successful login",
                        "Simultaneous logins from distinct IP addresses"
                ))
                .investigationPriorities(List.of(
                        "Review source IP addresses flagged with risk score > 70",
                        "Verify users with repeated failed login records",
                        "Audit dormant user accounts showing recent activity"
                ))
                .recommendedActions(List.of(
                        "Require Multi-Factor Authentication (MFA) for flagged users",
                        "Implement temporary rate limits on repeated login failures",
                        "Review security event audit logs"
                ))
                .confidence("HIGH")
                .threatLevel(threatLevel)
                .model("xAI-Grok-Advisory-Engine")
                .advisory(true)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private List<String> defaultIndicators(AnomalyType type) {
        return switch (type) {
            case BRUTE_FORCE -> List.of("High frequency of failed attempts within 10 minutes", "Potential credential stuffing tool");
            case FAILED_LOGIN -> List.of("Invalid credential verification", "Single authentication failure event");
            case UNUSUAL_LOGIN_TIME -> List.of("Login outside historical 7-day active time window", "Off-hours system interaction");
            case NEW_IP -> List.of("Unseen client IP address", "Different geographic geolocation");
            case NEW_DEVICE -> List.of("Unrecognized User-Agent string", "New browser fingerprint");
            case INACTIVE_USER_LOGIN -> List.of("Account dormant over 30 days", "Sudden reactivation without prior notification");
        };
    }

    private List<String> defaultRecommendations(AnomalyType type) {
        return switch (type) {
            case BRUTE_FORCE -> List.of(
                    "Investigate and consider rate-limiting or blocking the source IP",
                    "Notify the user and prompt for an adaptive password reset",
                    "Enforce Multi-Factor Authentication (MFA)"
            );
            case FAILED_LOGIN -> List.of(
                    "Monitor for subsequent failed attempts on this username",
                    "Verify if user reported forgotten password"
            );
            case UNUSUAL_LOGIN_TIME -> List.of(
                    "Cross-check if user was traveling or working remotely",
                    "Verify recent user actions in the audit log"
            );
            case NEW_IP -> List.of(
                    "Investigate source IP reputation and Autonomous System (ASN)",
                    "Confirm with user if the login was recognized"
            );
            case NEW_DEVICE -> List.of(
                    "Verify device identity with account owner",
                    "Revoke existing active sessions if unconfirmed"
            );
            case INACTIVE_USER_LOGIN -> List.of(
                    "Confirm legitimacy of account reactivation with account owner",
                    "Verify privileged access permissions"
            );
        };
    }

    private AIAnalysisResponseDTO mapHistoryToResponseDTO(AIAnalysisHistory history) {
        List<String> indicators = Collections.emptyList();
        List<String> recommendations = Collections.emptyList();

        try {
            if (history.getIndicatorsJson() != null && !history.getIndicatorsJson().isBlank()) {
                indicators = objectMapper.readValue(history.getIndicatorsJson(), new TypeReference<List<String>>() {});
            }
        } catch (Exception ignored) {}

        try {
            if (history.getRecommendationsJson() != null && !history.getRecommendationsJson().isBlank()) {
                recommendations = objectMapper.readValue(history.getRecommendationsJson(), new TypeReference<List<String>>() {});
            }
        } catch (Exception ignored) {}

        return AIAnalysisResponseDTO.builder()
                .id(history.getId())
                .anomalyId(history.getCachedAnomalyId())
                .summary(history.getSummary())
                .riskExplanation(history.getRiskExplanation())
                .suspiciousIndicators(indicators)
                .potentialSecurityImplications(List.of("Advisory threat intelligence evaluation recorded in security audit."))
                .recommendations(recommendations)
                .confidence(history.getConfidence())
                .threatLevel(history.getThreatLevel())
                .model(history.getModel())
                .advisory(Boolean.TRUE.equals(history.getIsAdvisory()))
                .disclaimer("AI-generated cybersecurity analysis is advisory only. Consequential security actions require administrator approval.")
                .generatedAt(history.getCreatedAt())
                .build();
    }
}
