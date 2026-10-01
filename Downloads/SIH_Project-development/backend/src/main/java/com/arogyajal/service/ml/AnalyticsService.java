package com.arogyajal.service.ml;

import com.arogyajal.model.SymptomReport;
import com.arogyajal.model.SymptomCluster;
import com.arogyajal.model.ManualWaterTest;
import com.arogyajal.model.OutbreakPrediction;
//import com.google.cloud.Timestamp;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for data analytics and insights generation.
 * Provides statistical analysis and trend detection.
 */
@Service
public class AnalyticsService {

    /**
     * Generate comprehensive analytics dashboard data
     */
    public Map<String, Object> generateDashboardAnalytics(List<SymptomReport> reports,
                                                          List<SymptomCluster> clusters,
                                                          List<ManualWaterTest> waterTests,
                                                          List<OutbreakPrediction> predictions) {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Overview statistics
        dashboard.put("overview", generateOverviewStats(reports, clusters, waterTests, predictions));
        
        // Trend analysis
        dashboard.put("trends", analyzeTrends(reports, clusters));
        
        // Geographic distribution
        dashboard.put("geographic", analyzeGeographicDistribution(reports, clusters));
        
        // Symptom analysis
        dashboard.put("symptoms", analyzeSymptoms(reports));
        
        // Water quality analysis
        dashboard.put("waterQuality", analyzeWaterQuality(waterTests));
        
        // Risk analysis
        dashboard.put("riskAnalysis", analyzeRiskDistribution(predictions, clusters));
        
        // Demographics
        dashboard.put("demographics", analyzeDemographics(reports));
        
        // Alerts and warnings
        dashboard.put("alerts", generateAlerts(clusters, predictions, waterTests));
        
        return dashboard;
    }

    /**
     * Generate overview statistics
     */
    private Map<String, Object> generateOverviewStats(List<SymptomReport> reports,
                                                      List<SymptomCluster> clusters,
                                                      List<ManualWaterTest> waterTests,
                                                      List<OutbreakPrediction> predictions) {
        Map<String, Object> overview = new HashMap<>();
        
        overview.put("totalReports", reports != null ? reports.size() : 0);
        overview.put("activeClusters", clusters != null ? 
            clusters.stream().filter(c -> "ACTIVE".equals(c.getStatus())).count() : 0);
        overview.put("totalWaterTests", waterTests != null ? waterTests.size() : 0);
        overview.put("activePredictions", predictions != null ?
            predictions.stream().filter(p -> "ACTIVE".equals(p.getStatus())).count() : 0);
        
        // Calculate rates
        if (reports != null && !reports.isEmpty()) {
            long criticalReports = reports.stream()
                .filter(r -> "CRITICAL".equals(r.getSeverity()) || "SEVERE".equals(r.getSeverity()))
                .count();
            overview.put("criticalReportRate", Math.round((criticalReports * 100.0) / reports.size()));
        }
        
        if (waterTests != null && !waterTests.isEmpty()) {
            long unsafeTests = waterTests.stream()
                .filter(t -> "UNSAFE".equals(t.getQualityStatus()) || 
                           "CONTAMINATED".equals(t.getQualityStatus()))
                .count();
            overview.put("unsafeWaterRate", Math.round((unsafeTests * 100.0) / waterTests.size()));
        }
        
        return overview;
    }

    /**
     * Analyze trends over time
     */
    private Map<String, Object> analyzeTrends(List<SymptomReport> reports,
                                              List<SymptomCluster> clusters) {
        Map<String, Object> trends = new HashMap<>();
        
        if (reports != null && reports.size() >= 7) {
            // Daily report trend (last 7 days)
            //Map<String, Integer> dailyReports = new LinkedHashMap<>();
            
            // Group by day - using intermediate variable to help type inference
            Map<?, Long> tempReportsByDay = reports.stream()
                .collect(Collectors.groupingBy(
                    r -> r.getReportedAt().getSeconds() / 86400L, // Days since epoch
                    Collectors.counting()
                ));
            
            // Convert to proper type
            Map<Long, Long> reportsByDay = new HashMap<>();
            for (Map.Entry<?, Long> entry : tempReportsByDay.entrySet()) {
                reportsByDay.put((Long) entry.getKey(), entry.getValue());
            }
            
            trends.put("dailyReportCounts", reportsByDay);
            
            // Calculate trend direction
            List<Long> sortedDays = new ArrayList<>(reportsByDay.keySet());
            Collections.sort(sortedDays);
            
            if (sortedDays.size() >= 2) {
                long recentAvg = reportsByDay.get(sortedDays.get(sortedDays.size() - 1));
                long olderAvg = reportsByDay.get(sortedDays.get(0));
                
                String trendDirection = recentAvg > olderAvg ? "INCREASING" : 
                                       recentAvg < olderAvg ? "DECREASING" : "STABLE";
                trends.put("trendDirection", trendDirection);
                
                double changePercent = olderAvg > 0 ? 
                    ((recentAvg - olderAvg) * 100.0) / olderAvg : 0;
                trends.put("changePercent", Math.round(changePercent * 100.0) / 100.0);
            }
        }
        
        // Cluster trend
        if (clusters != null && !clusters.isEmpty()) {
            long activeClusters = clusters.stream()
                .filter(c -> "ACTIVE".equals(c.getStatus()))
                .count();
            trends.put("activeClusterCount", activeClusters);
            
            double avgClusterScore = clusters.stream()
                .filter(c -> "ACTIVE".equals(c.getStatus()))
                .filter(c -> c.getClusterScore() != null)
                .mapToDouble(SymptomCluster::getClusterScore)
                .average()
                .orElse(0.0);
            trends.put("averageClusterScore", Math.round(avgClusterScore * 100.0) / 100.0);
        }
        
        return trends;
    }

