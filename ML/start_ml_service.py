"""
Startup script for ML Prediction Service

Run this to start the Flask API server.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import app

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting ML Prediction Service")
    print("=" * 50)
    print("\nEndpoints:")
    print("  - Health Check: http://localhost:5000/health")
    print("  - Predict WQI:  http://localhost:5000/predict")
    print("  - Batch Predict: http://localhost:5000/batch-predict")
    print("  - Model Info:   http://localhost:5000/model-info")
    print("\n" + "=" * 50)
    
    # Start the server
    app.run(host='0.0.0.0', port=5000, debug=True)
