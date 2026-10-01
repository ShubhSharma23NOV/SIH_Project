package com.arogyajal.service;

import com.arogyajal.model.SymptomCluster;
import com.arogyajal.repository.SymptomClusterRepository;
import com.google.cloud.Timestamp;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Service for SymptomCluster business logic.
 * Handles cluster creation, analysis, and management.
 */
@Service
public class SymptomClusterService {

    private final SymptomClusterRepository clusterRepository;

    // Cluster thresholds
    private static final int MIN_REPORTS_FOR_CLUSTER = 3;
    private static final double HIGH_CLUSTER_SCORE_THRESHOLD = 75.0;
    private static final int ALERT_REPORT_THRESHOLD = 5;

    public SymptomClusterService(SymptomClusterRepository clusterRepository) {
        this.clusterRepository = clusterRepository;
    }

    /**
     * Create a new symptom cluster
     */
    public SymptomCluster createCluster(SymptomCluster cluster) throws ExecutionException, InterruptedException {
        // Set timestamps and defaults
        Timestamp now = Timestamp.now();
        if (cluster.getDetectedAt() == null) {
            cluster = SymptomCluster.builder()
                    .id(cluster.getId() != null ? cluster.getId() : UUID.randomUUID().toString())
                    .location(cluster.getLocation())
                    .centroid(cluster.getCentroid())
                    .radiusKm(cluster.getRadiusKm())
                    .reportCount(cluster.getReportCount())
                    .reportIds(cluster.getReportIds())
                    .firstReportDate(cluster.getFirstReportDate())
                    .lastReportDate(cluster.getLastReportDate())
                    .durationHours(cluster.getDurationHours())
                    .symptomDistribution(cluster.getSymptomDistribution())
                    .dominantSymptoms(cluster.getDominantSymptoms())
                    .severityDistribution(cluster.getSeverityDistribution())
                    .overallSeverity(cluster.getOverallSeverity())
                    .affectedPopulation(cluster.getAffectedPopulation())
                    .ageDistribution(cluster.getAgeDistribution())
                    .genderDistribution(cluster.getGenderDistribution())
                    .waterSourceDistribution(cluster.getWaterSourceDistribution())
                    .primaryWaterSource(cluster.getPrimaryWaterSource())
                    .status(cluster.getStatus() != null ? cluster.getStatus() : "ACTIVE")
                    .detectionMethod(cluster.getDetectionMethod())
                    .clusterScore(cluster.getClusterScore())
                    .detectedAt(now)
                    .updatedAt(now)
                    .build();
        }

        // Validate cluster
        validateCluster(cluster);

        // Calculate cluster score if not provided
        if (cluster.getClusterScore() == null) {
            double score = calculateClusterScore(cluster);
            cluster = SymptomCluster.builder()
                    .id(cluster.getId())
                    .location(cluster.getLocation())
                    .centroid(cluster.getCentroid())
                    .radiusKm(cluster.getRadiusKm())
                    .reportCount(cluster.getReportCount())
                    .reportIds(cluster.getReportIds())
                    .firstReportDate(cluster.getFirstReportDate())
                    .lastReportDate(cluster.getLastReportDate())
                    .durationHours(cluster.getDurationHours())
                    .symptomDistribution(cluster.getSymptomDistribution())
                    .dominantSymptoms(cluster.getDominantSymptoms())
                    .severityDistribution(cluster.getSeverityDistribution())
                    .overallSeverity(cluster.getOverallSeverity())
                    .affectedPopulation(cluster.getAffectedPopulation())
                    .ageDistribution(cluster.getAgeDistribution())
                    .genderDistribution(cluster.getGenderDistribution())
                    .waterSourceDistribution(cluster.getWaterSourceDistribution())
                    .primaryWaterSource(cluster.getPrimaryWaterSource())
                    .status(cluster.getStatus())
                    .detectionMethod(cluster.getDetectionMethod())
                    .clusterScore(score)
                    .alertGenerated(score >= HIGH_CLUSTER_SCORE_THRESHOLD || 
                                   cluster.getReportCount() >= ALERT_REPORT_THRESHOLD)
                    .detectedAt(cluster.getDetectedAt())
                    .updatedAt(cluster.getUpdatedAt())
                    .build();
        }

        // Save to repository
        String id = clusterRepository.save(cluster);
        return clusterRepository.findById(id);
    }

    /**
     * Get cluster by ID
     */
    public SymptomCluster getClusterById(String id) throws ExecutionException, InterruptedException {
        SymptomCluster cluster = clusterRepository.findById(id);
        if (cluster == null) {
            throw new IllegalArgumentException("Cluster not found with ID: " + id);
        }
        return cluster;
    }

