package com.loginanalysis.service;

import com.loginanalysis.dto.DailyLoginStatDTO;
import com.loginanalysis.dto.LoginAnalyticsResponseDTO;
import com.loginanalysis.entity.LoginLog;
import com.loginanalysis.entity.LoginStatus;
import com.loginanalysis.repository.LoginLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LoginAnalyticsService {

    private final LoginLogRepository loginLogRepository;

    @Transactional(readOnly = true)
    public LoginAnalyticsResponseDTO getLoginAnalytics() {

        // --------------------------------
        // 1. Overall login statistics
        // --------------------------------

        long successfulLogins =
                loginLogRepository.countByStatus(
                        LoginStatus.SUCCESS
                );

        long failedLogins =
                loginLogRepository.countByStatus(
                        LoginStatus.FAILED
                );

        long totalLogins =
                successfulLogins + failedLogins;

        double failedLoginRate = 0.0;

        if (totalLogins > 0) {
            failedLoginRate =
                    (failedLogins * 100.0) / totalLogins;
        }

        // --------------------------------
        // 2. Last 7 days
        // --------------------------------

        LocalDateTime sevenDaysAgo =
                LocalDateTime.now().minusDays(7);

        List<LoginLog> recentLogs =
                loginLogRepository
                        .findByLoginTimeAfterOrderByLoginTimeAsc(
                                sevenDaysAgo
                        );

        List<DailyLoginStatDTO> dailyStats =
                buildDailyStats(recentLogs);

        // --------------------------------
        // 3. Build response
        // --------------------------------

        return LoginAnalyticsResponseDTO.builder()
                .totalLogins(totalLogins)
                .successfulLogins(successfulLogins)
                .failedLogins(failedLogins)
                .failedLoginRate(
                        Math.round(failedLoginRate * 100.0) / 100.0
                )
                .last7Days(dailyStats)
                .build();
    }

    private List<DailyLoginStatDTO> buildDailyStats(
            List<LoginLog> logs) {

        Map<LocalDate, DailyLoginStatDTO> stats =
                new LinkedHashMap<>();

        // Create all 7 dates first
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {

            LocalDate date = today.minusDays(i);

            stats.put(
                    date,
                    DailyLoginStatDTO.builder()
                            .date(date.toString())
                            .successfulLogins(0)
                            .failedLogins(0)
                            .totalLogins(0)
                            .build()
            );
        }

        // Add actual login data
        for (LoginLog log : logs) {

            LocalDate date =
                    log.getLoginTime().toLocalDate();

            DailyLoginStatDTO daily =
                    stats.get(date);

            if (daily == null) {
                continue;
            }

            if (log.getStatus() == LoginStatus.SUCCESS) {

                daily.setSuccessfulLogins(
                        daily.getSuccessfulLogins() + 1
                );

            } else if (log.getStatus() == LoginStatus.FAILED) {

                daily.setFailedLogins(
                        daily.getFailedLogins() + 1
                );
            }

            daily.setTotalLogins(
                    daily.getTotalLogins() + 1
            );
        }

        return new ArrayList<>(stats.values());
    }
}