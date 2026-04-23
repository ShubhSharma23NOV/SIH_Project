"""
Prediction Module

This module provides functions for making predictions with the trained model.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from .model import WaterQualityPredictor

def predict_wqi(sensor_data):
    """
    Predict Water Quality Index (WQI) from sensor data.
    
    Args:
        sensor_data (dict or pd.DataFrame): Dictionary or DataFrame containing sensor readings with keys:
                                          ['ph', 'temperature', 'tds', 'turbidity']
                                          
    Returns:
        float or np.ndarray: Predicted WQI value(s)
    """
    # Initialize the predictor
    predictor = WaterQualityPredictor()
    
    try:
        # Try to load the trained model
        predictor.load_model()
    except FileNotFoundError:
        raise RuntimeError(
            "Model not found. Please train the model first using the train_model() function."
        )
    
    # Make prediction
    prediction = predictor.predict(sensor_data)
    
    # Return a single float if input was a single sample
    if isinstance(sensor_data, dict) or (isinstance(sensor_data, pd.DataFrame) and len(sensor_data) == 1):
        return float(prediction[0])
    
    return prediction

def batch_predict(sensor_data_list):
    """
    Make batch predictions for multiple sensor readings.
    
    Args:
        sensor_data_list (list of dict): List of sensor data dictionaries
        
    Returns:
        list: List of predicted WQI values
    """
    # Convert list of dicts to DataFrame
    df = pd.DataFrame(sensor_data_list)
    
    # Make predictions
    predictions = predict_wqi(df)
    
    return predictions.tolist()
