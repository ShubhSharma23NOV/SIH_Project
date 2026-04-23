package com.arogyajal.controller;

import com.arogyajal.dto.SensorData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    private static final Logger log = LoggerFactory.getLogger(WebSocketController.class);
    private final SimpMessagingTemplate template;
    private final SensorController sensorController;
    
    @Value("${app.demo-mode:false}")
    private boolean demoMode;

    public WebSocketController(SimpMessagingTemplate template, SensorController sensorController) {
        this.template = template;
        this.sensorController = sensorController;
    }

    @MessageMapping("/sensor-data")
    @SendTo("/topic/sensor-data")
    public void sendSensorData(SensorData sensorData) {
        // This method handles incoming WebSocket messages
    }

    // Send updates every 5 seconds (DISABLED in demo mode to prevent quota exhaustion)
    @Scheduled(fixedRate = 5000)
    public void sendSensorDataUpdate() {
        // Skip in demo mode to prevent Firebase quota exhaustion
        if (demoMode) {
            log.debug("Skipping scheduled sensor update (demo mode enabled)");
            return;
        }
        
        try {
            // Get the latest sensor data
            var response = sensorController.getLatestSensorData();
            if (response.getBody() != null) {
                // Send to all subscribed clients
                template.convertAndSend("/topic/sensor-data", response.getBody());
            }
        } catch (Exception e) {
            log.error("Error sending sensor data update: {}", e.getMessage(), e);
        }
    }
}
