"""
Data Preprocessing Module

This module contains functions for preprocessing water quality sensor data.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

def preprocess_data(df, target_col='wqi', test_size=0.2, random_state=42):
    """
    Preprocess the water quality data.
    
    Args:
        df (pd.DataFrame): Input DataFrame containing sensor data
        target_col (str): Name of the target column
        test_size (float): Proportion of data to use for testing
        random_state (int): Random seed for reproducibility
        
    Returns:
        tuple: (X_train, X_test, y_train, y_test)
    """
    # Make a copy to avoid modifying the original DataFrame
    df_processed = df.copy()
    
    # Define feature columns
    features = ['ph', 'temperature', 'tds', 'turbidity']
    
    # Handle missing values (fill with median for numerical features)
    for col in features + [target_col]:
        if col in df_processed.columns and df_processed[col].isnull().any():
            median_val = df_processed[col].median()
            df_processed[col].fillna(median_val, inplace=True)
    
    # Split into features and target
    X = df_processed[features]
    y = df_processed[target_col]
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    
    return X_train, X_test, y_train, y_test

def generate_sample_data(n_samples=1000, random_state=42):
    """
    Generate sample water quality data for testing and demonstration.
    
    Args:
        n_samples (int): Number of samples to generate
        random_state (int): Random seed for reproducibility
        
    Returns:
        pd.DataFrame: Generated sample data
    """
    np.random.seed(random_state)
    
    # Generate synthetic data with realistic ranges
    data = {
        'ph': np.random.uniform(6.0, 8.5, n_samples),  # pH range for most natural waters
        'temperature': np.random.uniform(0, 40, n_samples),  # °C
        'tds': np.random.uniform(50, 2000, n_samples),  # mg/L
        'turbidity': np.random.uniform(0.1, 50, n_samples)  # NTU
    }
    
    # Calculate a synthetic WQI (simplified formula for demonstration)
    df = pd.DataFrame(data)
    df['wqi'] = (
        0.25 * (100 - 5 * (df['ph'] - 7)**2) +  # pH component (optimal around 7)
        0.25 * (100 - 2 * np.abs(df['temperature'] - 25)) +  # Temperature component
        0.25 * (100 - 0.05 * df['tds']) +  # TDS component (lower is better)
        0.25 * (100 - 2 * df['turbidity'])  # Turbidity component (lower is better)
    )
    
    # Add some noise and clip to 0-100 range
    df['wqi'] += np.random.normal(0, 5, n_samples)
    df['wqi'] = np.clip(df['wqi'], 0, 100)
    
    return df
