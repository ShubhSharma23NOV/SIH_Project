package com.arogyajal.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;

/**
 * Custom deserializer to handle severity field that can be either:
 * - String: "MILD", "MODERATE", "SEVERE"
 * - Number: 0 (MILD), 1 (MODERATE), 2 (SEVERE), 3 (CRITICAL)
 */
public class SeverityDeserializer extends JsonDeserializer<String> {
    
    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        
        if (node.isTextual()) {
            // It's already a string
            return node.asText().toUpperCase();
        } else if (node.isNumber()) {
            // Convert number to severity string
            int severity = node.asInt();
            switch (severity) {
                case 0: return "MILD";
                case 1: return "MODERATE";
                case 2: return "SEVERE";
                case 3: return "SEVERE"; // Map CRITICAL to SEVERE
                default: return "MODERATE";
            }
        }
        
        return "MODERATE"; // Default
    }
}
