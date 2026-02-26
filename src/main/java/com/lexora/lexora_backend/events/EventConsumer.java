package com.lexora.lexora_backend.events;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.events.model.CommentCreatedEvent;

@Service
public class EventConsumer {

    @KafkaListener(topics = "comment-events", groupId = "lexora-group")
    public void consumeCommentEvent(CommentCreatedEvent event) {
        System.out.println("Received event: " + event.getEventType() + " for noteId: " + event.getNoteId());
        // Do async stuff: send notification, update DB, etc.
    }
}

