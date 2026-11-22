package com.loginanalysis.controller;

import com.loginanalysis.dto.LoginRequestDTO;
import com.loginanalysis.dto.LoginResponseDTO;
import com.loginanalysis.dto.RegisterRequestDTO;
import com.loginanalysis.dto.RegisterResponseDTO;
import com.loginanalysis.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request,
            HttpServletRequest httpRequest) {

        RegisterResponseDTO response =
                authService.register(
                        request,
                        httpRequest.getRemoteAddr()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");

        LoginResponseDTO response =
                authService.login(
                        request,
                        ipAddress,
                        userAgent
                );

        return ResponseEntity.ok(response);
    }
}