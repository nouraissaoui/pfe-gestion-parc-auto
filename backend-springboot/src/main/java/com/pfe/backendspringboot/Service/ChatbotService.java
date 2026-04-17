package com.pfe.backendspringboot.Service;

import com.pfe.backendspringboot.DTO.ChatRequest;
import com.pfe.backendspringboot.DTO.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ChatbotService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${chatbot.flask.url:http://localhost:5000}")
    private String flaskUrl;

    public ChatResponse chat(ChatRequest request) {
        String url = flaskUrl + "/chat";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<ChatRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<ChatResponse> response = restTemplate.postForEntity(
                url, entity, ChatResponse.class
        );

        return response.getBody();
    }

    public void resetConversation(String sessionId) {
        String url = flaskUrl + "/chat/reset";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        java.util.Map<String, String> body = java.util.Map.of("sessionId", sessionId);
        HttpEntity<java.util.Map<String, String>> entity = new HttpEntity<>(body, headers);

        restTemplate.postForEntity(url, entity, Void.class);
    }
}
