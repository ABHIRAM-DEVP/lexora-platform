package com.lexora.lexora_backend.common.dto;

import java.io.Serializable;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> implements Serializable {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
