package com.lexora.lexora_backend.events.producer;


import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.events.model.CommentCreatedEvent;

@Service
public class KafkaEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishCommentCreated(String noteId, String userId, String workspaceId) {
        CommentCreatedEvent event = new CommentCreatedEvent(noteId, userId, workspaceId);
        kafkaTemplate.send("comment-events", event);
        System.out.println("Published event: " + event.getEventType() + " for noteId: " + noteId);
    }
}