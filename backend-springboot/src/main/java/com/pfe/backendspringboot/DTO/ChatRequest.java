package com.pfe.backendspringboot.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
//c'est le meme payload envoyé par angualr mais objet java maintenant
@Data
public class ChatRequest {

    private String message;
    private String role;
    private Long userId;
    private String userName;
    private String sessionId;
}