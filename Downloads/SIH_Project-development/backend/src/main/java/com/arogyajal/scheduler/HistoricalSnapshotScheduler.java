package com.arogyajal.scheduler;

import com.arogyajal.service.HistoricalDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler for saving historical snapshots
 * Runs every hour to maintain trend analysis data
 */
@Component
public class HistoricalSnapshotScheduler {
    
    private static final Logger logger = LoggerFactory.getLogger(HistoricalSnapshotScheduler.class);
    
    private final HistoricalDataService historicalDataService;
    private int snapshotCount = 0;
    
    public HistoricalSnapshotScheduler(HistoricalDataService historicalDataService) {
        this.historicalDataService = historicalDataService;
    }
    
    /**
     * Save historical snapshot every hour
     * Maintains rolling 7-day history for trend analysis
     */
    @Scheduled(fixedRate = 3600000, initialDelay = 60000) // Every hour, 1 min initial delay
    public void saveHourlySnapshot() {
        snapshotCount++;
        logger.info("📸 Saving historical snapshot #{}", snapshotCount);
        
        try {
            // Save snapshot for North East India region
            historicalDataService.saveCurrentSnapshot("North East India");
            
            logger.info("✅ Historical snapshot #{} saved successfully", snapshotCount);
            
        } catch (Exception e) {
            logger.error("❌ Error saving historical snapshot: {}", e.getMessage(), e);
        }
    }
}
