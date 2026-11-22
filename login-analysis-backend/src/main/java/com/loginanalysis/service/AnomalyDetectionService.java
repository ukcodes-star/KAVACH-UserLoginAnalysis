package com.loginanalysis.service;

import com.loginanalysis.entity.*;
import com.loginanalysis.repository.AnomalyRepository;
import com.loginanalysis.repository.LoginLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.loginanalysis.entity.AnomalyType;
import com.loginanalysis.entity.Severity;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnomalyDetectionService {

    private final AnomalyRepository anomalyRepository;
    private final LoginLogRepository loginLogRepository;


    // =========================================================
    // MAIN ANALYSIS METHOD
    // =========================================================

    public void analyzeLogin(LoginLog loginLog) {

        System.out.println();
        System.out.println("========================================");
        System.out.println("     ANOMALY DETECTION STARTED");
        System.out.println("========================================");

        detectFailedLogin(loginLog);

        detectUnusualLoginTime(loginLog);

        detectInactiveUser(loginLog);

        detectNewIp(loginLog);

        detectNewDevice(loginLog);

        detectBruteForce(loginLog);

        System.out.println("========================================");
        System.out.println("     ANOMALY DETECTION COMPLETED");
        System.out.println("========================================");
        System.out.println();
    }

    private void detectNewIp(LoginLog loginLog) {

        List<LoginLog> previousLogs =
                loginLogRepository
                        .findByUserIdOrderByLoginTimeDesc(
                                loginLog.getUser().getId()
                        );

        boolean previousIpFound = previousLogs.stream()
                .anyMatch(previousLog ->
                        !previousLog.getId().equals(loginLog.getId())
                                && previousLog.getIpAddress() != null
                                && previousLog.getIpAddress()
                                .equals(loginLog.getIpAddress())
                );

        if (previousLogs.size() > 1
                && !previousIpFound) {

            saveAnomaly(
                    loginLog,
                    AnomalyType.NEW_IP,
                    "Login detected from a previously unseen IP address",
                    40,
                    Severity.MEDIUM
            );
        }
    }


    private void detectNewDevice(LoginLog loginLog) {

        List<LoginLog> previousLogs =
                loginLogRepository
                        .findByUserIdOrderByLoginTimeDesc(
                                loginLog.getUser().getId()
                        );

        boolean previousDeviceFound = previousLogs.stream()
                .anyMatch(previousLog ->
                        !previousLog.getId().equals(loginLog.getId())
                                && previousLog.getDevice() != null
                                && previousLog.getDevice()
                                .equalsIgnoreCase(
                                        loginLog.getDevice()
                                )
                );

        if (previousLogs.size() > 1
                && !previousDeviceFound) {

            saveAnomaly(
                    loginLog,
                    AnomalyType.NEW_DEVICE,
                    "Login detected from a previously unseen device",
                    30,
                    Severity.MEDIUM
            );
        }
    }


    private void detectBruteForce(LoginLog loginLog) {

        if (loginLog.getStatus() != LoginStatus.FAILED) {
            return;
        }

        LocalDateTime windowStart =
                loginLog.getLoginTime().minusMinutes(10);

        long failedAttempts =
                loginLogRepository
                        .countByUserIdAndStatusAndLoginTimeAfter(
                                loginLog.getUser().getId(),
                                LoginStatus.FAILED,
                                windowStart
                        );

        if (failedAttempts >= 5) {

            saveAnomaly(
                    loginLog,
                    AnomalyType.BRUTE_FORCE,
                    "Multiple failed login attempts detected within a short time window",
                    70,
                    Severity.HIGH
            );
        }
    }


    private void saveAnomaly(
            LoginLog loginLog,
            AnomalyType anomalyType,
            String description,
            int riskScore,
            Severity severity
    ) {

        boolean alreadyExists =
                anomalyRepository
                        .existsByUserIdAndAnomalyTypeAndLoginLogId(
                                loginLog.getUser().getId(),
                                anomalyType,
                                loginLog.getId()
                        );

        if (alreadyExists) {

            System.out.println(
                    "ℹ Anomaly already exists: "
                            + anomalyType
            );

            return;
        }

        Anomaly anomaly = Anomaly.builder()
                .user(loginLog.getUser())
                .loginLog(loginLog)
                .anomalyType(anomalyType)
                .description(description)
                .riskScore(riskScore)
                .severity(severity)
                .build();

        anomalyRepository.save(anomaly);

        System.out.println(
                "✅ ANOMALY SAVED: "
                        + anomalyType
        );
    }


    // =========================================================
    // RULE 1: FAILED LOGIN
    // Risk Score: 20
    // Severity: LOW
    // =========================================================

    private void detectFailedLogin(LoginLog loginLog) {

        if (loginLog.getStatus() == LoginStatus.FAILED) {

            saveAnomaly(
                    loginLog,
                    AnomalyType.FAILED_LOGIN,
                    "Failed login attempt detected",
                    20,
                    Severity.LOW
            );
        }
    }


    // =========================================================
    // RULE 2: UNUSUAL LOGIN TIME
    // Risk Score: 25
    // Severity: LOW
    // =========================================================

    private void detectUnusualLoginTime(LoginLog loginLog) {

        int hour = loginLog.getLoginTime().getHour();

        if (hour >= 0 && hour < 5) {

            saveAnomaly(
                    loginLog,
                    AnomalyType.UNUSUAL_LOGIN_TIME,
                    "Login occurred during unusual hours",
                    25,
                    Severity.LOW
            );
        }
    }


    // =========================================================
    // RULE 3: INACTIVE USER LOGIN
    // Risk Score: 80
    // Severity: CRITICAL
    // =========================================================

    private void detectInactiveUser(LoginLog loginLog) {

        if (Boolean.FALSE.equals(
                loginLog.getUser().getActive()
        )) {

            saveAnomaly(
                    loginLog,
                    AnomalyType.INACTIVE_USER_LOGIN,
                    "Inactive user attempted to log in",
                    80,
                    Severity.CRITICAL
            );
        }
    }
}
