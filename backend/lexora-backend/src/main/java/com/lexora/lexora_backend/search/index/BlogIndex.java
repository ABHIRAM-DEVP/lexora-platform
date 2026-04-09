package com.lexora.lexora_backend.search.index;


import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import java.util.List;
import java.util.UUID;

@Document(indexName = "blogs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogIndex {

    @Id
    private UUID id;

    private String title;
    private String content;
    private List<String> tags;
}
