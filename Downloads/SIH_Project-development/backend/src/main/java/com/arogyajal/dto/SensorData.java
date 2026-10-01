package com.arogyajal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.ServerTimestamp;
import com.arogyajal.config.TimestampDeserializer;
import com.arogyajal.config.TimestampSerializer;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import java.util.Objects;

public class SensorData {
    @NotBlank(message = "Device ID is required")
    private String deviceId;
    
    @ServerTimestamp
    @JsonSerialize(using = TimestampSerializer.class)
    @JsonDeserialize(using = TimestampDeserializer.class)
    private Timestamp timestamp;
    
    @NotNull(message = "Location is required")
    private Location location;
    
    @NotNull(message = "Sensors data is required")
    private Sensors sensors;
    
    private Battery battery;
    
    private String qualityStatus;

    public SensorData() {
    }

    public SensorData(String deviceId, Timestamp timestamp, Location location, Sensors sensors, Battery battery) {
        this.deviceId = deviceId;
        this.timestamp = timestamp;
        this.location = location;
        this.sensors = sensors;
        this.battery = battery;
    }
    
    public SensorData(String deviceId, Timestamp timestamp, Location location, Sensors sensors, Battery battery, String qualityStatus) {
        this.deviceId = deviceId;
        this.timestamp = timestamp;
        this.location = location;
        this.sensors = sensors;
        this.battery = battery;
        this.qualityStatus = qualityStatus;
    }

    // Getters and Setters for SensorData
    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public Sensors getSensors() {
        return sensors;
    }

    public void setSensors(Sensors sensors) {
        this.sensors = sensors;
    }

    public Battery getBattery() {
        return battery;
    }

    public void setBattery(Battery battery) {
        this.battery = battery;
    }

    public String getQualityStatus() {
        return qualityStatus;
    }

    public void setQualityStatus(String qualityStatus) {
        this.qualityStatus = qualityStatus;
    }

    @Override
    public String toString() {
        return "SensorData{" +
                "deviceId='" + deviceId + '\'' +
                ", timestamp=" + timestamp +
                ", location=" + location +
                ", sensors=" + sensors +
                ", battery=" + battery +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SensorData that = (SensorData) o;
        return Objects.equals(deviceId, that.deviceId) && 
               Objects.equals(timestamp, that.timestamp) && 
               Objects.equals(location, that.location) && 
               Objects.equals(sensors, that.sensors) && 
               Objects.equals(battery, that.battery);
    }

    @Override
    public int hashCode() {
        return Objects.hash(deviceId, timestamp, location, sensors, battery);
    }
    
    public static class Location {
        @Override
        public String toString() {
            return "Location{" +
                    "lat=" + lat +
                    ", lon=" + lon +
                    '}';
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Location location = (Location) o;
            return Objects.equals(lat, location.lat) && 
                   Objects.equals(lon, location.lon);
        }

        @Override
        public int hashCode() {
            return Objects.hash(lat, lon);
        }
        @NotNull(message = "Latitude is required")
        private Double lat;
        
        @NotNull(message = "Longitude is required")
        private Double lon;

        public Location() {
        }

        public Location(Double lat, Double lon) {
            this.lat = lat;
            this.lon = lon;
        }

        // Getters and Setters for Location
        public Double getLat() {
            return lat;
        }

        public void setLat(Double lat) {
            this.lat = lat;
        }

        public Double getLon() {
            return lon;
        }

        public void setLon(Double lon) {
            this.lon = lon;
        }
    }
    
