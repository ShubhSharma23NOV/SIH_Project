package com.arogyajal.service;

import com.arogyajal.model.WaterTest;
import com.arogyajal.repository.WaterTestRepository;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class WaterTestService {
    
    private static final Logger log = LoggerFactory.getLogger(WaterTestService.class);
    private final WaterTestRepository repository;
    
    public WaterTestService(WaterTestRepository repository) {
        this.repository = repository;
    }
    
    public String saveWaterTest(WaterTest waterTest) throws ExecutionException, InterruptedException {
        // Set timestamps if not provided
        if (waterTest.getCreatedAt() == null) {
            waterTest.setCreatedAt(Timestamp.now());
        }
        waterTest.setUpdatedAt(Timestamp.now());
        
        // Set default status if not provided
        if (waterTest.getStatus() == null) {
            waterTest.setStatus("synced");
        }
        
        // Set synced flag
        if (waterTest.getSynced() == null) {
            waterTest.setSynced(1);
        }
        
        log.info("Saving water test: {}", waterTest.getId());
        return repository.save(waterTest);
    }
    
    public WaterTest getWaterTestById(String id) throws ExecutionException, InterruptedException {
        return repository.findById(id);
    }
    
    public List<WaterTest> getAllWaterTests() throws ExecutionException, InterruptedException {
        return repository.findAll();
    }
    
    public List<WaterTest> getWaterTestsByReporter(String reporterId) throws ExecutionException, InterruptedException {
        return repository.findByReporterId(reporterId);
    }
    
    public List<WaterTest> getWaterTestsByRiskLevel(String riskLevel) throws ExecutionException, InterruptedException {
        return repository.findByRiskLevel(riskLevel);
    }
}
