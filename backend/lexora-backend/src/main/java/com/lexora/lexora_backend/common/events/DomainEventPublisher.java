package com.lexora.lexora_backend.common.events;

public interface DomainEventPublisher {
    void publish(String topic, Object event);
}