    @JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.NONE, 
                    getterVisibility = JsonAutoDetect.Visibility.NONE,
                    setterVisibility = JsonAutoDetect.Visibility.NONE)
    public static class Sensors {
        @JsonProperty("PH")
        @com.fasterxml.jackson.annotation.JsonAlias({"pH", "ph"})
        private Double pH;
        
        @JsonProperty("Turbidity_NTU")
        @com.fasterxml.jackson.annotation.JsonAlias({"turbidity_NTU", "turbidity"})
        private Double turbidity_NTU;
        
        @JsonProperty("TDS_ppm")
        private Integer TDS_ppm;
        
        @JsonProperty("Temperature_C")
        @com.fasterxml.jackson.annotation.JsonAlias({"temperature_C", "temperature"})
        private Double temperature_C;

        public Sensors() {
        }

        public Sensors(Double pH, Double turbidity_NTU, Integer TDS_ppm, Double temperature_C) {
            this.pH = pH;
            this.turbidity_NTU = turbidity_NTU;
            this.TDS_ppm = TDS_ppm;
            this.temperature_C = temperature_C;
        }

        // Getters and Setters for Sensors
        public Double getPH() {
            return pH;
        }

        public void setPH(Double pH) {
            this.pH = pH;
        }

        public Double getTurbidity_NTU() {
            return turbidity_NTU;
        }

        public void setTurbidity_NTU(Double turbidity_NTU) {
            this.turbidity_NTU = turbidity_NTU;
        }

        public Integer getTDS_ppm() {
            return TDS_ppm;
        }

        public void setTDS_ppm(Integer TDS_ppm) {
            this.TDS_ppm = TDS_ppm;
        }

        public Double getTemperature_C() {
            return temperature_C;
        }

        public void setTemperature_C(Double temperature_C) {
            this.temperature_C = temperature_C;
        }
        
        @Override
        public String toString() {
            return "Sensors{" +
                    "pH=" + pH +
                    ", turbidity_NTU=" + turbidity_NTU +
                    ", TDS_ppm=" + TDS_ppm +
                    ", temperature_C=" + temperature_C +
                    '}';
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Sensors sensors = (Sensors) o;
            return Objects.equals(pH, sensors.pH) && 
                   Objects.equals(turbidity_NTU, sensors.turbidity_NTU) && 
                   Objects.equals(TDS_ppm, sensors.TDS_ppm) && 
                   Objects.equals(temperature_C, sensors.temperature_C);
        }

        @Override
        public int hashCode() {
            return Objects.hash(pH, turbidity_NTU, TDS_ppm, temperature_C);
        }
    }
    
    public static class Battery {
        private Double voltage;  // Battery voltage in volts
        private Double level;    // Battery level (0.0 to 1.0 or 0 to 100)
        private Boolean isCharging;  // Whether the battery is currently charging
        private Double temperature;  // Battery temperature in Celsius
        private String health;       // Battery health status

        public Battery() {
        }

        public Battery(Double voltage) {
            this.voltage = voltage;
        }

        public Battery(Double voltage, Double level, Boolean isCharging, Double temperature, String health) {
            this.voltage = voltage;
            this.level = level;
            this.isCharging = isCharging;
            this.temperature = temperature;
            this.health = health;
        }

        // Getters and Setters for Battery
        public Double getVoltage() {
            return voltage;
        }

        public void setVoltage(Double voltage) {
            this.voltage = voltage;
        }

        public Double getLevel() {
            return level;
        }

        public void setLevel(Double level) {
            this.level = level;
        }

        public Boolean getCharging() {
            return isCharging;
        }

        public void setCharging(Boolean charging) {
            isCharging = charging;
        }

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }

        public String getHealth() {
            return health;
        }

        public void setHealth(String health) {
            this.health = health;
        }

        @Override
        public String toString() {
            return "Battery{" +
                    "voltage=" + voltage +
                    ", level=" + level +
                    ", isCharging=" + isCharging +
                    ", temperature=" + temperature +
                    ", health='" + health + '\'' +
                    '}';
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Battery battery = (Battery) o;
            return Objects.equals(voltage, battery.voltage) &&
                   Objects.equals(level, battery.level) &&
                   Objects.equals(isCharging, battery.isCharging) &&
                   Objects.equals(temperature, battery.temperature) &&
                   Objects.equals(health, battery.health);
        }

        @Override
        public int hashCode() {
            return Objects.hash(voltage, level, isCharging, temperature, health);
        }
    }
}
