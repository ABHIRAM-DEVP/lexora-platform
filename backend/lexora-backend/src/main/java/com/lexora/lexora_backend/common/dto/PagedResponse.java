package com.lexora.lexora_backend.common.dto;

import java.io.Serializable;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PagedResponse<T> implements Serializable {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public PagedResponse(List<T> content, int page, int size, long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }
}
