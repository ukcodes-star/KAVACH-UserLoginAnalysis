package com.loginanalysis.service;

import com.loginanalysis.dto.LoginLogRequestDTO;
import com.loginanalysis.dto.LoginLogResponseDTO;
import com.loginanalysis.entity.LoginLog;
import com.loginanalysis.entity.LoginStatus;
import com.loginanalysis.entity.User;
import com.loginanalysis.exception.ResourceNotFoundException;
import com.loginanalysis.repository.LoginLogRepository;
import com.loginanalysis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoginLogService {

    private final LoginLogRepository loginLogRepository;
    private final UserRepository userRepository;
    private final AnomalyDetectionService anomalyDetectionService;


    // =========================================================
    // RECORD AND ANALYZE (REQUIRES_NEW for auth failure persistence)
    // =========================================================

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public LoginLog recordAndAnalyze(
            User user,
            String ipAddress,
            String device,
            String location,
            LoginStatus status
    ) {
        LoginLog loginLog = LoginLog.builder()
                .user(user)
                .loginTime(LocalDateTime.now())
                .ipAddress(ipAddress != null && !ipAddress.isBlank() ? ipAddress : "127.0.0.1")
                .device(device != null && !device.isBlank() ? device : "Web Client")
                .location(location != null && !location.isBlank() ? location : "Web Login")
                .status(status)
                .build();

        LoginLog savedLog = loginLogRepository.save(loginLog);
        anomalyDetectionService.analyzeLogin(savedLog);
        return savedLog;
    }

    // =========================================================
    // CREATE LOGIN LOG
    // =========================================================

    public LoginLogResponseDTO createLoginLog(
            LoginLogRequestDTO request
    ) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: "
                                        + request.getUserId()
                        ));

        LoginLog loginLog = LoginLog.builder()
                .user(user)
                .loginTime(
                        request.getLoginTime() != null
                                ? request.getLoginTime()
                                : LocalDateTime.now()
                )
                .ipAddress(request.getIpAddress())
                .location(request.getLocation())
                .device(request.getDevice())
                .status(request.getStatus())
                .build();

        // Save login log
        LoginLog savedLog =
                loginLogRepository.save(loginLog);

        // Analyze login for suspicious activity
        anomalyDetectionService.analyzeLogin(savedLog);

        // Convert entity to response DTO
        return convertToResponse(savedLog);
    }


    // =========================================================
    // GET ALL LOGIN LOGS
    // =========================================================

    @Transactional(readOnly = true)
    public List<LoginLogResponseDTO> getAllLogs() {

        return loginLogRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
    // GET LOGIN LOGS FOR SPECIFIC USER
    // =========================================================

    @Transactional(readOnly = true)
    public List<LoginLogResponseDTO> getUserLogs(
            Long userId
    ) {

        if (!userRepository.existsById(userId)) {

            throw new ResourceNotFoundException(
                    "User not found with id: " + userId
            );
        }

        return loginLogRepository
                .findByUserIdOrderByLoginTimeDesc(userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
    // GET FAILED LOGIN LOGS
    // =========================================================

    @Transactional(readOnly = true)
    public List<LoginLogResponseDTO> getFailedLogs() {

        return loginLogRepository
                .findByStatusOrderByLoginTimeDesc(
                        LoginStatus.FAILED
                )
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
    // GET RECENT LOGIN LOGS
    // =========================================================

    @Transactional(readOnly = true)
    public List<LoginLogResponseDTO> getRecentLogs(
            int hours
    ) {

        LocalDateTime time =
                LocalDateTime.now().minusHours(hours);

        return loginLogRepository
                .findByLoginTimeAfterOrderByLoginTimeDesc(time)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // =========================================================
    // CONVERT ENTITY → RESPONSE DTO
    // =========================================================

    private LoginLogResponseDTO convertToResponse(
            LoginLog loginLog
    ) {

        return LoginLogResponseDTO.builder()
                .id(loginLog.getId())
                .userId(loginLog.getUser().getId())
                .username(loginLog.getUser().getUsername())
                .loginTime(loginLog.getLoginTime())
                .ipAddress(loginLog.getIpAddress())
                .location(loginLog.getLocation())
                .device(loginLog.getDevice())
                .status(loginLog.getStatus())
                .build();
    }
}
