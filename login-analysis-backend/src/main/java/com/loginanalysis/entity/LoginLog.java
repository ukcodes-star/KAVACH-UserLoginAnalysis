package com.loginanalysis.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_login_logs",
        indexes = {
                @Index(name = "idx_login_username", columnList = "user_id"),
                @Index(name = "idx_login_time", columnList = "login_time"),
                @Index(name = "idx_login_status", columnList = "status"),
                @Index(name = "idx_login_ip", columnList = "ip_address")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;

    @Column(name = "ip_address", nullable = false, length = 100)
    private String ipAddress;

    @Column(length = 100)
    private String location;

    @Column(length = 200)
    private String device;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LoginStatus status;

    @PrePersist
    protected void onCreate() {
        if (loginTime == null) {
            loginTime = LocalDateTime.now();
        }
    }
}