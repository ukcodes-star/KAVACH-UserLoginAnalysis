package com.loginanalysis.repository;

import com.loginanalysis.entity.LoginLog;
import com.loginanalysis.entity.LoginStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface LoginLogRepository
        extends JpaRepository<LoginLog, Long> {

    List<LoginLog> findByUserIdOrderByLoginTimeDesc(
            Long userId
    );

    List<LoginLog> findByStatusOrderByLoginTimeDesc(
            LoginStatus status
    );

    List<LoginLog> findByLoginTimeAfterOrderByLoginTimeDesc(
            LocalDateTime time
    );

    List<LoginLog> findByLoginTimeAfterOrderByLoginTimeAsc(
            LocalDateTime time
    );

    long countByStatus(LoginStatus status);

    long countByUserId(Long userId);

    long countByUserIdAndStatus(
            Long userId,
            LoginStatus status
    );

    List<LoginLog> findByUserIdAndLoginTimeAfterOrderByLoginTimeDesc(
            Long userId,
            LocalDateTime time
    );

    boolean existsByUserIdAndIpAddress(
            Long userId,
            String ipAddress
    );

    long countByUserIdAndStatusAndLoginTimeAfter(
            Long userId,
            LoginStatus status,
            LocalDateTime time
    );
}