package com.arogyajal.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;

/**
 * Custom deserializer to handle location field that can be either:
 * - String: "Guwahati - Kamakhya"
 * - Object: {"lat": 22.8211, "lng": 75.9428}
 */
public class LocationDeserializer extends JsonDeserializer<String> {
    
    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        
        if (node.isTextual()) {
            // It's a string location
            return node.asText();
        } else if (node.isObject()) {
            // It's a location object with lat/lng
            double lat = node.get("lat").asDouble();
            double lng = node.get("lng").asDouble();
            return String.format("%.4f, %.4f", lat, lng);
        }
        
        return null;
    }
}
