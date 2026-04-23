"""
Model Evaluation Module

This module contains functions for evaluating the water quality prediction model.
"""

import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def evaluate_model(y_true, y_pred):
    """
    Evaluate the model performance using various metrics.
    
    Args:
        y_true (array-like): True target values
        y_pred (array-like): Predicted values
        
    Returns:
        dict: Dictionary containing evaluation metrics
    """
    metrics = {
        'mse': mean_squared_error(y_true, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
        'mae': mean_absolute_error(y_true, y_pred),
        'r2': r2_score(y_true, y_pred)
    }
    return metrics

def print_evaluation_metrics(metrics):
    """Print the evaluation metrics in a readable format."""
    print("\nModel Evaluation Metrics:")
    print("-" * 30)
    print(f"Mean Squared Error (MSE): {metrics['mse']:.4f}")
    print(f"Root Mean Squared Error (RMSE): {metrics['rmse']:.4f}")
    print(f"Mean Absolute Error (MAE): {metrics['mae']:.4f}")
    print(f"R² Score: {metrics['r2']:.4f}")

def cross_validate_model(model, X, y, cv=5):
    """
    Perform cross-validation on the model.
    
    Args:
        model: The model to evaluate
        X: Feature matrix
        y: Target variable
        cv: Number of cross-validation folds
        
    Returns:
        dict: Cross-validation results
    """
    from sklearn.model_selection import cross_validate
    
    scoring = {
        'mse': 'neg_mean_squared_error',
        'rmse': 'neg_root_mean_squared_error',
        'mae': 'neg_mean_absolute_error',
        'r2': 'r2'
    }
    
    cv_results = cross_validate(
        model, X, y, 
        cv=cv, 
        scoring=scoring,
        return_train_score=True
    )
    
    # Convert negative scores to positive for MSE, RMSE, and MAE
    for metric in ['test_mse', 'test_rmse', 'test_mae', 'train_mse', 'train_rmse', 'train_mae']:
        if metric in cv_results:
            cv_results[metric] = np.abs(cv_results[metric])
    
    return cv_results
