package com.arogyajal.service;

import com.arogyajal.model.HouseholdSurvey;
import com.arogyajal.repository.HouseholdSurveyRepository;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class HouseholdSurveyService {
    
    private static final Logger log = LoggerFactory.getLogger(HouseholdSurveyService.class);
    private final HouseholdSurveyRepository repository;
    
    public HouseholdSurveyService(HouseholdSurveyRepository repository) {
        this.repository = repository;
    }
    
    public String saveHouseholdSurvey(HouseholdSurvey survey) throws ExecutionException, InterruptedException {
        // Set timestamps if not provided
        if (survey.getCreatedAt() == null) {
            survey.setCreatedAt(Timestamp.now());
        }
        survey.setUpdatedAt(Timestamp.now());
        
        // Set default status if not provided
        if (survey.getStatus() == null) {
            survey.setStatus("synced");
        }
        
        // Set synced flag
        if (survey.getSynced() == null) {
            survey.setSynced(1);
        }
        
        log.info("Saving household survey: {}", survey.getId());
        return repository.save(survey);
    }
    
    public HouseholdSurvey getHouseholdSurveyById(String id) throws ExecutionException, InterruptedException {
        return repository.findById(id);
    }
    
    public List<HouseholdSurvey> getAllHouseholdSurveys() throws ExecutionException, InterruptedException {
        return repository.findAll();
    }
    
    public List<HouseholdSurvey> getHouseholdSurveysByVillage(String village) throws ExecutionException, InterruptedException {
        return repository.findByVillage(village);
    }
    
    public List<HouseholdSurvey> getHouseholdSurveysByRiskLevel(String riskLevel) throws ExecutionException, InterruptedException {
        return repository.findByRiskLevel(riskLevel);
    }
}