    /**
     * Get all clusters
     */
    public List<SymptomCluster> getAllClusters() throws ExecutionException, InterruptedException {
        return clusterRepository.findAll();
    }

    /**
     * Get clusters by location
     */
    public List<SymptomCluster> getClustersByLocation(String location) throws ExecutionException, InterruptedException {
        return clusterRepository.findByLocation(location);
    }

    /**
     * Get active clusters
     */
    public List<SymptomCluster> getActiveClusters() throws ExecutionException, InterruptedException {
        return clusterRepository.findActiveClusters();
    }

    /**
     * Get active clusters by location
     */
    public List<SymptomCluster> getActiveClustersByLocation(String location) throws ExecutionException, InterruptedException {
        return clusterRepository.findActiveByLocation(location);
    }

    /**
     * Get high-severity clusters
     */
    public List<SymptomCluster> getHighSeverityClusters() throws ExecutionException, InterruptedException {
        return clusterRepository.findHighSeverityClusters();
    }

    /**
     * Get clusters by severity
     */
    public List<SymptomCluster> getClustersBySeverity(String severity) throws ExecutionException, InterruptedException {
        validateSeverity(severity);
        return clusterRepository.findBySeverity(severity);
    }

    /**
     * Get clusters by detection method
     */
    public List<SymptomCluster> getClustersByDetectionMethod(String detectionMethod) throws ExecutionException, InterruptedException {
        validateDetectionMethod(detectionMethod);
        return clusterRepository.findByDetectionMethod(detectionMethod);
    }

    /**
     * Get clusters with alerts
     */
    public List<SymptomCluster> getClustersWithAlerts() throws ExecutionException, InterruptedException {
        return clusterRepository.findClustersWithAlerts();
    }

    /**
     * Get clusters by water source
     */
    public List<SymptomCluster> getClustersByWaterSource(String waterSource) throws ExecutionException, InterruptedException {
        return clusterRepository.findByWaterSource(waterSource);
    }

    /**
     * Get high-score clusters
     */
    public List<SymptomCluster> getHighScoreClusters(double minScore) throws ExecutionException, InterruptedException {
        return clusterRepository.findHighScoreClusters(minScore);
    }

    /**
     * Update cluster status
     */
    public void updateClusterStatus(String id, String status) throws ExecutionException, InterruptedException {
        validateStatus(status);
        
        // Verify cluster exists
        getClusterById(id);
        
        clusterRepository.updateStatus(id, status);
    }

    /**
     * Add report to cluster
     */
    public void addReportToCluster(String clusterId, String reportId) throws ExecutionException, InterruptedException {
        // Verify cluster exists
        //SymptomCluster cluster = getClusterById(clusterId);
        
        // Add report
        clusterRepository.addReport(clusterId, reportId);
        
        // Recalculate cluster score
        SymptomCluster updatedCluster = getClusterById(clusterId);
        double newScore = calculateClusterScore(updatedCluster);
        
        // Update cluster with new score
        updatedCluster = SymptomCluster.builder()
                .id(updatedCluster.getId())
                .location(updatedCluster.getLocation())
                .centroid(updatedCluster.getCentroid())
                .radiusKm(updatedCluster.getRadiusKm())
                .reportCount(updatedCluster.getReportCount())
                .reportIds(updatedCluster.getReportIds())
                .firstReportDate(updatedCluster.getFirstReportDate())
                .lastReportDate(Timestamp.now())
                .durationHours(updatedCluster.getDurationHours())
                .symptomDistribution(updatedCluster.getSymptomDistribution())
                .dominantSymptoms(updatedCluster.getDominantSymptoms())
                .severityDistribution(updatedCluster.getSeverityDistribution())
                .overallSeverity(updatedCluster.getOverallSeverity())
                .affectedPopulation(updatedCluster.getAffectedPopulation())
                .ageDistribution(updatedCluster.getAgeDistribution())
                .genderDistribution(updatedCluster.getGenderDistribution())
                .waterSourceDistribution(updatedCluster.getWaterSourceDistribution())
                .primaryWaterSource(updatedCluster.getPrimaryWaterSource())
                .status(updatedCluster.getStatus())
                .detectionMethod(updatedCluster.getDetectionMethod())
                .clusterScore(newScore)
                .alertGenerated(newScore >= HIGH_CLUSTER_SCORE_THRESHOLD || 
                               updatedCluster.getReportCount() >= ALERT_REPORT_THRESHOLD)
                .detectedAt(updatedCluster.getDetectedAt())
                .updatedAt(Timestamp.now())
                .build();
        
        clusterRepository.update(updatedCluster);
    }

