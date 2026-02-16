package com.lexora.lexora_backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.lexora.lexora_backend.auth.jwt.JwtAuthEntryPoint;
import com.lexora.lexora_backend.auth.jwt.JwtFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    // Password encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // CORS configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        //replace with your frontend URL(s) in production
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",          // dev
            "https://lexora-frontend.com"     // prod
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // Security filter chain
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtFilter jwtFilter,
            JwtAuthEntryPoint authEntryPoint
    ) throws Exception {

        http
            .csrf(csrf -> csrf.disable()) // CSRF disabled for APIs
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(e -> e.authenticationEntryPoint(authEntryPoint))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // Public endpoints
                .requestMatchers("/api/auth/signup", "/api/auth/login", "/api/auth/refresh-token", "/api/auth/logout").permitAll()

                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Swagger endpoints: only accessible by ADMIN in production
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").hasRole("ADMIN")

                // Media endpoints require authentication
                .requestMatchers("/api/media/**").authenticated()

                // All other endpoints require authentication
                .anyRequest().authenticated()
            );

        // Add JWT filter before Spring Security authentication
        http.addFilterBefore(jwtFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
