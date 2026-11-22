package com.loginanalysis.config;

import com.loginanalysis.entity.User;
import com.loginanalysis.repository.UserRepository;
import com.loginanalysis.service.AuditLogService;
import com.loginanalysis.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // No token: continue. SecurityConfig handles protected endpoints.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();

        // 1. Empty JWT token
        if (token.isEmpty()) {
            logSecurityEvent(
                    "UNKNOWN",
                    "EMPTY_JWT_TOKEN",
                    request
            );

            rejectRequest(response, "Bearer token is empty");
            return;
        }

        // 2. Invalid or expired JWT token
        if (!jwtService.isTokenValid(token)) {
            logSecurityEvent(
                    "UNKNOWN",
                    "INVALID_JWT_TOKEN",
                    request
            );

            rejectRequest(response, "Invalid or expired JWT token");
            return;
        }

        // Token is valid. Extract username.
        String username = jwtService.extractUsername(token);

        if (SecurityContextHolder.getContext().getAuthentication() == null) {

            User user = userRepository.findByUsername(username)
                    .orElse(null);

            // 3. User does not exist
            if (user == null) {
                logSecurityEvent(
                        username,
                        "JWT_USER_NOT_FOUND",
                        request
                );

                rejectRequest(response, "Authenticated user not found");
                return;
            }

            // 4. User account is inactive
            if (!Boolean.TRUE.equals(user.getActive())) {
                logSecurityEvent(
                        username,
                        "JWT_USER_INACTIVE",
                        request
                );

                rejectRequest(response, "User account is inactive");
                return;
            }

            // 5. User role is missing
            if (user.getRole() == null) {
                logSecurityEvent(
                        username,
                        "JWT_USER_ROLE_MISSING",
                        request
                );

                rejectRequest(response, "User role is missing");
                return;
            }

            var authorities = List.of(
                    new SimpleGrantedAuthority(
                            "ROLE_" + user.getRole().name()
                    )
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            null,
                            authorities
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource()
                            .buildDetails(request)
            );

            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
        }

        // Continue to the next filter.
        filterChain.doFilter(request, response);
    }

    // Save security event in audit_logs.
    private void logSecurityEvent(
            String username,
            String action,
            HttpServletRequest request
    ) {

        try {
            auditLogService.saveAuditLog(
                    username,
                    action,
                    "JWT security event: "
                            + request.getMethod()
                            + " "
                            + request.getRequestURI(),
                    request.getRemoteAddr()
            );

        } catch (Exception ex) {
            // Audit logging failure should not interrupt authentication.
            System.err.println(
                    "Failed to save audit log: " + ex.getMessage()
            );
        }
    }

    // Return a consistent 401 JSON response.
    private void rejectRequest(
            HttpServletResponse response,
            String message
    ) throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(
                "{\"error\":\"" + message + "\"}"
        );
    }
}