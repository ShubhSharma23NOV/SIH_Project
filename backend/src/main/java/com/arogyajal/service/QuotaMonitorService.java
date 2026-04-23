package com.arogyajal.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service to monitor Firestore quota usage and provide warnings
 */
@Service
public class QuotaMonitorService {
    
    private static final Logger log = LoggerFactory.getLogger(QuotaMonitorService.class);
    
    // Daily limits for Firestore Spark (free) plan
    private static final int DAILY_READ_LIMIT = 50000;
    private static final int DAILY_WRITE_LIMIT = 20000;
    private static final int DAILY_DELETE_LIMIT = 20000;
    
    // Counters (reset daily)
    private final AtomicInteger readCount = new AtomicInteger(0);
    private final AtomicInteger writeCount = new AtomicInteger(0);
    private final AtomicInteger deleteCount = new AtomicInteger(0);
    private final AtomicLong lastResetTime = new AtomicLong(System.currentTimeMillis());
    
    /**
     * Record a read operation
     */
    public void recordRead() {
        checkAndResetIfNeeded();
        int current = readCount.incrementAndGet();
        
        if (current >= DAILY_READ_LIMIT * 0.9) {
            log.warn("⚠️ QUOTA WARNING: Read operations at {}% of daily limit ({}/{})", 
                (current * 100 / DAILY_READ_LIMIT), current, DAILY_READ_LIMIT);
        }
        
        if (current >= DAILY_READ_LIMIT) {
            log.error("🚨 QUOTA EXCEEDED: Daily read limit reached! ({}/{})", current, DAILY_READ_LIMIT);
        }
    }
    
    /**
     * Record a write operation
     */
    public void recordWrite() {
        checkAndResetIfNeeded();
        int current = writeCount.incrementAndGet();
        
        if (current >= DAILY_WRITE_LIMIT * 0.9) {
            log.warn("⚠️ QUOTA WARNING: Write operations at {}% of daily limit ({}/{})", 
                (current * 100 / DAILY_WRITE_LIMIT), current, DAILY_WRITE_LIMIT);
        }
        
        if (current >= DAILY_WRITE_LIMIT) {
            log.error("🚨 QUOTA EXCEEDED: Daily write limit reached! ({}/{})", current, DAILY_WRITE_LIMIT);
        }
    }
    
    /**
     * Record a delete operation
     */
    public void recordDelete() {
        checkAndResetIfNeeded();
        int current = deleteCount.incrementAndGet();
        
        if (current >= DAILY_DELETE_LIMIT * 0.9) {
            log.warn("⚠️ QUOTA WARNING: Delete operations at {}% of daily limit ({}/{})", 
                (current * 100 / DAILY_DELETE_LIMIT), current, DAILY_DELETE_LIMIT);
        }
        
        if (current >= DAILY_DELETE_LIMIT) {
            log.error("🚨 QUOTA EXCEEDED: Daily delete limit reached! ({}/{})", current, DAILY_DELETE_LIMIT);
        }
    }
    
    /**
     * Check if quota is near limit
     */
    public boolean isNearLimit() {
        return readCount.get() >= DAILY_READ_LIMIT * 0.9 ||
               writeCount.get() >= DAILY_WRITE_LIMIT * 0.9 ||
               deleteCount.get() >= DAILY_DELETE_LIMIT * 0.9;
    }
    
    /**
     * Check if quota is exhausted
     */
    public boolean isExhausted() {
        return readCount.get() >= DAILY_READ_LIMIT ||
               writeCount.get() >= DAILY_WRITE_LIMIT ||
               deleteCount.get() >= DAILY_DELETE_LIMIT;
    }
    
    /**
     * Get current quota status
     */
    public String getQuotaStatus() {
        return String.format("Firestore Quota - Reads: %d/%d (%.1f%%), Writes: %d/%d (%.1f%%), Deletes: %d/%d (%.1f%%)",
            readCount.get(), DAILY_READ_LIMIT, (readCount.get() * 100.0 / DAILY_READ_LIMIT),
            writeCount.get(), DAILY_WRITE_LIMIT, (writeCount.get() * 100.0 / DAILY_WRITE_LIMIT),
            deleteCount.get(), DAILY_DELETE_LIMIT, (deleteCount.get() * 100.0 / DAILY_DELETE_LIMIT));
    }
    
    /**
     * Reset counters if a day has passed
     */
    private void checkAndResetIfNeeded() {
        long now = System.currentTimeMillis();
        long lastReset = lastResetTime.get();
        
        // Reset if more than 24 hours have passed
        if (now - lastReset > 24 * 60 * 60 * 1000) {
            if (lastResetTime.compareAndSet(lastReset, now)) {
                readCount.set(0);
                writeCount.set(0);
                deleteCount.set(0);
                log.info("✅ Quota counters reset for new day");
            }
        }
    }
    
    /**
     * Log current quota status
     */
    public void logQuotaStatus() {
        log.info(getQuotaStatus());
    }
}
