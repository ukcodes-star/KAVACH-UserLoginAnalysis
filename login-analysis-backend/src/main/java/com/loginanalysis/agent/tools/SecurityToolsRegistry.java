package com.loginanalysis.agent.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.loginanalysis.agent.model.AgentRole;
import com.loginanalysis.agent.model.AgentTool;
import com.loginanalysis.agent.model.AgentToolResult;
import com.loginanalysis.dto.LoginLogRequestDTO;
import com.loginanalysis.dto.UserRequestDTO;
import com.loginanalysis.entity.Anomaly;
import com.loginanalysis.entity.LoginLog;
import com.loginanalysis.entity.LoginStatus;
import com.loginanalysis.entity.Severity;
import com.loginanalysis.repository.AnomalyRepository;
import com.loginanalysis.repository.AuditLogRepository;
import com.loginanalysis.repository.LoginLogRepository;
import com.loginanalysis.repository.UserRepository;
import com.loginanalysis.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise Application Tools Registry for AI Agents
 * Following the AgentTool pattern from recodeLearning (lesson 14):
 * Wraps every single application feature into an executable tool with
 * input schema validation, parallel-safe flags, role assignments, and dual output.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SecurityToolsRegistry {

    private final SecurityDashboardService securityDashboardService;
    private final AnomalyService anomalyService;
    private final AnomalyRepository anomalyRepository;
    private final RiskService riskService;
    private final LoginLogService loginLogService;
    private final LoginLogRepository loginLogRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;
    private final GrokAIService grokAIService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, AgentTool> tools = new ConcurrentHashMap<>();

    @jakarta.annotation.PostConstruct
    public void registerTools() {
        // Tool 1: get_dashboard_security_metrics
        register(new AgentTool() {
            @Override public String getName() { return "get_dashboard_security_metrics"; }
            @Override public String getDescription() { return "Retrieve overall SOC dashboard metrics: total monitored users, anomaly count, risky accounts, failure rate, and 7-day authentication trajectory."; }
            @Override public Map<String, Object> getParameterSchema() { return Map.of("type", "object", "properties", Map.of()); }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    var dash = securityDashboardService.getDashboard();
                    String summary = String.format("""
#### Security Operations Center Posture

| Monitored Users | Total Anomalies | Critical Severity | Risky Accounts | Failed Login Rate |
| :---: | :---: | :---: | :---: | :---: |
| `%d` | `%d` | `%d` | `%d` | `%.1f%%` |

**Authentication Volume**: %d total login attempts (%d successful, %d failed).
""",
                            dash.getTotalUsers(), dash.getTotalAnomalies(), dash.getCriticalAnomalies(), dash.getRiskyUsers(),
                            dash.getFailedLoginRate(), dash.getTotalLogins(), dash.getSuccessfulLogins(), dash.getFailedLogins());
                    return AgentToolResult.success(summary, dash);
                } catch (Exception e) {
                    return AgentToolResult.error("Failed to fetch dashboard metrics: " + e.getMessage());
                }
            }
        });

        // Tool 2: list_anomalies
        register(new AgentTool() {
            @Override public String getName() { return "list_anomalies"; }
            @Override public String getDescription() { return "List recent login anomalies filtered optionally by severity (CRITICAL, HIGH, MEDIUM, LOW) or limit."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "severity", Map.of("type", "string", "enum", List.of("CRITICAL", "HIGH", "MEDIUM", "LOW")),
                        "limit", Map.of("type", "integer", "description", "Maximum records to return (default 10)")
                ));
            }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    String sev = args.get("severity") != null ? args.get("severity").toString().toUpperCase() : null;
                    int limit = args.get("limit") != null ? Integer.parseInt(args.get("limit").toString()) : 10;

                    List<Anomaly> anomalies = anomalyRepository.findAllByOrderByDetectedAtDesc();
                    if (sev != null && !sev.isBlank()) {
                        Severity s = Severity.valueOf(sev);
                        anomalies = anomalies.stream().filter(a -> a.getSeverity() == s).toList();
                    }
                    if (anomalies.size() > limit) {
                        anomalies = anomalies.subList(0, limit);
                    }

                    List<Map<String, Object>> resultList = new ArrayList<>();
                    StringBuilder sb = new StringBuilder();
                    sb.append("#### Detected Incident Anomalies (").append(anomalies.size()).append(" events)\n\n");
                    if (anomalies.isEmpty()) {
                        sb.append("No anomalies detected matching the filter criteria.\n");
                    } else {
                        sb.append("| Anomaly ID | Target User | Violation Type | Severity | Risk Score | Detected At | Description |\n");
                        sb.append("| :---: | :--- | :--- | :---: | :---: | :--- | :--- |\n");
                        for (Anomaly a : anomalies) {
                            Map<String, Object> item = Map.of(
                                    "id", a.getId(),
                                    "username", a.getUser() != null ? a.getUser().getUsername() : "UNKNOWN",
                                    "type", a.getAnomalyType().name(),
                                    "severity", a.getSeverity().name(),
                                    "riskScore", a.getRiskScore(),
                                    "detectedAt", a.getDetectedAt().toString(),
                                    "description", a.getDescription() != null ? a.getDescription() : ""
                            );
                            resultList.add(item);
                            sb.append(String.format("| `#%d` | `@%s` | `%s` | **%s** | `%d/100` | %s | %s |\n",
                                    a.getId(), a.getUser() != null ? a.getUser().getUsername() : "UNKNOWN",
                                    a.getAnomalyType(), a.getSeverity(), a.getRiskScore(), a.getDetectedAt(),
                                    a.getDescription() != null ? a.getDescription().replace("|", "/") : ""));
                        }
                    }
                    return AgentToolResult.success(sb.toString(), resultList);
                } catch (Exception e) {
                    return AgentToolResult.error("Failed to list anomalies: " + e.getMessage());
                }
            }
        });

        // Tool 3: get_anomaly_details
        register(new AgentTool() {
            @Override public String getName() { return "get_anomaly_details"; }
            @Override public String getDescription() { return "Retrieve complete forensics, device headers, originating IP, and metadata for a specific anomaly ID."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "anomalyId", Map.of("type", "integer", "description", "The unique anomaly ID")
                ), "required", List.of("anomalyId"));
            }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    Long id = Long.parseLong(args.get("anomalyId").toString());
                    Anomaly a = anomalyRepository.findById(id).orElse(null);
                    if (a == null) return AgentToolResult.error("Anomaly not found with ID: " + id);

                    Map<String, Object> details = new HashMap<>();
                    details.put("id", a.getId());
                    details.put("username", a.getUser() != null ? a.getUser().getUsername() : "UNKNOWN");
                    details.put("userId", a.getUser() != null ? a.getUser().getId() : null);
                    details.put("anomalyType", a.getAnomalyType().name());
                    details.put("severity", a.getSeverity().name());
                    details.put("riskScore", a.getRiskScore());
                    details.put("description", a.getDescription());
                    details.put("detectedAt", a.getDetectedAt().toString());

                    if (a.getLoginLog() != null) {
                        LoginLog ll = a.getLoginLog();
                        details.put("ipAddress", ll.getIpAddress());
                        details.put("device", ll.getDevice());
                        details.put("location", ll.getLocation());
                        details.put("loginStatus", ll.getStatus().name());
                    }

                    String text = String.format("Anomaly Forensics #%d:\nUser: @%s (UID: %s)\nType: %s\nSeverity: %s\nRisk Score: %d/100\nIP: %s\nDevice: %s\nLocation: %s\nObserved: %s",
                            a.getId(), details.get("username"), details.get("userId"),
                            details.get("anomalyType"), details.get("severity"), details.get("riskScore"),
                            details.getOrDefault("ipAddress", "N/A"), details.getOrDefault("device", "N/A"),
                            details.getOrDefault("location", "N/A"), a.getDescription());

                    return AgentToolResult.success(text, details);
                } catch (Exception e) {
                    return AgentToolResult.error("Error retrieving anomaly details: " + e.getMessage());
                }
            }
        });

        // Tool 4: explain_anomaly
        register(new AgentTool() {
            @Override public String getName() { return "explain_anomaly"; }
            @Override public String getDescription() { return "Run deep AI root-cause analysis on an anomaly to evaluate attack indicators and implications."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "anomalyId", Map.of("type", "integer", "description", "The anomaly ID to explain")
                ), "required", List.of("anomalyId"));
            }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    Long id = Long.parseLong(args.get("anomalyId").toString());
                    var resp = grokAIService.analyzeAnomaly(id);
                    String summary = String.format("AI Threat Analysis for Anomaly #%d:\nThreat Level: %s (Confidence: %s)\nSummary: %s\nRationale: %s",
                            id, resp.getThreatLevel(), resp.getConfidence(), resp.getSummary(), resp.getRiskExplanation());
                    return AgentToolResult.success(summary, resp);
                } catch (Exception e) {
                    return AgentToolResult.error("AI explanation failed: " + e.getMessage());
                }
            }
        });

        // Tool 5: get_user_risk_profile
        register(new AgentTool() {
            @Override public String getName() { return "get_user_risk_profile"; }
            @Override public String getDescription() { return "Calculate and retrieve composite risk score (0-100), risk tier, and anomaly count for a given user ID."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "userId", Map.of("type", "integer", "description", "User ID to assess")
                ), "required", List.of("userId"));
            }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    Long uid = Long.parseLong(args.get("userId").toString());
                    var risk = riskService.calculateUserRisk(uid);
                    String text = String.format("User @%s (#%d) Risk Profile: Composite Score = %d/100 (%s RISK), Anomaly Count = %d.",
                            risk.getUsername(), risk.getUserId(), risk.getRiskScore(), risk.getRiskLevel(), risk.getAnomalyCount());
                    return AgentToolResult.success(text, risk);
                } catch (Exception e) {
                    return AgentToolResult.error("Failed to calculate user risk: " + e.getMessage());
                }
            }
        });

        // Tool 6: get_top_risky_users
        register(new AgentTool() {
            @Override public String getName() { return "get_top_risky_users"; }
            @Override public String getDescription() { return "Get prioritized watchlist of accounts displaying elevated composite anomaly risk scores."; }
            @Override public Map<String, Object> getParameterSchema() { return Map.of("type", "object", "properties", Map.of()); }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    var users = securityDashboardService.getTopRiskyUsers();
                    StringBuilder sb = new StringBuilder();
                    sb.append("#### Prioritized Risky Accounts Watchlist (").append(users.size()).append(" accounts)\n\n");
                    if (users.isEmpty()) {
                        sb.append("No user accounts currently flag on the high-risk radar watchlist.\n");
                    } else {
                        sb.append("| Principal | User ID | Risk Score | Threat Level | Triggered Anomalies |\n");
                        sb.append("| :--- | :---: | :---: | :---: | :---: |\n");
                        for (var u : users) {
                            sb.append(String.format("| `@%s` | `#%d` | `%d/100` | **%s** | `%d events` |\n",
                                    u.getUsername(), u.getUserId(), u.getRiskScore(), u.getRiskLevel(), u.getAnomalyCount()));
                        }
                    }
                    return AgentToolResult.success(sb.toString(), users);
                } catch (Exception e) {
                    return AgentToolResult.error("Failed to query top risky users: " + e.getMessage());
                }
            }
        });

        // Tool 7: query_login_telemetry
        register(new AgentTool() {
            @Override public String getName() { return "query_login_telemetry"; }
            @Override public String getDescription() { return "Query login telemetry logs. Supports filter: ALL, FAILED (unsuccessful logins), or RECENT (past 24h)."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "filter", Map.of("type", "string", "enum", List.of("ALL", "FAILED", "RECENT")),
                        "limit", Map.of("type", "integer", "description", "Maximum items to return")
                ));
            }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    String filter = args.get("filter") != null ? args.get("filter").toString().toUpperCase() : "ALL";
                    int limit = args.get("limit") != null ? Integer.parseInt(args.get("limit").toString()) : 10;

                    List<LoginLog> logs;
                    if ("FAILED".equals(filter)) {
                        logs = loginLogRepository.findByStatusOrderByLoginTimeDesc(LoginStatus.FAILED);
                    } else if ("RECENT".equals(filter)) {
                        logs = loginLogRepository.findByLoginTimeAfterOrderByLoginTimeDesc(LocalDateTime.now().minusHours(24));
                    } else {
                        logs = loginLogRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "loginTime"));
                    }

                    if (logs.size() > limit) logs = logs.subList(0, limit);

                    StringBuilder sb = new StringBuilder();
                    sb.append("#### Ingested Telemetry Logs (").append(filter).append(", count=").append(logs.size()).append(")\n\n");
                    List<Map<String, Object>> logDetails = new ArrayList<>();
                    if (logs.isEmpty()) {
                        sb.append("No telemetry logs found matching filter criteria.\n");
                    } else {
                        sb.append("| Status | Principal | Origin IP | Device / Client | Location | Login Time |\n");
                        sb.append("| :---: | :--- | :---: | :--- | :--- | :--- |\n");
                        for (LoginLog l : logs) {
                            sb.append(String.format("| **%s** | `@%s` | `%s` | %s | %s | %s |\n",
                                    l.getStatus(), l.getUser() != null ? l.getUser().getUsername() : "UNKNOWN",
                                    l.getIpAddress(), l.getDevice(), l.getLocation(), l.getLoginTime()));
                            Map<String, Object> m = new HashMap<>();
                            m.put("id", l.getId());
                            m.put("username", l.getUser() != null ? l.getUser().getUsername() : "UNKNOWN");
                            m.put("status", l.getStatus().name());
                            m.put("ipAddress", l.getIpAddress());
                            m.put("device", l.getDevice());
                            m.put("location", l.getLocation());
                            m.put("loginTime", l.getLoginTime() != null ? l.getLoginTime().toString() : "");
                            logDetails.add(m);
                        }
                    }
                    return AgentToolResult.success(sb.toString(), logDetails);
                } catch (Exception e) {
                    return AgentToolResult.error("Telemetry query failed: " + e.getMessage());
                }
            }
        });

        // Tool 8: simulate_login_event
        register(new AgentTool() {
            @Override public String getName() { return "simulate_login_event"; }
            @Override public String getDescription() { return "Ingest a simulated login event to test heuristics or trigger anomaly rules (e.g. brute force, unusual IP)."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "userId", Map.of("type", "integer", "description", "Target account user ID"),
                        "ipAddress", Map.of("type", "string", "description", "Source IP address"),
                        "device", Map.of("type", "string", "description", "User-Agent or device description"),
                        "location", Map.of("type", "string", "description", "City/Country location"),
                        "status", Map.of("type", "string", "enum", List.of("SUCCESS", "FAILED"))
                ), "required", List.of("userId", "ipAddress", "device", "location", "status"));
            }
            @Override public boolean isParallelSafe() { return false; }
            @Override public AgentRole getAssignedRole() { return AgentRole.CONTAINMENT_OPERATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    Long uid = Long.parseLong(args.get("userId").toString());
                    String ip = args.get("ipAddress").toString();
                    String dev = args.get("device").toString();
                    String loc = args.get("location").toString();
                    LoginStatus st = LoginStatus.valueOf(args.get("status").toString().toUpperCase());

                    LoginLogRequestDTO dto = new LoginLogRequestDTO();
                    dto.setUserId(uid);
                    dto.setIpAddress(ip);
                    dto.setDevice(dev);
                    dto.setLocation(loc);
                    dto.setStatus(st);

                    var resp = loginLogService.createLoginLog(dto);
                    String text = String.format("Simulation event successfully emitted: Log #%d recorded for User #%d (Outcome: %s). Anomaly detection heuristics processed.",
                            resp.getId(), uid, st);
                    return AgentToolResult.success(text, resp);
                } catch (Exception e) {
                    return AgentToolResult.error("Login simulation failed: " + e.getMessage());
                }
            }
        });

        // Tool 9: get_user_directory
        register(new AgentTool() {
            @Override public String getName() { return "get_user_directory"; }
            @Override public String getDescription() { return "List all IAM identity accounts in the user directory with status (ACTIVE vs DISABLED), email, and roles."; }
            @Override public Map<String, Object> getParameterSchema() { return Map.of("type", "object", "properties", Map.of()); }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.CONTAINMENT_OPERATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    var users = userService.getAllUsers();
                    StringBuilder sb = new StringBuilder();
                    sb.append("#### IAM User Directory (").append(users.size()).append(" principals)\n\n");
                    sb.append("| UID | Principal | Email | Status | Access State |\n");
                    sb.append("| :---: | :--- | :--- | :---: | :--- |\n");
                    List<Map<String, Object>> userDetails = new ArrayList<>();
                    for (var u : users) {
                        boolean active = Boolean.TRUE.equals(u.getActive());
                        sb.append(String.format("| `#%d` | `@%s` | `%s` | **%s** | %s |\n",
                                u.getId(), u.getUsername(), u.getEmail(),
                                active ? "ACTIVE" : "QUARANTINED",
                                active ? "Operational" : "Isolated (Locked)"));
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", u.getId());
                        m.put("username", u.getUsername());
                        m.put("email", u.getEmail());
                        m.put("active", active);
                        userDetails.add(m);
                    }
                    return AgentToolResult.success(sb.toString(), userDetails);
                } catch (Exception e) {
                    return AgentToolResult.error("Directory lookup failed: " + e.getMessage());
                }
            }
        });

        // Tool 10: update_user_account_status (Quarantine / Unlock)
        register(new AgentTool() {
            @Override public String getName() { return "update_user_account_status"; }
            @Override public String getDescription() { return "Action tool: Activate or deactivate/quarantine a user account. Used by Operator to contain compromised accounts."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "userId", Map.of("type", "integer", "description", "User ID to update"),
                        "active", Map.of("type", "boolean", "description", "Set true for ACTIVE, false to QUARANTINE/DISABLE"),
                        "reason", Map.of("type", "string", "description", "Incident rationale for action")
                ), "required", List.of("userId", "active"));
            }
            @Override public boolean isParallelSafe() { return false; }
            @Override public AgentRole getAssignedRole() { return AgentRole.CONTAINMENT_OPERATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    Long uid = Long.parseLong(args.get("userId").toString());
                    boolean active = Boolean.parseBoolean(args.get("active").toString());
                    String reason = args.get("reason") != null ? args.get("reason").toString() : "Security Policy Action";

                    var updated = userService.updateUserStatus(uid, active);

                    // Audit event
                    auditLogService.saveAuditLog(
                            updated.getUsername(),
                            active ? "ACCOUNT_UNLOCKED" : "ACCOUNT_QUARANTINED",
                            "Operator Agent updated status to " + (active ? "ACTIVE" : "DISABLED") + ". Reason: " + reason,
                            "127.0.0.1 (Agent Core)"
                    );

                    String text = String.format("SECURITY ACTION EXECUTED: Account @%s (UID: #%d) status set to %s. Audit log entry recorded. Reason: %s.",
                            updated.getUsername(), uid, active ? "ACTIVE" : "QUARANTINED (LOCKED)", reason);
                    Map<String, Object> updatedDetails = Map.of(
                            "id", updated.getId(),
                            "username", updated.getUsername(),
                            "email", updated.getEmail(),
                            "active", Boolean.TRUE.equals(updated.getActive())
                    );
                    return AgentToolResult.success(text, updatedDetails);
                } catch (Exception e) {
                    return AgentToolResult.error("Failed to update user account status: " + e.getMessage());
                }
            }
        });

        // Tool 11: create_directory_user
        register(new AgentTool() {
            @Override public String getName() { return "create_directory_user"; }
            @Override public String getDescription() { return "Action tool: Provision a new security analyst or user account into the directory."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "username", Map.of("type", "string"),
                        "email", Map.of("type", "string"),
                        "password", Map.of("type", "string")
                ), "required", List.of("username", "email", "password"));
            }
            @Override public boolean isParallelSafe() { return false; }
            @Override public AgentRole getAssignedRole() { return AgentRole.CONTAINMENT_OPERATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    String username = args.get("username").toString();
                    String email = args.get("email").toString();
                    String password = args.get("password").toString();

                    UserRequestDTO dto = new UserRequestDTO();
                    dto.setUsername(username);
                    dto.setEmail(email);
                    dto.setPassword(password);

                    var created = userService.createUser(dto);
                    auditLogService.saveAuditLog(username, "USER_PROVISIONED", "Operator Agent provisioned account", "127.0.0.1 (Agent Core)");
                    String text = String.format("User @%s provisioned successfully with UID #%d.", created.getUsername(), created.getId());
                    Map<String, Object> createdDetails = Map.of(
                            "id", created.getId(),
                            "username", created.getUsername(),
                            "email", created.getEmail()
                    );
                    return AgentToolResult.success(text, createdDetails);
                } catch (Exception e) {
                    return AgentToolResult.error("User creation failed: " + e.getMessage());
                }
            }
        });

        // Tool 12: query_audit_trail
        register(new AgentTool() {
            @Override public String getName() { return "query_audit_trail"; }
            @Override public String getDescription() { return "Query immutable compliance audit logs with optional action filter or username."; }
            @Override public Map<String, Object> getParameterSchema() {
                return Map.of("type", "object", "properties", Map.of(
                        "action", Map.of("type", "string", "description", "e.g. ACCOUNT_QUARANTINED, ACCESS_DENIED, USER_PROVISIONED"),
                        "username", Map.of("type", "string", "description", "Filter by username"),
                        "limit", Map.of("type", "integer")
                ));
            }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    String action = args.get("action") != null ? args.get("action").toString() : null;
                    String username = args.get("username") != null ? args.get("username").toString() : null;
                    int limit = args.get("limit") != null ? Integer.parseInt(args.get("limit").toString()) : 10;

                    var logs = auditLogRepository.findAllByOrderByTimestampDesc();
                    if (action != null && !action.isBlank()) {
                        logs = logs.stream().filter(l -> action.equalsIgnoreCase(l.getAction())).toList();
                    }
                    if (username != null && !username.isBlank()) {
                        logs = logs.stream().filter(l -> username.equalsIgnoreCase(l.getUsername())).toList();
                    }
                    if (logs.size() > limit) logs = logs.subList(0, limit);

                    StringBuilder sb = new StringBuilder();
                    sb.append("#### Compliance Audit Trail (").append(logs.size()).append(" records)\n\n");
                    List<Map<String, Object>> auditDetails = new ArrayList<>();
                    if (logs.isEmpty()) {
                        sb.append("No audit trail entries found matching filter criteria.\n");
                    } else {
                        sb.append("| Audit ID | Principal | Action | Details / Scope | Origin IP | Timestamp |\n");
                        sb.append("| :---: | :--- | :--- | :--- | :---: | :--- |\n");
                        for (var l : logs) {
                            sb.append(String.format("| `#%d` | `@%s` | `%s` | %s | `%s` | %s |\n",
                                    l.getId(), l.getUsername() != null ? l.getUsername() : "SYSTEM",
                                    l.getAction(),
                                    l.getDetails() != null ? l.getDetails().replace("|", "/") : "",
                                    l.getIpAddress(), l.getTimestamp()));
                            Map<String, Object> m = new HashMap<>();
                            m.put("id", l.getId());
                            m.put("username", l.getUsername() != null ? l.getUsername() : "SYSTEM");
                            m.put("action", l.getAction());
                            m.put("details", l.getDetails() != null ? l.getDetails() : "");
                            m.put("ipAddress", l.getIpAddress() != null ? l.getIpAddress() : "");
                            m.put("timestamp", l.getTimestamp() != null ? l.getTimestamp().toString() : "");
                            auditDetails.add(m);
                        }
                    }
                    return AgentToolResult.success(sb.toString(), auditDetails);
                } catch (Exception e) {
                    return AgentToolResult.error("Failed to query audit trail: " + e.getMessage());
                }
            }
        });

        // Tool 13: generate_security_summary
        register(new AgentTool() {
            @Override public String getName() { return "generate_security_summary"; }
            @Override public String getDescription() { return "Synthesize system-wide incident posture and generate an executive SOC brief."; }
            @Override public Map<String, Object> getParameterSchema() { return Map.of("type", "object", "properties", Map.of()); }
            @Override public boolean isParallelSafe() { return true; }
            @Override public AgentRole getAssignedRole() { return AgentRole.THREAT_INVESTIGATOR; }
            @Override public AgentToolResult execute(Map<String, Object> args) {
                try {
                    var summary = grokAIService.generateSecuritySummary();
                    String text = String.format("Executive Security Posture Briefing:\nSituation: %s\nSummary: %s\nThreat Level: %s (Confidence: %s)",
                            summary.getOverallSecuritySituation(), summary.getSummary(), summary.getThreatLevel(), summary.getConfidence());
                    return AgentToolResult.success(text, summary);
                } catch (Exception e) {
                    return AgentToolResult.error("Failed to generate security summary: " + e.getMessage());
                }
            }
        });

        log.info("Initialized SecurityToolsRegistry with {} active application tools.", tools.size());
    }

    private void register(AgentTool tool) {
        tools.put(tool.getName(), tool);
    }

    public AgentTool getTool(String name) {
        return tools.get(name);
    }

    public Collection<AgentTool> getAllTools() {
        return tools.values();
    }

    public List<AgentTool> getToolsForRole(AgentRole role) {
        if (role == AgentRole.DUAL_COLLABORATIVE) {
            return new ArrayList<>(tools.values());
        }
        return tools.values().stream()
                .filter(t -> t.getAssignedRole() == role || t.getAssignedRole() == null)
                .toList();
    }
}
