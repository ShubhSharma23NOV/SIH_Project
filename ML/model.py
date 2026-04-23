"""
Water Quality Prediction Model

This module contains the main WaterQualityPredictor class that implements
the machine learning model for predicting Water Quality Index (WQI).
"""

import os
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib

class WaterQualityPredictor:
    """
    A machine learning model for predicting Water Quality Index (WQI) from sensor data.
    
    This class handles model training, prediction, and persistence.
    """
    
    def __init__(self, model_type='random_forest'):
        """
        Initialize the water quality predictor.
        
        Args:
            model_type (str): Type of model to use ('random_forest' or 'gradient_boosting')
        """
        self.model = None
        self.scaler = StandardScaler()
        self.features = ['ph', 'temperature', 'tds', 'turbidity']
        self.target = 'wqi'
        self.model_type = model_type
        self.model_dir = Path(__file__).parent / 'models'
        self.model_path = self.model_dir / 'wqi_model.pkl'
        self.scaler_path = self.model_dir / 'scaler.pkl'
        
        # Create models directory if it doesn't exist
        os.makedirs(self.model_dir, exist_ok=True)
    
    def train(self, X, y):
        """
        Train the model on the given data.
        
        Args:
            X (pd.DataFrame): Feature matrix
            y (pd.Series): Target variable
        """
        # Scale the features
        X_scaled = self.scaler.fit_transform(X)
        
        # Initialize and train the model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_scaled, y)
        
        # Save the trained model and scaler
        self.save_model()
    
    def predict(self, X):
        """
        Make predictions on new data.
        
        Args:
            X (pd.DataFrame or dict): Input features
            
        Returns:
            np.ndarray: Predicted WQI values
        """
        if self.model is None or self.scaler is None:
            raise ValueError("Model not trained. Call train() first or load a trained model.")
        
        # Convert dict to DataFrame if needed
        if isinstance(X, dict):
            X = pd.DataFrame([X])
        
        # Ensure all required features are present
        missing_features = set(self.features) - set(X.columns)
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")
        
        # Select only the required features and in the correct order
        X = X[self.features]
        
        # Scale the input data
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        predictions = self.model.predict(X_scaled)
        
        # Ensure predictions are within 0-100 range
        return np.clip(predictions, 0, 100)
    
    def predict_with_confidence(self, X):
        """
        Make predictions with confidence scores.
        
        Args:
            X (pd.DataFrame or dict): Input features
            
        Returns:
            tuple: (predictions, confidence_scores)
        """
        predictions = self.predict(X)
        
        # Calculate confidence based on tree predictions variance
        if hasattr(self.model, 'estimators_'):
            tree_predictions = np.array([tree.predict(self.scaler.transform(X if isinstance(X, pd.DataFrame) else pd.DataFrame([X])[self.features])) 
                                        for tree in self.model.estimators_])
            std_dev = np.std(tree_predictions, axis=0)
            confidence = np.clip(100 - (std_dev * 2), 0, 100)
        else:
            confidence = np.full(len(predictions), 85.0)
        
        return predictions, confidence
    
    def classify_quality(self, wqi):
        """
        Classify water quality based on WQI score (NER-adjusted thresholds).
        
        Args:
            wqi (float): Water Quality Index score
            
        Returns:
            str: Quality status (EXCELLENT, GOOD, WARNING, CRITICAL)
        """
        if wqi >= 90:
            return "EXCELLENT"
        elif wqi >= 70:
            return "GOOD"
        elif wqi >= 50:
            return "WARNING"
        else:
            return "CRITICAL"
    
    def predict_batch(self, X_list):
        """
        Make predictions on multiple samples.
        
        Args:
            X_list (list): List of feature dictionaries
            
        Returns:
            list: List of prediction results with WQI and quality status
        """
        results = []
        for X in X_list:
            try:
                wqi = self.predict(X)[0]
                confidence = self.predict_with_confidence(X)[1][0]
                quality = self.classify_quality(wqi)
                results.append({
                    'wqi': float(wqi),
                    'quality_status': quality,
                    'confidence': float(confidence)
                })
            except Exception as e:
                results.append({
                    'error': str(e),
                    'wqi': None,
                    'quality_status': 'UNKNOWN'
                })
        return results
    
    def save_model(self):
        """Save the trained model and scaler to disk."""
        if self.model is None:
            raise ValueError("No model to save. Train the model first.")
            
        # Save the model
        joblib.dump(self.model, self.model_path)
        
        # Save the scaler
        joblib.dump(self.scaler, self.scaler_path)
        
        print(f"Model saved to {self.model_path}")
        print(f"Scaler saved to {self.scaler_path}")
    
    def load_model(self):
        """Load the trained model and scaler from disk."""
        if not self.model_path.exists() or not self.scaler_path.exists():
            raise FileNotFoundError("Model or scaler file not found. Please train the model first.")
        
        self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)
        print("Model and scaler loaded successfully.")
        
        return self
