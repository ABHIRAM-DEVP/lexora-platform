package com.lexora.lexora_backend.search.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.lexora.lexora_backend.search.dto.BlogSearchDTO;
import com.lexora.lexora_backend.search.service.SearchService;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/api/search")
    public List<BlogSearchDTO> search(@RequestParam String query) {
        return searchService.search(query);
    }
}