    /**
     * Analyze geographic distribution
     */
    private Map<String, Object> analyzeGeographicDistribution(List<SymptomReport> reports,
                                                              List<SymptomCluster> clusters) {
        Map<String, Object> geographic = new HashMap<>();
        
        // Reports by location
        if (reports != null) {
            Map<String, Long> reportsByLocation = reports.stream()
                .collect(Collectors.groupingBy(
                    SymptomReport::getLocation,
                    Collectors.counting()
                ));
            geographic.put("reportsByLocation", reportsByLocation);
            
            // Top affected locations
            List<Map.Entry<String, Long>> topLocations = reportsByLocation.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .toList();
            geographic.put("topAffectedLocations", topLocations);
        }
        
        // Clusters by location
        if (clusters != null) {
            Map<String, Long> clustersByLocation = clusters.stream()
                .filter(c -> "ACTIVE".equals(c.getStatus()))
                .collect(Collectors.groupingBy(
                    SymptomCluster::getLocation,
                    Collectors.counting()
                ));
            geographic.put("clustersByLocation", clustersByLocation);
        }
        
        return geographic;
    }

    /**
     * Analyze symptom patterns
     */
    private Map<String, Object> analyzeSymptoms(List<SymptomReport> reports) {
        Map<String, Object> symptomAnalysis = new HashMap<>();
        
        if (reports == null || reports.isEmpty()) {
            return symptomAnalysis;
        }
        
        // Symptom frequency
        Map<String, Integer> symptomFrequency = new HashMap<>();
        reports.forEach(report -> {
            if (report.getSymptoms() != null) {
                report.getSymptoms().forEach(symptom -> 
                    symptomFrequency.put(symptom, symptomFrequency.getOrDefault(symptom, 0) + 1)
                );
            }
        });
        
        symptomAnalysis.put("symptomFrequency", symptomFrequency);
        
        // Top symptoms
        List<Map.Entry<String, Integer>> topSymptoms = symptomFrequency.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .toList();
        symptomAnalysis.put("topSymptoms", topSymptoms);
        
        // Severity distribution
        Map<String, Long> severityDist = reports.stream()
                .collect(Collectors.groupingBy(
                    SymptomReport::getSeverity,
                    Collectors.counting()
                ));
        symptomAnalysis.put("severityDistribution", severityDist);
        
        return symptomAnalysis;
    }

    /**
     * Analyze water quality
     */
    private Map<String, Object> analyzeWaterQuality(List<ManualWaterTest> waterTests) {
        Map<String, Object> waterAnalysis = new HashMap<>();
        
        if (waterTests == null || waterTests.isEmpty()) {
            return waterAnalysis;
        }
        
        // Quality status distribution
        Map<String, Long> qualityDist = waterTests.stream()
                .collect(Collectors.groupingBy(
                    ManualWaterTest::getQualityStatus,
                    Collectors.counting()
                ));
        waterAnalysis.put("qualityDistribution", qualityDist);
        
        // Water source analysis
        Map<String, Long> sourceDist = waterTests.stream()
                .filter(t -> t.getWaterSourceType() != null)
                .collect(Collectors.groupingBy(
                    ManualWaterTest::getWaterSourceType,
                    Collectors.counting()
                ));
        waterAnalysis.put("sourceDistribution", sourceDist);
        
        // Average parameters
        double avgPh = waterTests.stream()
                .filter(t -> t.getPh() != null)
                .mapToDouble(ManualWaterTest::getPh)
                .average()
                .orElse(0.0);
        waterAnalysis.put("averagePh", Math.round(avgPh * 100.0) / 100.0);
        
        double avgTurbidity = waterTests.stream()
                .filter(t -> t.getTurbidity() != null)
                .mapToDouble(ManualWaterTest::getTurbidity)
                .average()
                .orElse(0.0);
        waterAnalysis.put("averageTurbidity", Math.round(avgTurbidity * 100.0) / 100.0);
        
        // Unsafe sources
        List<String> unsafeSources = waterTests.stream()
                .filter(t -> "UNSAFE".equals(t.getQualityStatus()) || 
                           "CONTAMINATED".equals(t.getQualityStatus()))
                .map(ManualWaterTest::getWaterSourceId)
                .distinct()
                .toList();
        waterAnalysis.put("unsafeWaterSources", unsafeSources);
        
        return waterAnalysis;
    }