    /**
     * Update cluster
     */
    public SymptomCluster updateCluster(SymptomCluster cluster) throws ExecutionException, InterruptedException {
        // Verify cluster exists
        SymptomCluster existing = getClusterById(cluster.getId());
        
        // Validate updated cluster
        validateCluster(cluster);
        
        // Recalculate cluster score
        double score = calculateClusterScore(cluster);
        
        // Update timestamp and score
        cluster = SymptomCluster.builder()
                .id(cluster.getId())
                .location(cluster.getLocation())
                .centroid(cluster.getCentroid())
                .radiusKm(cluster.getRadiusKm())
                .reportCount(cluster.getReportCount())
                .reportIds(cluster.getReportIds())
                .firstReportDate(cluster.getFirstReportDate())
                .lastReportDate(cluster.getLastReportDate())
                .durationHours(cluster.getDurationHours())
                .symptomDistribution(cluster.getSymptomDistribution())
                .dominantSymptoms(cluster.getDominantSymptoms())
                .severityDistribution(cluster.getSeverityDistribution())
                .overallSeverity(cluster.getOverallSeverity())
                .affectedPopulation(cluster.getAffectedPopulation())
                .ageDistribution(cluster.getAgeDistribution())
                .genderDistribution(cluster.getGenderDistribution())
                .waterSourceDistribution(cluster.getWaterSourceDistribution())
                .primaryWaterSource(cluster.getPrimaryWaterSource())
                .status(cluster.getStatus())
                .detectionMethod(cluster.getDetectionMethod())
                .clusterScore(score)
                .alertGenerated(score >= HIGH_CLUSTER_SCORE_THRESHOLD || 
                               cluster.getReportCount() >= ALERT_REPORT_THRESHOLD)
                .detectedAt(existing.getDetectedAt())
                .updatedAt(Timestamp.now())
                .build();
        
        clusterRepository.update(cluster);
        return clusterRepository.findById(cluster.getId());
    }

    /**
     * Delete cluster
     */
    public void deleteCluster(String id) throws ExecutionException, InterruptedException {
        // Verify cluster exists
        getClusterById(id);
        
        clusterRepository.delete(id);
    }

    /**
     * Get cluster statistics by location
     */
    public Map<String, Object> getClusterStatsByLocation(String location) throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = clusterRepository.findActiveByLocation(location);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalClusters", clusters.size());
        stats.put("totalReports", clusters.stream().mapToInt(SymptomCluster::getReportCount).sum());
        stats.put("averageClusterScore", clusters.stream()
                .filter(c -> c.getClusterScore() != null)
                .mapToDouble(SymptomCluster::getClusterScore)
                .average()
                .orElse(0.0));
        stats.put("highSeverityCount", clusters.stream()
                .filter(c -> "SEVERE".equals(c.getOverallSeverity()) || "CRITICAL".equals(c.getOverallSeverity()))
                .count());
        stats.put("alertCount", clusters.stream().filter(SymptomCluster::getAlertGenerated).count());
        
        // Severity distribution
        Map<String, Long> severityDist = clusters.stream()
                .filter(c -> c.getOverallSeverity() != null)
                .collect(Collectors.groupingBy(SymptomCluster::getOverallSeverity, Collectors.counting()));
        stats.put("severityDistribution", severityDist);
        
        // Detection method distribution
        Map<String, Long> methodDist = clusters.stream()
                .filter(c -> c.getDetectionMethod() != null)
                .collect(Collectors.groupingBy(SymptomCluster::getDetectionMethod, Collectors.counting()));
        stats.put("detectionMethodDistribution", methodDist);
        
