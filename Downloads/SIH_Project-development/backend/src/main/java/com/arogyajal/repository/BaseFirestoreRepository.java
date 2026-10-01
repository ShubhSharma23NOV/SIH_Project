package com.arogyajal.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;

import java.util.*;
import java.util.concurrent.ExecutionException;

public abstract class BaseFirestoreRepository<T> {
    protected final Firestore db;
    protected final String collectionName;
    protected final Class<T> typeParameterClass;

    protected BaseFirestoreRepository(String collectionName, Class<T> typeParameterClass) {
        this.db = FirestoreClient.getFirestore();
        this.collectionName = collectionName;
        this.typeParameterClass = typeParameterClass;
    }

    public T save(T entity, String id) throws ExecutionException, InterruptedException {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        DocumentReference docRef = db.collection(collectionName).document(id);
        docRef.set(entity).get();
        return entity;
    }

    public Optional<T> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(collectionName).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            return Optional.of(document.toObject(typeParameterClass));
        }
        return Optional.empty();
    }

    public List<T> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(collectionName).get();
        return getEntities(future);
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        db.collection(collectionName).document(id).delete().get();
    }

    protected List<T> getEntities(ApiFuture<QuerySnapshot> future) throws ExecutionException, InterruptedException {
        List<T> list = new ArrayList<>();
        QuerySnapshot querySnapshot = future.get();
        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            list.add(doc.toObject(typeParameterClass));
        }
        return list;
    }
}
