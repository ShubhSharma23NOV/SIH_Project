package com.arogyajal.repository;

import com.arogyajal.model.HouseholdSurvey;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class HouseholdSurveyRepository {
    
    private final Firestore firestore;
    private static final String COLLECTION_NAME = "household_surveys";
    
    public HouseholdSurveyRepository(Firestore firestore) {
        this.firestore = firestore;
    }
    
    public String save(HouseholdSurvey survey) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(survey.getId())
                .set(survey);
        future.get();
        return survey.getId();
    }
    
    public HouseholdSurvey findById(String id) throws ExecutionException, InterruptedException {
        return firestore.collection(COLLECTION_NAME)
                .document(id)
                .get()
                .get()
                .toObject(HouseholdSurvey.class);
    }
    
    public List<HouseholdSurvey> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        return future.get().toObjects(HouseholdSurvey.class);
    }
    
    public List<HouseholdSurvey> findByVillage(String village) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("village", village)
                .get();
        return future.get().toObjects(HouseholdSurvey.class);
    }
    
    public List<HouseholdSurvey> findByRiskLevel(String riskLevel) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("riskLevel", riskLevel)
                .get();
        return future.get().toObjects(HouseholdSurvey.class);
    }
}
