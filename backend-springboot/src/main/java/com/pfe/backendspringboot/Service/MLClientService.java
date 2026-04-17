package com.pfe.backendspringboot.Service;

import com.pfe.backendspringboot.DTO.PredictionRequest;
import com.pfe.backendspringboot.DTO.PredictionResponse;
import com.pfe.backendspringboot.DTO.PredictionResponseFlask;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MLClientService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    public PredictionResponse predict(PredictionRequest request) {
        String url = mlServiceUrl + "/predict";

        ResponseEntity<PredictionResponseFlask> response =
                restTemplate.postForEntity(url, request, PredictionResponseFlask.class);

        return PredictionResponse.from(response.getBody());
    }
}