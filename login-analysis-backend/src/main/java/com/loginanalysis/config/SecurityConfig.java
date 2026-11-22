package com.loginanalysis.config;


import com.loginanalysis.service.AuditLogService;

import lombok.RequiredArgsConstructor;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuditLogService auditLogService;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated()
                )

                .exceptionHandling(exception -> exception

                        // 401 - Unauthorized
                        .authenticationEntryPoint(
                                (request, response, authException) -> {

                                    String username = "UNKNOWN";

                                    Authentication authentication =
                                            SecurityContextHolder.getContext()
                                                    .getAuthentication();

                                    if (authentication != null
                                            && authentication.isAuthenticated()
                                            && !"anonymousUser".equals(
                                            authentication.getPrincipal())) {

                                        username = authentication.getName();
                                    }

                                    try {
                                        auditLogService.saveAuditLog(
                                                username,
                                                "UNAUTHORIZED_ACCESS",
                                                "Unauthorized request: "
                                                        + request.getMethod()
                                                        + " "
                                                        + request.getRequestURI(),
                                                request.getRemoteAddr()
                                        );
                                    } catch (Exception ex) {
                                        // Do not interrupt the 401 response
                                    }

                                    response.setStatus(
                                            HttpStatus.UNAUTHORIZED.value()
                                    );

                                    response.setContentType(
                                            "application/json"
                                    );

                                    response.getWriter().write(
                                            "{\"error\":\"Unauthorized: Please provide a valid JWT token\"}"
                                    );
                                }
                        )

                        // 403 - Forbidden
                        .accessDeniedHandler(
                                (request, response, accessDeniedException) -> {

                                    Authentication authentication =
                                            SecurityContextHolder.getContext()
                                                    .getAuthentication();

                                    String username = "UNKNOWN";

                                    if (authentication != null
                                            && authentication.isAuthenticated()
                                            && !"anonymousUser".equals(
                                            authentication.getPrincipal())) {

                                        username = authentication.getName();
                                    }

                                    try {
                                        auditLogService.saveAuditLog(
                                                username,
                                                "ACCESS_DENIED",
                                                "Forbidden request: "
                                                        + request.getMethod()
                                                        + " "
                                                        + request.getRequestURI(),
                                                request.getRemoteAddr()
                                        );
                                    } catch (Exception ex) {
                                        // Do not interrupt the 403 response
                                    }

                                    response.setStatus(
                                            HttpStatus.FORBIDDEN.value()
                                    );

                                    response.setContentType(
                                            "application/json"
                                    );

                                    response.getWriter().write(
                                            "{\"error\":\"Forbidden: You do not have permission to access this resource\"}"
                                    );
                                }
                        )
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // Prevent double registration of JWT filter
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter>
    jwtFilterRegistration(JwtAuthenticationFilter filter) {

        FilterRegistrationBean<JwtAuthenticationFilter> registration =
                new FilterRegistrationBean<>(filter);

        registration.setEnabled(false);

        return registration;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
