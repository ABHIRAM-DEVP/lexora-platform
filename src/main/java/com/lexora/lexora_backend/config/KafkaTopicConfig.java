package com.lexora.lexora_backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

   @Bean
public NewTopic noteEventsTopic() {
    return TopicBuilder.name("note-events")
                       .partitions(3)
                       .replicas(1)
                       .build();
}

@Bean
public NewTopic commentEventsTopic() {
    return TopicBuilder.name("comment-events")
                       .partitions(3)
                       .replicas(1)
                       .build();
}

@Bean
public NewTopic notificationEventsTopic() {
    return TopicBuilder.name("notification-events")
                       .partitions(3)
                       .replicas(1)
                       .build();
}

}
