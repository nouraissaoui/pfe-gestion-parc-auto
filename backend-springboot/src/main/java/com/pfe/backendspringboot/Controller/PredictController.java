package com.pfe.backendspringboot.Controller;

import com.pfe.backendspringboot.DTO.PredictionRequest;
import com.pfe.backendspringboot.DTO.PredictionRequestAngular;
import com.pfe.backendspringboot.DTO.PredictionResponse;
import com.pfe.backendspringboot.Service.MLClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// PredictController.java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class PredictController {

    private final MLClientService mlClientService;

    public PredictController(MLClientService mlClientService) {
        this.mlClientService = mlClientService;
    }

    @PostMapping("/predict")
    public ResponseEntity<PredictionResponse> predict(
            @RequestBody PredictionRequestAngular request) {
        PredictionResponse response = mlClientService.predict(request.toFlaskRequest());
        return ResponseEntity.ok(response);
    }
}
