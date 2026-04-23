package com.arogyajal.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.google.cloud.Timestamp;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class TimestampDeserializer extends JsonDeserializer<Timestamp> {
    private static final DateTimeFormatter[] FORMATTERS = {
        DateTimeFormatter.ISO_OFFSET_DATE_TIME,
        DateTimeFormatter.ISO_LOCAL_DATE_TIME,
        DateTimeFormatter.ofPattern("yyyy-M-d'T'H:mm[:ss][.SSS][XXX][X]"),
        DateTimeFormatter.ofPattern("yyyy-M-d'T'H:mm[:ss][.SSS]'Z'"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-M-d HH:mm:ss")
    };

    @Override
    public Timestamp deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateStr = p.getValueAsString();
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }

        // Try parsing with different formats
        for (DateTimeFormatter formatter : FORMATTERS) {
            try {
                // Handle timestamps with or without timezone
                if (formatter == DateTimeFormatter.ISO_OFFSET_DATE_TIME) {
                    return Timestamp.ofTimeSecondsAndNanos(
                        Instant.from(DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(dateStr)).getEpochSecond(),
                        0
                    );
                } else if (formatter == DateTimeFormatter.ISO_LOCAL_DATE_TIME) {
                    LocalDateTime localDateTime = LocalDateTime.parse(dateStr, formatter);
                    return Timestamp.ofTimeSecondsAndNanos(
                        localDateTime.toEpochSecond(ZoneOffset.UTC),
                        0
                    );
                } else {
                    try {
                        LocalDateTime localDateTime = LocalDateTime.parse(dateStr, formatter);
                        return Timestamp.ofTimeSecondsAndNanos(
                            localDateTime.toEpochSecond(ZoneOffset.UTC),
                            0
                        );
                    } catch (DateTimeParseException e) {
                        // Try next formatter
                        continue;
                    }
                }
            } catch (Exception e) {
                // Try next formatter
                continue;
            }
        }

        // If all else fails, try the default parser
        try {
            return Timestamp.parseTimestamp(dateStr);
        } catch (Exception e) {
            throw new IOException("Failed to parse timestamp: " + dateStr, e);
        }
    }
}
