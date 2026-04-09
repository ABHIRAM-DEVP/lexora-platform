package com.lexora.lexora_backend.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.lexora.lexora_backend.note.service.NoteService;

@Configuration
public class StartupCacheLoader {

    private final NoteService noteService;

    public StartupCacheLoader(NoteService noteService) {
        this.noteService = noteService;
    }

    @Bean
    public ApplicationRunner warmCache() {
        return args -> {
            noteService.preloadActiveWorkspaces();
        };
    }
}
