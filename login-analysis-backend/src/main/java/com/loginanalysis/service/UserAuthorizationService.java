
package com.loginanalysis.service;

import com.loginanalysis.entity.User;
import com.loginanalysis.entity.UserRole;
import com.loginanalysis.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserAuthorizationService {

    private final UserRepository userRepository;

    // Get currently authenticated user

    public User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        System.out.println("========== AUTHORIZATION DEBUG ==========");

        System.out.println("Authentication exists: " + (authentication != null));

        if (authentication != null) {
            System.out.println("Authenticated: " + authentication.isAuthenticated());
            System.out.println("Principal: " + authentication.getPrincipal());
            System.out.println("Username: " + authentication.getName());
            System.out.println("Authorities: " + authentication.getAuthorities());
        }

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {

            System.out.println("Authorization failed: User is not authenticated");

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    System.out.println("Authorization failed: User not found in database");

                    return new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Authenticated user not found"
                    );
                });

        System.out.println("Current user ID: " + currentUser.getId());
        System.out.println("Current user role: " + currentUser.getRole());
        System.out.println("========== AUTHORIZATION DEBUG END ==========");

        return currentUser;
    }


    // Check whether current user is ADMIN
    public boolean isAdmin() {
        return getCurrentUser().getRole() == UserRole.ADMIN;
    }

    // Check whether current user owns the requested resource
    public boolean hasAccessToUser(Long requestedUserId) {

        User currentUser = getCurrentUser();

        // ADMIN can access every user's data
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }

        // USER can access only their own data
        return currentUser.getId().equals(requestedUserId);
    }

    // Check and enforce resource ownership; throws 403 AccessDeniedException if unauthorized
    public boolean checkUserAccess(Long requestedUserId) {
        User currentUser = getCurrentUser();

        // ADMIN can access any user's data
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }

        // USER can access only their own data
        if (requestedUserId == null || !currentUser.getId().equals(requestedUserId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access denied: You are only authorized to view your own details, not other users' details."
            );
        }

        return true;
    }

}