    /**
     * Analyze risk distribution
     */
    private Map<String, Object> analyzeRiskDistribution(List<OutbreakPrediction> predictions,
                                                        List<SymptomCluster> clusters) {
        Map<String, Object> riskAnalysis = new HashMap<>();
        
        // Prediction risk levels
        if (predictions != null) {
            Map<String, Long> riskLevels = predictions.stream()
                    .filter(p -> "ACTIVE".equals(p.getStatus()))
                    .collect(Collectors.groupingBy(
                        OutbreakPrediction::getRiskLevel,
                        Collectors.counting()
                    ));
            riskAnalysis.put("predictionRiskLevels", riskLevels);
            
            // Average risk score
            double avgRiskScore = predictions.stream()
                    .filter(p -> "ACTIVE".equals(p.getStatus()))
                    .mapToDouble(OutbreakPrediction::getRiskScore)
                    .average()
                    .orElse(0.0);
            riskAnalysis.put("averageRiskScore", Math.round(avgRiskScore * 100.0) / 100.0);
        }
        
        // Cluster severity
        if (clusters != null) {
            Map<String, Long> severityDist = clusters.stream()
                    .filter(c -> "ACTIVE".equals(c.getStatus()))
                    .filter(c -> c.getOverallSeverity() != null)
                    .collect(Collectors.groupingBy(
                        SymptomCluster::getOverallSeverity,
                        Collectors.counting()
                    ));
            riskAnalysis.put("clusterSeverityDistribution", severityDist);
        }
        
        return riskAnalysis;
    }

    /**
     * Analyze demographics
     */
    private Map<String, Object> analyzeDemographics(List<SymptomReport> reports) {
        Map<String, Object> demographics = new HashMap<>();
        
        if (reports == null || reports.isEmpty()) {
            return demographics;
        }
        
        // Age distribution
        Map<String, Long> ageGroups = reports.stream()
                .filter(r -> r.getPatientAge() != null)
                .collect(Collectors.groupingBy(
                    r -> getAgeGroup(r.getPatientAge()),
                    Collectors.counting()
                ));
        demographics.put("ageDistribution", ageGroups);
        
        // Gender distribution
        Map<String, Long> genderDist = reports.stream()
                .filter(r -> r.getPatientGender() != null)
                .collect(Collectors.groupingBy(
                    SymptomReport::getPatientGender,
                    Collectors.counting()
                ));
        demographics.put("genderDistribution", genderDist);
        
        return demographics;
    }

    /**
     * Generate alerts and warnings
     */
    private Map<String, Object> generateAlerts(List<SymptomCluster> clusters,
                                               List<OutbreakPrediction> predictions,
                                               List<ManualWaterTest> waterTests) {
        Map<String, Object> alerts = new HashMap<>();
        List<Map<String, Object>> activeAlerts = new ArrayList<>();
        
        // High-risk clusters
        if (clusters != null) {
            clusters.stream()
                    .filter(c -> "ACTIVE".equals(c.getStatus()))
                    .filter(c -> c.getAlertGenerated() != null && c.getAlertGenerated())
                    .forEach(c -> {
                        Map<String, Object> alert = new HashMap<>();
                        alert.put("type", "CLUSTER_ALERT");
                        alert.put("severity", c.getOverallSeverity());
                        alert.put("location", c.getLocation());
                        alert.put("reportCount", c.getReportCount());
                        alert.put("message", "High-risk symptom cluster detected");
                        activeAlerts.add(alert);
                    });
        }
        
        // High-risk predictions
        if (predictions != null) {
            predictions.stream()
                    .filter(p -> "ACTIVE".equals(p.getStatus()))
                    .filter(p -> "HIGH".equals(p.getRiskLevel()) || "CRITICAL".equals(p.getRiskLevel()))
                    .forEach(p -> {
                        Map<String, Object> alert = new HashMap<>();
                        alert.put("type", "OUTBREAK_PREDICTION");
                        alert.put("severity", p.getRiskLevel());
                        alert.put("location", p.getLocation());
                        alert.put("riskScore", p.getRiskScore());
                        alert.put("message", "High outbreak risk predicted");
                        activeAlerts.add(alert);
                    });
        }
        
        // Contaminated water sources
        if (waterTests != null) {
            waterTests.stream()
                    .filter(t -> "CONTAMINATED".equals(t.getQualityStatus()))
                    .forEach(t -> {
                        Map<String, Object> alert = new HashMap<>();
                        alert.put("type", "WATER_CONTAMINATION");
                        alert.put("severity", "HIGH");
                        alert.put("location", t.getLocation());
                        alert.put("waterSource", t.getWaterSourceId());
                        alert.put("message", "Contaminated water source detected");
                        activeAlerts.add(alert);
                    });
        }
        
        alerts.put("activeAlerts", activeAlerts);
        alerts.put("alertCount", activeAlerts.size());
        
        return alerts;
    }

    /**
     * Get age group
     */
    private String getAgeGroup(Integer age) {
        if (age < 5) return "0-5";
        if (age < 18) return "6-18";
        if (age < 35) return "19-35";
        if (age < 60) return "36-60";
        return "60+";
    }
}
