package com.pfe.backendspringboot.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ChatRequest {

    private String message;
    private String role;
    private Long userId;
    private String userName;
    private String sessionId;
}