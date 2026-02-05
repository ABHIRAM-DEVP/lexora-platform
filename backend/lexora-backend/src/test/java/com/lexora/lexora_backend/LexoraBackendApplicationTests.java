package com.lexora.lexora_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,org.springframework.boot.mongodb.autoconfigure.MongoReactiveAutoConfiguration,org.springframework.boot.servlet.autoconfigure.MultipartAutoConfiguration,org.springframework.boot.mongodb.autoconfigure.health.MongoHealthContributorAutoConfiguration",
    "management.health.mongo.enabled=false"
})
class LexoraBackendApplicationTests {

    @Test
    void contextLoads() {
        // This test will pass if the Spring context loads successfully
    }
}
