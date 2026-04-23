package com.arogyajal.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.ServerTimestamp;
import com.arogyajal.config.TimestampSerializer;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import com.google.cloud.Timestamp;

public class SensorReading {
    
    @DocumentId
    private String id;
    private String sensorId;
    private String location;
    
    // Water quality parameters
    @com.google.cloud.firestore.annotation.PropertyName("ph")
    private Double ph;
    
    @com.google.cloud.firestore.annotation.PropertyName("temperature")
    private Double temperature;
    
    @com.google.cloud.firestore.annotation.PropertyName("turbidity")
    private Double turbidity;
    private Double dissolvedOxygen;
    private Double conductivity;
    private Double totalDissolvedSolids;
    private Double chlorine;
    private Double hardness;
    
    // Water level and flow
    private Double waterLevel;
    private Double flowRate;
    
    // Timestamp
    @ServerTimestamp
    @JsonSerialize(using = TimestampSerializer.class)
    private Timestamp timestamp;
    
    // Quality status
    private String qualityStatus; // GOOD, WARNING, CRITICAL
    private Double wqi; // Water Quality Index (0-100)
    private String severity; // Overall severity: CRITICAL, HIGH, MEDIUM, LOW
    private String notes;
    
    // Device status (IoT device health)
    private Double batteryLevel; // Battery percentage (0-100)
    private Double batteryVoltage; // Battery voltage (e.g., 3.7V)
    private Integer signalStrength; // WiFi/Network signal strength in dBm (e.g., -65)
    private Long uptime; // Device uptime in seconds
    private Timestamp lastMaintenance; // Last maintenance date
    
    // Constructors
    public SensorReading() {
    }
    
