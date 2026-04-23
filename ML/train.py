"""
Model Training Module

This module contains functions for training the water quality prediction model.
"""

import pandas as pd
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from .model import WaterQualityPredictor
from .preprocess import generate_sample_data, preprocess_data

def train_model(X_train, y_train, model_params=None):
    """
    Train the water quality prediction model.
    
    Args:
        X_train (pd.DataFrame): Training features
        y_train (pd.Series): Training target
        model_params (dict, optional): Parameters for the model
        
    Returns:
        WaterQualityPredictor: Trained model
    """
    # Initialize the model
    model = WaterQualityPredictor()
    
    # Train the model
    model.train(X_train, y_train)
    
    return model

def evaluate_model(model, X_test, y_test):
    """
    Evaluate the trained model on test data.
    
    Args:
        model (WaterQualityPredictor): Trained model
        X_test (pd.DataFrame): Test features
        y_test (pd.Series): Test target
        
    Returns:
        dict: Dictionary of evaluation metrics
    """
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    import numpy as np
    mse = mean_squared_error(y_test, y_pred)
    metrics = {
        'mse': mse,
        'rmse': np.sqrt(mse),
        'mae': mean_absolute_error(y_test, y_pred),
        'r2': r2_score(y_test, y_pred)
    }
    
    return metrics

def train_and_evaluate(sample_data=None):
    """
    Train and evaluate the model on sample data (for testing/demo).
    
    Args:
        sample_data (pd.DataFrame, optional): Sample data to use. If None, generates data.
        
    Returns:
        tuple: (trained_model, metrics)
    """
    # Generate sample data if none provided
    if sample_data is None:
        print("Generating sample data...")
        sample_data = generate_sample_data(n_samples=1000)
    
    # Preprocess the data
    print("Preprocessing data...")
    X_train, X_test, y_train, y_test = preprocess_data(sample_data)
    
    # Train the model
    print("Training model...")
    model = train_model(X_train, y_train)
    
    # Evaluate the model
    print("Evaluating model...")
    metrics = evaluate_model(model, X_test, y_test)
    
    # Print metrics
    print("\nModel Evaluation:")
    for metric, value in metrics.items():
        print(f"{metric.upper()}: {value:.4f}")
    
    return model, metrics
