package com.pfe.backendspringboot.Controller;

import com.pfe.backendspringboot.Service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> req) {
        try {
            String message  = (String) req.get("message");
            String role     = (String) req.getOrDefault("role", "CHAUFFEUR");
            String userName = (String) req.getOrDefault("userName", "");
            Long userId     = req.get("userId")  != null ? Long.valueOf(req.get("userId").toString())  : null;
            Long localId    = req.get("localId") != null ? Long.valueOf(req.get("localId").toString()) : null;

            String response = chatbotService.processMessage(message, role, userId, localId, userName);
            return ResponseEntity.ok(Map.of("reply", response));

        } catch (Exception e) {
            System.err.println("❌ Erreur chatbot: " + e.getMessage());
            return ResponseEntity.ok(Map.of("reply", "Une erreur s'est produite : " + e.getMessage()));
        }
    }
}