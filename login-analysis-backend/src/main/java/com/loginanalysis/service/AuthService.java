
package com.loginanalysis.service;

import com.loginanalysis.dto.LoginRequestDTO;
import com.loginanalysis.dto.LoginResponseDTO;
import com.loginanalysis.dto.RegisterRequestDTO;
import com.loginanalysis.dto.RegisterResponseDTO;
import com.loginanalysis.entity.LoginStatus;
import com.loginanalysis.entity.User;
import com.loginanalysis.entity.UserRole;
import com.loginanalysis.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final LoginLogService loginLogService;

    @Transactional
    public RegisterResponseDTO register(
            RegisterRequestDTO request,
            String ipAddress) {

        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        // 1. Check duplicate username
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username already exists"
            );
        }

        // 2. Check duplicate email
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already exists"
            );
        }

        // 3. Encrypt password using BCrypt
        String encodedPassword =
                passwordEncoder.encode(request.password());

        // 4. Create user
        User user = User.builder()
                .username(username)
                .email(email)
                .password(encodedPassword)
                .active(true)
                .role(UserRole.USER)
                .createdAt(LocalDateTime.now())
                .build();

        // 5. Save user
        User savedUser = userRepository.save(user);

        // 6. Record registration event
        auditLogService.saveAuditLog(
                savedUser.getUsername(),
                "USER_REGISTERED",
                "New user registered successfully",
                ipAddress
        );

        // 7. Return safe response
        return new RegisterResponseDTO(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getActive(),
                savedUser.getCreatedAt()
        );
    }

    public LoginResponseDTO login(
            LoginRequestDTO request,
            String ipAddress) {
        return login(request, ipAddress, "Web Client");
    }

    public LoginResponseDTO login(
            LoginRequestDTO request,
            String ipAddress,
            String userAgent) {

        String username = request.username().trim();

        // 1. Find user by username
        User user = userRepository.findByUsername(username)
                .orElse(null);

        // 2. Handle unknown username
        if (user == null) {

            auditLogService.saveAuditLog(
                    username,
                    "LOGIN_FAILED",
                    "Login failed: username not found",
                    ipAddress
            );

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid username or password"
            );
        }

        // 3. Check whether account is active
        if (!Boolean.TRUE.equals(user.getActive())) {

            auditLogService.saveAuditLog(
                    username,
                    "LOGIN_BLOCKED",
                    "Login blocked: account is inactive",
                    ipAddress
            );

            try {
                loginLogService.recordAndAnalyze(
                        user,
                        ipAddress,
                        userAgent != null && !userAgent.isBlank() ? userAgent : "Web Client",
                        "Web Login",
                        LoginStatus.FAILED
                );
            } catch (Exception e) {
                System.err.println("Failed to record login telemetry: " + e.getMessage());
            }

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is inactive. Please contact administrator."
            );
        }

        // 4. Verify raw password against BCrypt hash
        boolean passwordMatches = passwordEncoder.matches(
                request.password(),
                user.getPassword()
        );

        // 5. Handle incorrect password
        if (!passwordMatches) {

            auditLogService.saveAuditLog(
                    username,
                    "LOGIN_FAILED",
                    "Login failed: incorrect password",
                    ipAddress
            );

            try {
                loginLogService.recordAndAnalyze(
                        user,
                        ipAddress,
                        userAgent != null && !userAgent.isBlank() ? userAgent : "Web Client",
                        "Web Login",
                        LoginStatus.FAILED
                );
            } catch (Exception e) {
                System.err.println("Failed to record login telemetry: " + e.getMessage());
            }

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid username or password"
            );
        }

        // 6. Generate JWT after successful password verification
        String token = jwtService.generateToken(user);

        // 7. Save successful login event
        auditLogService.saveAuditLog(
                username,
                "LOGIN_SUCCESS",
                "User logged in successfully",
                ipAddress
        );

        try {
            loginLogService.recordAndAnalyze(
                    user,
                    ipAddress,
                    userAgent != null && !userAgent.isBlank() ? userAgent : "Web Client",
                    "Web Login",
                    LoginStatus.SUCCESS
            );
        } catch (Exception e) {
            System.err.println("Failed to record login telemetry: " + e.getMessage());
        }

        // 8. Return safe user details and JWT
        return new LoginResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getActive(),
                "Login successful",
                token,
                "Bearer",
                jwtService.getExpirationInSeconds()
        );
    }
}
