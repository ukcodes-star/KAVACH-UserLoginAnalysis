package com.loginanalysis.agent.model;

public enum AgentRole {
    /**
     * Agent 1: Lead Threat Investigator & Forensic Analyst
     * Specializes in investigating anomalies, assessing risk, and diagnosing threat vectors.
     */
    THREAT_INVESTIGATOR,

    /**
     * Agent 2: Containment & Remediation Operator
     * Specializes in executing actionable security interventions, user account status toggling,
     * provisioning, and attack simulation testing.
     */
    CONTAINMENT_OPERATOR,

    /**
     * Dual-Agent Collaborative Loop
     * Both agents collaborate through the Two-Loop architecture:
     * Investigator diagnoses and decides; Operator enforces containment and simulates responses.
     */
    DUAL_COLLABORATIVE
}
