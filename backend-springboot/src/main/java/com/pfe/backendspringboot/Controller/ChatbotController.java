package com.pfe.backendspringboot.Controller;


import com.pfe.backendspringboot.DTO.ChatRequest;
import com.pfe.backendspringboot.DTO.ChatResponse;
import com.pfe.backendspringboot.Service.ChatbotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        try {
            ChatResponse response = chatbotService.chat(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> reset(@RequestBody Map<String, String> body) {
        String sessionId = body.get("sessionId");
        chatbotService.resetConversation(sessionId);
        return ResponseEntity.ok(Map.of("message", "Conversation réinitialisée."));
    }
}
