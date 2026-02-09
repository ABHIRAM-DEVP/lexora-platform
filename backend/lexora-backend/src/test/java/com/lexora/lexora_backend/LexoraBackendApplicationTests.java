package com.lexora.lexora_backend;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,org.springframework.boot.mongodb.autoconfigure.MongoReactiveAutoConfiguration,org.springframework.boot.servlet.autoconfigure.MultipartAutoConfiguration,org.springframework.boot.mongodb.autoconfigure.health.MongoHealthContributorAutoConfiguration",
    "management.health.mongo.enabled=false"
})
@ActiveProfiles("test")
@TestConfiguration
class LexoraBackendApplicationTests {

    @Bean
    SecurityFilterChain testSecurity(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
