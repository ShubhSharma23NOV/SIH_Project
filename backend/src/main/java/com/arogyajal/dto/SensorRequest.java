package com.arogyajal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import java.util.Objects;

public class SensorRequest {
    
    @NotBlank(message = "Sensor ID is required")
    private String sensorId;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    // Water quality parameters with validation
    @DecimalMin(value = "0.0", message = "pH must be between 0 and 14")
    @DecimalMax(value = "14.0", message = "pH must be between 0 and 14")
    private Double ph;
    
    @DecimalMin(value = "-10.0", message = "Temperature must be reasonable")
    @DecimalMax(value = "100.0", message = "Temperature must be reasonable")
    private Double temperature;
    
    @DecimalMin(value = "0.0", message = "Turbidity must be positive")
    private Double turbidity;
    
    @DecimalMin(value = "0.0", message = "Dissolved oxygen must be positive")
    private Double dissolvedOxygen;
    
    @DecimalMin(value = "0.0", message = "Conductivity must be positive")
    private Double conductivity;
    
    @DecimalMin(value = "0.0", message = "Total dissolved solids must be positive")
    private Double totalDissolvedSolids;
    
    @DecimalMin(value = "0.0", message = "Chlorine must be positive")
    private Double chlorine;
    
    @DecimalMin(value = "0.0", message = "Hardness must be positive")
    private Double hardness;
    
    // Water level and flow
    @DecimalMin(value = "0.0", message = "Water level must be positive")
    private Double waterLevel;
    
    @DecimalMin(value = "0.0", message = "Flow rate must be positive")
    private Double flowRate;
    
    private String notes;

    public SensorRequest() {
    }

    public SensorRequest(String sensorId, String location, Double ph, Double temperature, 
                        Double turbidity, Double dissolvedOxygen, Double conductivity,
                        Double totalDissolvedSolids, Double chlorine, Double hardness,
                        Double waterLevel, Double flowRate, String notes) {
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
        this.notes = notes;
    }

    // Getters and Setters
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SensorRequest that = (SensorRequest) o;
        return Objects.equals(sensorId, that.sensorId) &&
               Objects.equals(location, that.location) &&
               Objects.equals(ph, that.ph) &&
               Objects.equals(temperature, that.temperature) &&
               Objects.equals(turbidity, that.turbidity) &&
               Objects.equals(dissolvedOxygen, that.dissolvedOxygen) &&
               Objects.equals(conductivity, that.conductivity) &&
               Objects.equals(totalDissolvedSolids, that.totalDissolvedSolids) &&
               Objects.equals(chlorine, that.chlorine) &&
               Objects.equals(hardness, that.hardness) &&
               Objects.equals(waterLevel, that.waterLevel) &&
               Objects.equals(flowRate, that.flowRate) &&
               Objects.equals(notes, that.notes);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sensorId, location, ph, temperature, turbidity, dissolvedOxygen,
                          conductivity, totalDissolvedSolids, chlorine, hardness, waterLevel,
                          flowRate, notes);
    }

    // toString
    @Override
    public String toString() {
        return "SensorRequest{" +
               "sensorId='" + sensorId + '\'' +
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
               ", notes='" + notes + '\'' +
               '}';
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
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
        private String notes;

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

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public SensorRequest build() {
            return new SensorRequest(sensorId, location, ph, temperature, turbidity, dissolvedOxygen,
                                  conductivity, totalDissolvedSolids, chlorine, hardness, waterLevel,
                                  flowRate, notes);
        }
    }
}