    public SensorReading(String id, String sensorId, String location, Double ph, Double temperature, 
                        Double turbidity, Double dissolvedOxygen, Double conductivity, 
                        Double totalDissolvedSolids, Double chlorine, Double hardness, 
                        Double waterLevel, Double flowRate, Timestamp timestamp, 
                        String qualityStatus, String notes) {
        this.id = id;
        this.sensorId = sensorId;
        this.location = location;
        this.ph = ph;
        this.temperature = temperature;
        this.turbidity = turbidity;
        this.dissolvedOxygen = dissolvedOxygen;
        this.conductivity = conductivity;
        this.totalDissolvedSolids = totalDissolvedSolids;
        this.chlorine = chlorine;
        this.hardness = hardness;
        this.waterLevel = waterLevel;
        this.flowRate = flowRate;
        this.timestamp = timestamp;
        this.qualityStatus = qualityStatus;
        this.notes = notes;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getSensorId() {
        return sensorId;
    }
    
    public void setSensorId(String sensorId) {
        this.sensorId = sensorId;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public Double getPh() {
        return ph;
    }
    
    public void setPh(Double ph) {
        this.ph = ph;
    }
    
    public Double getTemperature() {
        return temperature;
    }
    
    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }
    
    public Double getTurbidity() {
        return turbidity;
    }
    
    public void setTurbidity(Double turbidity) {
        this.turbidity = turbidity;
    }
    
    public Double getDissolvedOxygen() {
        return dissolvedOxygen;
    }
    
    public void setDissolvedOxygen(Double dissolvedOxygen) {
        this.dissolvedOxygen = dissolvedOxygen;
    }
    
    public Double getConductivity() {
        return conductivity;
    }
    
    public void setConductivity(Double conductivity) {
        this.conductivity = conductivity;
    }
    
    public Double getTotalDissolvedSolids() {
        return totalDissolvedSolids;
    }
    
    public void setTotalDissolvedSolids(Double totalDissolvedSolids) {
        this.totalDissolvedSolids = totalDissolvedSolids;
    }
    
    public Double getChlorine() {
        return chlorine;
    }
    
    public void setChlorine(Double chlorine) {
        this.chlorine = chlorine;
    }
    
    public Double getHardness() {
        return hardness;
    }
    
    public void setHardness(Double hardness) {
        this.hardness = hardness;
    }
    
    public Double getWaterLevel() {
        return waterLevel;
    }
    
    public void setWaterLevel(Double waterLevel) {
        this.waterLevel = waterLevel;
    }
    
    public Double getFlowRate() {
        return flowRate;
    }
    
    public void setFlowRate(Double flowRate) {
        this.flowRate = flowRate;
    }
    
    public Timestamp getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getQualityStatus() {
        return qualityStatus;
    }
    
    public void setQualityStatus(String qualityStatus) {
        this.qualityStatus = qualityStatus;
    }
    
    public Double getWqi() {
        return wqi;
    }
    
    public void setWqi(Double wqi) {
        this.wqi = wqi;
    }
    
    public String getSeverity() {
        return severity;
    }
    
    public void setSeverity(String severity) {
        this.severity = severity;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    // Battery and device status getters/setters
    public Double getBatteryLevel() {
        return batteryLevel;
    }
    
    public void setBatteryLevel(Double batteryLevel) {
        this.batteryLevel = batteryLevel;
    }
    
    public Double getBatteryVoltage() {
        return batteryVoltage;
    }
    
    public void setBatteryVoltage(Double batteryVoltage) {
        this.batteryVoltage = batteryVoltage;
    }
    
    public Integer getSignalStrength() {
        return signalStrength;
    }
    
    public void setSignalStrength(Integer signalStrength) {
        this.signalStrength = signalStrength;
    }
    
    public Long getUptime() {
        return uptime;
    }
    
    public void setUptime(Long uptime) {
        this.uptime = uptime;
    }
    
    public Timestamp getLastMaintenance() {
        return lastMaintenance;
    }
    
    public void setLastMaintenance(Timestamp lastMaintenance) {
        this.lastMaintenance = lastMaintenance;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SensorReading that = (SensorReading) o;
        return (id == null ? that.id == null : id.equals(that.id)) &&
               (sensorId == null ? that.sensorId == null : sensorId.equals(that.sensorId)) &&
               (location == null ? that.location == null : location.equals(that.location)) &&
               (ph == null ? that.ph == null : ph.equals(that.ph)) &&
               (temperature == null ? that.temperature == null : temperature.equals(that.temperature)) &&
               (turbidity == null ? that.turbidity == null : turbidity.equals(that.turbidity)) &&
               (dissolvedOxygen == null ? that.dissolvedOxygen == null : dissolvedOxygen.equals(that.dissolvedOxygen)) &&
               (conductivity == null ? that.conductivity == null : conductivity.equals(that.conductivity)) &&
               (totalDissolvedSolids == null ? that.totalDissolvedSolids == null : totalDissolvedSolids.equals(that.totalDissolvedSolids)) &&
               (chlorine == null ? that.chlorine == null : chlorine.equals(that.chlorine)) &&
               (hardness == null ? that.hardness == null : hardness.equals(that.hardness)) &&
               (waterLevel == null ? that.waterLevel == null : waterLevel.equals(that.waterLevel)) &&
               (flowRate == null ? that.flowRate == null : flowRate.equals(that.flowRate)) &&
               (timestamp == null ? that.timestamp == null : timestamp.equals(that.timestamp)) &&
               (qualityStatus == null ? that.qualityStatus == null : qualityStatus.equals(that.qualityStatus)) &&
               (notes == null ? that.notes == null : notes.equals(that.notes));
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + (id == null ? 0 : id.hashCode());
        result = prime * result + (sensorId == null ? 0 : sensorId.hashCode());
        result = prime * result + (location == null ? 0 : location.hashCode());
        result = prime * result + (ph == null ? 0 : ph.hashCode());
        result = prime * result + (temperature == null ? 0 : temperature.hashCode());
        result = prime * result + (turbidity == null ? 0 : turbidity.hashCode());
        result = prime * result + (dissolvedOxygen == null ? 0 : dissolvedOxygen.hashCode());
        result = prime * result + (conductivity == null ? 0 : conductivity.hashCode());
        result = prime * result + (totalDissolvedSolids == null ? 0 : totalDissolvedSolids.hashCode());
        result = prime * result + (chlorine == null ? 0 : chlorine.hashCode());
        result = prime * result + (hardness == null ? 0 : hardness.hashCode());
        result = prime * result + (waterLevel == null ? 0 : waterLevel.hashCode());
        result = prime * result + (flowRate == null ? 0 : flowRate.hashCode());
        result = prime * result + (timestamp == null ? 0 : timestamp.hashCode());
        result = prime * result + (qualityStatus == null ? 0 : qualityStatus.hashCode());
        result = prime * result + (notes == null ? 0 : notes.hashCode());
        return result;
    }
    
    @Override
    public String toString() {
        return "SensorReading{" +
               "id='" + id + '\'' +
               ", sensorId='" + sensorId + '\'' +
               ", location='" + location + '\'' +
               ", ph=" + ph +
               ", temperature=" + temperature +
               ", turbidity=" + turbidity +
               ", dissolvedOxygen=" + dissolvedOxygen +
               ", conductivity=" + conductivity +
               ", totalDissolvedSolids=" + totalDissolvedSolids +
               ", chlorine=" + chlorine +
               ", hardness=" + hardness +
               ", waterLevel=" + waterLevel +
               ", flowRate=" + flowRate +
               ", timestamp=" + timestamp +
               ", qualityStatus='" + qualityStatus + '\'' +
               ", notes='" + notes + '\'' +
               '}';
    }
    
    // Builder pattern implementation
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String id;
        private String sensorId;
        private String location;
        private Double ph;
        private Double temperature;
        private Double turbidity;
        private Double dissolvedOxygen;
        private Double conductivity;
        private Double totalDissolvedSolids;
        private Double chlorine;
        private Double hardness;
        private Double waterLevel;
        private Double flowRate;
        private Timestamp timestamp = Timestamp.now();
        private String qualityStatus;
        private Double wqi;
        private String severity;
        private String notes;
        
        public Builder id(String id) {
            this.id = id;
            return this;
        }
        
        public Builder sensorId(String sensorId) {
            this.sensorId = sensorId;
            return this;
        }
        
        public Builder location(String location) {
            this.location = location;
            return this;
        }
        
        public Builder ph(Double ph) {
            this.ph = ph;
            return this;
        }
        
        public Builder temperature(Double temperature) {
            this.temperature = temperature;
            return this;
        }
        
        public Builder turbidity(Double turbidity) {
            this.turbidity = turbidity;
            return this;
        }
        
        public Builder dissolvedOxygen(Double dissolvedOxygen) {
            this.dissolvedOxygen = dissolvedOxygen;
            return this;
        }
        
        public Builder conductivity(Double conductivity) {
            this.conductivity = conductivity;
            return this;
        }
        
        public Builder totalDissolvedSolids(Double totalDissolvedSolids) {
            this.totalDissolvedSolids = totalDissolvedSolids;
            return this;
        }
        
        public Builder chlorine(Double chlorine) {
            this.chlorine = chlorine;
            return this;
        }
        
        public Builder hardness(Double hardness) {
            this.hardness = hardness;
            return this;
        }
        
        public Builder waterLevel(Double waterLevel) {
            this.waterLevel = waterLevel;
            return this;
        }
        
        public Builder flowRate(Double flowRate) {
            this.flowRate = flowRate;
            return this;
        }
        
        public Builder timestamp(Timestamp timestamp) {
            this.timestamp = timestamp;
            return this;
        }
        
        public Builder qualityStatus(String qualityStatus) {
            this.qualityStatus = qualityStatus;
            return this;
        }
        
        public Builder wqi(Double wqi) {
            this.wqi = wqi;
            return this;
        }
        
        public Builder severity(String severity) {
            this.severity = severity;
            return this;
        }
        
        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }
        
        public SensorReading build() {
            SensorReading reading = new SensorReading();
            reading.setId(id);
            reading.setSensorId(sensorId);
            reading.setLocation(location);
            reading.setPh(ph);
            reading.setTemperature(temperature);
            reading.setTurbidity(turbidity);
            reading.setDissolvedOxygen(dissolvedOxygen);
            reading.setConductivity(conductivity);
            reading.setTotalDissolvedSolids(totalDissolvedSolids);
            reading.setChlorine(chlorine);
            reading.setHardness(hardness);
            reading.setWaterLevel(waterLevel);
            reading.setFlowRate(flowRate);
            reading.setTimestamp(timestamp);
            reading.setQualityStatus(qualityStatus);
            reading.setWqi(wqi);
            reading.setSeverity(severity);
            reading.setNotes(notes);
            return reading;
        }
    }
}