        return stats;
    }

    /**
     * Get overall cluster statistics
     */
    public Map<String, Object> getOverallStats() throws ExecutionException, InterruptedException {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalClusters", clusterRepository.findAll().size());
        stats.put("activeClusters", clusterRepository.countActiveClusters());
        stats.put("highSeverityClusters", clusterRepository.countHighSeverityClusters());
        
        List<SymptomCluster> allClusters = clusterRepository.findAll();
        stats.put("averageReportsPerCluster", allClusters.stream()
                .mapToInt(SymptomCluster::getReportCount)
                .average()
                .orElse(0.0));
        stats.put("averageClusterScore", allClusters.stream()
                .filter(c -> c.getClusterScore() != null)
                .mapToDouble(SymptomCluster::getClusterScore)
                .average()
                .orElse(0.0));
        
        return stats;
    }

    /**
     * Resolve old clusters
     */
    public int resolveOldClusters(int daysOld) throws ExecutionException, InterruptedException {
        List<SymptomCluster> activeClusters = clusterRepository.findActiveClusters();
        Timestamp cutoffDate = Timestamp.ofTimeSecondsAndNanos(
                Timestamp.now().getSeconds() - (daysOld * 24 * 60 * 60), 0);
        
        int resolvedCount = 0;
        for (SymptomCluster cluster : activeClusters) {
            if (cluster.getLastReportDate() != null && 
                cluster.getLastReportDate().compareTo(cutoffDate) < 0) {
                clusterRepository.updateStatus(cluster.getId(), "RESOLVED");
                resolvedCount++;
            }
        }
        
        return resolvedCount;
    }

    /**
     * Calculate cluster score based on multiple factors
     */
    private double calculateClusterScore(SymptomCluster cluster) {
        double score = 0.0;
        
        // Factor 1: Report count (0-30 points)
        int reportCount = cluster.getReportCount();
        score += Math.min(reportCount * 3, 30);
        
        // Factor 2: Severity (0-30 points)
        if (cluster.getOverallSeverity() != null) {
            switch (cluster.getOverallSeverity()) {
                case "CRITICAL": score += 30; break;
                case "SEVERE": score += 25; break;
                case "MODERATE": score += 15; break;
                case "MILD": score += 5; break;
            }
        }
        
        // Factor 3: Duration (0-20 points) - shorter duration = higher score
        if (cluster.getDurationHours() != null) {
            if (cluster.getDurationHours() <= 24) {
                score += 20;
            } else if (cluster.getDurationHours() <= 48) {
                score += 15;
            } else if (cluster.getDurationHours() <= 72) {
                score += 10;
            } else {
                score += 5;
            }
        }
        
        // Factor 4: Affected population (0-20 points)
        if (cluster.getAffectedPopulation() != null) {
            int population = cluster.getAffectedPopulation();
            if (population >= 1000) {
                score += 20;
            } else if (population >= 500) {
                score += 15;
            } else if (population >= 100) {
                score += 10;
            } else {
                score += 5;
            }
        }
        
        return Math.min(score, 100.0); // Cap at 100
    }

    /**
     * Validate cluster data
     */
    private void validateCluster(SymptomCluster cluster) {
        if (cluster.getLocation() == null || cluster.getLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("Location is required");
        }
        
        if (cluster.getReportCount() == null || cluster.getReportCount() < MIN_REPORTS_FOR_CLUSTER) {
            throw new IllegalArgumentException("Cluster must have at least " + MIN_REPORTS_FOR_CLUSTER + " reports");
        }
        
        if (cluster.getReportIds() == null || cluster.getReportIds().isEmpty()) {
            throw new IllegalArgumentException("Report IDs are required");
        }
        
        if (cluster.getRadiusKm() != null && cluster.getRadiusKm() < 0) {
            throw new IllegalArgumentException("Radius cannot be negative");
        }
        
        if (cluster.getOverallSeverity() != null) {
            validateSeverity(cluster.getOverallSeverity());
        }
        
        if (cluster.getDetectionMethod() != null) {
            validateDetectionMethod(cluster.getDetectionMethod());
        }
    }

    /**
     * Validate severity
     */
    private void validateSeverity(String severity) {
        List<String> validSeverities = Arrays.asList("MILD", "MODERATE", "SEVERE", "CRITICAL");
        if (!validSeverities.contains(severity)) {
            throw new IllegalArgumentException("Invalid severity. Must be one of: " + validSeverities);
        }
    }

    /**
     * Validate detection method
     */
    private void validateDetectionMethod(String detectionMethod) {
        List<String> validMethods = Arrays.asList("SPATIAL", "TEMPORAL", "HYBRID", "MANUAL");
        if (!validMethods.contains(detectionMethod)) {
            throw new IllegalArgumentException("Invalid detection method. Must be one of: " + validMethods);
        }
    }

    /**
     * Validate status
     */
    private void validateStatus(String status) {
        List<String> validStatuses = Arrays.asList("ACTIVE", "RESOLVED", "ARCHIVED", "INVESTIGATING");
        if (!validStatuses.contains(status)) {
            throw new IllegalArgumentException("Invalid status. Must be one of: " + validStatuses);
        }
    }
}
