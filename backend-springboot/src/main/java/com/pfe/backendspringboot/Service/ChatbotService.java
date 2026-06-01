package com.pfe.backendspringboot.Service;

import com.pfe.backendspringboot.DTO.ChatRequest;
import com.pfe.backendspringboot.DTO.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

//Spring Boot devient un intermédiaire vers Flask
@Service
public class ChatbotService {

    //c'est un objet Spring qui sert à effectuer des appels HTTP depuis Spring Boot vers un autre serveur.
    private final RestTemplate restTemplate = new RestTemplate();

    //definir l'url du flask
    @Value("${chatbot.flask.url:http://localhost:5000}")
    private String flaskUrl;

    public ChatResponse chat(ChatRequest request) {
        String url = flaskUrl + "/chat";
        //construction de la requete http:

        //Création des headers HTTP
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);//indique au serveur falsk que le body envoyé est du json
                                                            //c'est l'equivalent a: Content-Type: application/json
        //Création de l’entité HTTP qui contient headers,body(json)=request(payload)
        HttpEntity<ChatRequest> entity = new HttpEntity<>(request, headers);


        //effectue une requete post vers flask ou on definit 3 parametre (l'url vers flask,l'entity a envoyé et
        //ChatResponse.class qui indique a Flask que la reponse
        //doit être convertie automatiquement en objet ChatResponse
        ResponseEntity<ChatResponse> response = restTemplate.postForEntity(
                url, entity, ChatResponse.class
        );

        return response.getBody();
    }

    //réinitialiser la conversation du chatbot(expl de sessionId CHEF_PARC_5)
    public void resetConversation(String sessionId) {
        String url = flaskUrl + "/chat/reset";

        HttpHeaders headers = new HttpHeaders();//Création des headers HTTP
        headers.setContentType(MediaType.APPLICATION_JSON);//Définition du format JSON

        java.util.Map<String, String> body = java.util.Map.of("sessionId", sessionId);//Création du body JSON
        HttpEntity<java.util.Map<String, String>> entity = new HttpEntity<>(body, headers);//Construction de la requête HTTP

        restTemplate.postForEntity(url, entity, Void.class);//Appel HTTP vers Flask
    }
}
