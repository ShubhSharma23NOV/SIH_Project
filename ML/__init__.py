"""
ArogyaJal Water Quality Prediction Module

This package provides machine learning models for predicting Water Quality Index (WQI)
based on 4 sensor readings: pH, Temperature, TDS, and Turbidity.
"""

__version__ = "0.1.0"
__all__ = ['WaterQualityPredictor', 'train_model', 'predict_wqi', 'evaluate_model', 'preprocess_data']

# Import main components with error handling
try:
    from .model import WaterQualityPredictor
except ImportError as e:
    print(f"Warning: Could not import WaterQualityPredictor: {e}")

try:
    from .train import train_model
except ImportError as e:
    print(f"Warning: Could not import train_model: {e}")

try:
    from .predict import predict_wqi
except ImportError as e:
    print(f"Warning: Could not import predict_wqi: {e}")

try:
    from .evaluate import evaluate_model, print_evaluation_metrics, cross_validate_model
    __all__.extend(['print_evaluation_metrics', 'cross_validate_model'])
except ImportError as e:
    print(f"Warning: Could not import evaluation functions: {e}")

try:
    from .preprocess import preprocess_data, generate_sample_data
    __all__.append('generate_sample_data')
except ImportError as e:
    print(f"Warning: Could not import preprocessing functions: {e}")
