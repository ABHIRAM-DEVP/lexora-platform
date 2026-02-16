package com.lexora.lexora_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Refill;
import java.time.Duration;

@Configuration
public class RateLimiterConfig {

    @Bean
    public Bandwidth limitPerUser() {
        return Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1)));
    }
}
