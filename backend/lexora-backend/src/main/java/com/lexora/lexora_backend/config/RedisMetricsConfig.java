package com.lexora.lexora_backend.config;

import java.util.Set;

import io.micrometer.core.instrument.MeterRegistry;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;

@Configuration
public class RedisMetricsConfig {
public RedisMetricsConfig(RedisTemplate<String, ?> redisTemplate, MeterRegistry meterRegistry) {
    Set<String> keys = redisTemplate.keys("*");
    if (keys != null) {
        meterRegistry.gauge("redis.keys", keys.size());
    }
}
}
