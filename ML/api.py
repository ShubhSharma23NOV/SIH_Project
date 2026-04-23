"""
Flask API for Water Quality Prediction ML Service

This service exposes REST endpoints for WQI prediction.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from model import WaterQualityPredictor
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load the trained model
predictor = None

def load_model():
    """Load the trained ML model."""
    global predictor
    try:
        predictor = WaterQualityPredictor()
        model_path = predictor.model_path
        
        if os.path.exists(model_path):
            predictor.load_model()
            logger.info(f"✅ Model loaded successfully from {model_path}")
        else:
            logger.warning("⚠️ No trained model found. Training a new model...")
            from preprocess import generate_sample_data
            from train import train_model
            
            # Generate sample data and train
            data = generate_sample_data(n_samples=1000)
            X = data[['ph', 'temperature', 'tds', 'turbidity']]
            y = data['wqi']
            
            predictor = train_model(X, y)
            logger.info("✅ New model trained and loaded")
            
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        raise

# Load model on startup
load_model()

def get_quality_status(wqi):
    """Convert WQI score to quality status."""
    if wqi >= 90:
        return "Excellent"
    elif wqi >= 70:
        return "Good"
    elif wqi >= 50:
        return "Medium"
    elif wqi >= 25:
        return "Poor"
    else:
        return "Very Poor"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Prediction Service',
        'model_loaded': predictor is not None
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict WQI from sensor data.
    
    Expected JSON format:
    {
        "ph": 7.2,
        "temperature": 25.5,
        "tds": 350,
        "turbidity": 2.1
    }
    
    Or with alternative field names:
    {
        "pH": 7.2,
        "temperature_C": 25.5,
        "TDS_ppm": 350,
        "turbidity_NTU": 2.1
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Request body must contain sensor data in JSON format'
            }), 400
        
        # Normalize field names (handle different naming conventions)
        # All fields now have defaults for missing sensors
        normalized_data = {
            'ph': data.get('ph') or data.get('pH') or data.get('PH') or 7.0,  # Default neutral pH
            'temperature': data.get('temperature') or data.get('temperature_C') or data.get('temp') or 25.0,  # Default 25°C
            'tds': data.get('tds') or data.get('TDS_ppm') or data.get('TDS') or 300.0,  # Default 300 ppm
            'turbidity': data.get('turbidity') or data.get('turbidity_NTU') or 5.0  # Default 5 NTU
        }
        
        # Validate at least ONE sensor reading is provided
        has_any_sensor = any([
            data.get('ph') or data.get('pH') or data.get('PH'),
            data.get('temperature') or data.get('temperature_C') or data.get('temp'),
            data.get('tds') or data.get('TDS_ppm') or data.get('TDS'),
            data.get('turbidity') or data.get('turbidity_NTU')
        ])
        
        if not has_any_sensor:
            return jsonify({
                'error': 'No sensor data provided',
                'message': 'At least one sensor reading is required (ph, temperature, tds, or turbidity)'
            }), 400
        
        # Convert to DataFrame for prediction
        df = pd.DataFrame([normalized_data])
        
        # Make prediction
        wqi_prediction = predictor.predict(df)[0]
        
        # Get quality status
        quality_status = get_quality_status(wqi_prediction)
        
        # Prepare response
        response = {
            'wqi': round(float(wqi_prediction), 2),
            'quality_status': quality_status,
            'input_data': normalized_data,
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
        logger.info(f"Prediction: WQI={wqi_prediction:.2f}, Status={quality_status}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Predict WQI for multiple sensor readings.
    
    Expected JSON format:
    {
        "readings": [
            {"ph": 7.2, "temperature": 25.5, ...},
            {"ph": 6.8, "temperature": 24.0, ...}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'readings' not in data:
            return jsonify({
                'error': 'Invalid format',
                'message': 'Request body must contain "readings" array'
            }), 400
        
        readings = data['readings']
        
        if not isinstance(readings, list) or len(readings) == 0:
            return jsonify({
                'error': 'Invalid readings',
                'message': 'Readings must be a non-empty array'
            }), 400
        
        # Process each reading
        results = []
        for idx, reading in enumerate(readings):
            try:
                # Normalize field names
                normalized = {
                    'ph': reading.get('ph') or reading.get('pH'),
                    'temperature': reading.get('temperature') or reading.get('temperature_C'),
                    'tds': reading.get('tds') or reading.get('TDS_ppm'),
                    'turbidity': reading.get('turbidity') or reading.get('turbidity_NTU')
                }
                
                df = pd.DataFrame([normalized])
                wqi = predictor.predict(df)[0]
                
                results.append({
                    'index': idx,
                    'wqi': round(float(wqi), 2),
                    'quality_status': get_quality_status(wqi),
                    'input': normalized
                })
            except Exception as e:
                results.append({
                    'index': idx,
                    'error': str(e)
                })
        
        return jsonify({
            'predictions': results,
            'total': len(results),
            'timestamp': pd.Timestamp.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error during batch prediction: {e}")
        return jsonify({
            'error': 'Batch prediction failed',
            'message': str(e)
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model."""
    try:
        return jsonify({
            'model_type': predictor.model_type,
            'features': predictor.features,
            'model_path': str(predictor.model_path),
            'scaler_path': str(predictor.scaler_path)
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to get model info',
            'message': str(e)
        }), 500

# ============================================================================
# NEW ML ENDPOINTS FOR OUTBREAK PREDICTION AND CLUSTERING
# ============================================================================

@app.route('/api/ml/cluster', methods=['POST'])
def cluster_symptoms():
    """
    Cluster symptom reports using DBSCAN.
    
    Expected JSON format:
    {
        "reports": [
            {
                "id": "report_1",
                "location": "Village A",
                "symptoms": ["fever", "diarrhea"],
                "severity": "MODERATE",
                "reportDate": "2024-01-15T10:00:00",
                "geoLocation": {"latitude": 28.6139, "longitude": 77.2090}
            },
            ...
        ]
    }
    """
    try:
        data = request.json
        reports = data.get('reports', [])
        
        if not reports:
            return jsonify({'error': 'No reports provided'}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame(reports)
        
        # Perform clustering
        clusters = perform_symptom_clustering(df)
        
        return jsonify({
            'status': 'success',
            'clusters': clusters,
            'cluster_count': len(clusters)
        }), 200
        
    except Exception as e:
        logger.error(f"Clustering error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/predict-outbreak', methods=['POST'])
def predict_outbreak():
    """
    Predict outbreak probability based on clusters and water quality.
    
    Expected JSON format:
    {
        "clusters": [...],
        "water_tests": [...],
        "reports": [...]
    }
    """
    try:
        data = request.json
        
        # Extract features
        features = extract_outbreak_features(data)
        
        # Make prediction
        prediction = predict_outbreak_probability(features)
        
        # Generate recommendations based on risk level
        recommendations = []
        if prediction['risk_level'] == 'CRITICAL':
            recommendations = [
                'PRIORITY: Immediate intervention required',
                'PRIORITY: Deploy emergency medical teams',
                'Activate outbreak response protocol',
                'Issue public health advisory'
            ]
        elif prediction['risk_level'] == 'HIGH':
            recommendations = [
                'PRIORITY: Increase surveillance and monitoring',
                'Prepare emergency response resources',
                'Issue health advisory to community',
                'Conduct water quality testing'
            ]
        elif prediction['risk_level'] == 'MEDIUM':
            recommendations = [
                'Continue monitoring situation closely',
                'Increase testing frequency',
                'Conduct preventive health education',
                'Monitor water sources'
            ]
        else:
            recommendations = [
                'Continue routine surveillance',
                'Maintain regular monitoring schedule'
            ]
        
        return jsonify({
            'status': 'success',
            'risk_score': float(prediction['risk_score']),
            'risk_level': prediction['risk_level'],
            'confidence': float(prediction['confidence']),
            'contributing_factors': prediction['factors'],
            'recommendations': recommendations
        }), 200
        
    except Exception as e:
        logger.error(f"Outbreak prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/assess-risk', methods=['POST'])
def assess_risk():
    """
    Assess comprehensive health risk for a location.
    
    Expected JSON format:
    {
        "reports": [...],
        "clusters": [...],
        "water_tests": [...]
    }
    """
    try:
        data = request.json
        
        # Calculate risk components
        risk_assessment = calculate_location_risk(data)
        
        return jsonify({
            'status': 'success',
            'overall_risk_score': risk_assessment['overall_risk'],
            'risk_category': risk_assessment['category'],
            'component_scores': risk_assessment['components'],
            'recommendations': risk_assessment['recommendations']
        }), 200
        
    except Exception as e:
        logger.error(f"Risk assessment error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# HELPER FUNCTIONS FOR ML ENDPOINTS
# ============================================================================

def perform_symptom_clustering(df):
    """Perform DBSCAN clustering on symptom reports using haversine distance."""
    from sklearn.cluster import DBSCAN
    from math import radians, cos, sin, asin, sqrt
    import numpy as np
    
    cluster_data = []
    coordinates = []
    
    for idx, row in df.iterrows():
        if 'geoLocation' in row and row['geoLocation']:
            lat = row['geoLocation'].get('latitude', 0)
            lon = row['geoLocation'].get('longitude', 0)
            
            # Store coordinates in radians for haversine
            coordinates.append([radians(lat), radians(lon)])
            
            cluster_data.append({
                'id': row.get('id', f'report_{idx}'),
                'location': row.get('location', 'Unknown'),
                'symptoms': row.get('symptoms', []),
                'severity': row.get('severity', 'MILD'),
                'lat': lat,
                'lon': lon,
                'reportDate': row.get('reportDate', '')
            })
    
    if len(coordinates) < 2:
        return []
    
    # Convert to numpy array
    coords_array = np.array(coordinates)
    
    # Perform DBSCAN clustering with haversine metric
    # eps in kilometers: 5 km radius as per documentation
    # Earth radius = 6371 km, so eps in radians = 5/6371 ≈ 0.000785
    EARTH_RADIUS_KM = 6371
    EPS_KM = 5  # 5 kilometer radius (documentation requirement)
    eps_radians = EPS_KM / EARTH_RADIUS_KM  # ≈ 0.000785
    
    dbscan = DBSCAN(eps=eps_radians, min_samples=3, metric='haversine')
    logger.info(f"🎯 Running DBSCAN with eps={EPS_KM}km, min_samples=3")
    cluster_labels = dbscan.fit_predict(coords_array)
    
    # Group reports by cluster
    clusters = {}
    noise_count = 0
    for i, label in enumerate(cluster_labels):
        if label != -1:  # Ignore noise points
            if label not in clusters:
                clusters[label] = {
                    'cluster_id': f'cluster_{label}',
                    'reports': [],
                    'centroid': {'lat': 0, 'lon': 0},
                    'report_count': 0
                }
            clusters[label]['reports'].append(cluster_data[i])
        else:
            noise_count += 1
    
    logger.info(f"🎯 DBSCAN Results: {len(clusters)} clusters formed, {noise_count} noise points from {len(cluster_data)} reports")
    
    # Calculate cluster properties
    result_clusters = []
    for cluster_id, cluster in clusters.items():
        reports = cluster['reports']
        cluster['report_count'] = len(reports)
        
        # Calculate centroid
        avg_lat = sum(r['lat'] for r in reports) / len(reports)
        avg_lon = sum(r['lon'] for r in reports) / len(reports)
        cluster['centroid'] = {'lat': avg_lat, 'lon': avg_lon}
        
        # Analyze symptoms
        all_symptoms = []
        for r in reports:
            all_symptoms.extend(r['symptoms'])
        
        symptom_counts = {}
        for symptom in all_symptoms:
            symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
        
        cluster['dominant_symptoms'] = sorted(
            symptom_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]
        
        # Calculate cluster score
        cluster['cluster_score'] = min(len(reports) * 15 + len(symptom_counts) * 5, 100)
        
        # Log cluster details
        dominant_symptoms_str = ', '.join([f"{s[0]}({s[1]})" for s in cluster['dominant_symptoms']])
        logger.info(f"  📍 Cluster {cluster['cluster_id']}: {len(reports)} reports at "
                   f"({avg_lat:.4f}, {avg_lon:.4f}), symptoms: {dominant_symptoms_str}")
        
        result_clusters.append(cluster)
    
    return result_clusters

def extract_outbreak_features(data):
    """Extract features for outbreak prediction with severity and TREND consideration."""
    # Check if data contains list structures (new format) or direct values (old format)
    symptom_clusters_data = data.get('symptom_clusters', [])
    
    # Determine if using new format (list) or old format (integers)
    is_new_format = isinstance(symptom_clusters_data, list)
    
    if not is_new_format:
        # Old format: direct integer values
        symptom_clusters = data.get('symptom_clusters', 0)
        water_quality_alerts = data.get('water_quality_alerts', 0)
        recent_reports = data.get('recent_reports', 0)
        features = {
            'cluster_count': symptom_clusters,
            'total_reports': recent_reports,
            'max_cluster_severity': 0,
            'avg_cluster_score': min(symptom_clusters * 15, 100) if symptom_clusters else 0,
            'water_quality_score': min(water_quality_alerts * 0.5, 100) if water_quality_alerts else 0,
            'temporal_trend': 0
        }
    else:
        # New format: extract from nested structure
        clusters = data.get('clusters', []) or data.get('symptom_clusters', [])
        
        features = {
            'cluster_count': len(clusters),
            'total_reports': sum(c.get('report_count', 0) for c in clusters),
            'max_cluster_severity': 0,
            'avg_cluster_score': 0,
            'water_quality_score': 0,
            'temporal_trend': 0,
            'poor_sensors': 0,
            'total_sensors': 0,
            # ✅ NEW: Trend features
            'wqi_trend_24h': 0.0,
            'report_trend_24h': 0.0,
            'alert_trend_24h': 0.0,
            'cluster_growth_rate_7d': 0.0,
            'trend_direction': 'STABLE',
            'has_trend_data': False,
            # ✅ NEW: Active alerts
            'active_alerts_24h': 0
        }
        
        # Find maximum cluster severity
        if clusters:
            severities = [c.get('severity_score', 0) for c in clusters]
            features['max_cluster_severity'] = max(severities) if severities else 0
            features['avg_cluster_score'] = sum(severities) / len(severities) if severities else 0
            
            logger.info(f"📊 Cluster Analysis: {len(clusters)} clusters, "
                       f"Max Severity: {features['max_cluster_severity']:.1f}, "
                       f"Avg Severity: {features['avg_cluster_score']:.1f}")
        
        # Water quality factor from sensor data
        sensor_data = data.get('sensor_data', [])
        if sensor_data:
            features['total_sensors'] = len(sensor_data)
            poor_sensors = sum(1 for s in sensor_data if s.get('wqi', 0) > 75)
            features['poor_sensors'] = poor_sensors
            features['water_quality_score'] = (poor_sensors / len(sensor_data)) * 100 if sensor_data else 0
        
        # ✅ NEW: Extract trend features
        features['wqi_trend_24h'] = data.get('wqi_trend_24h', 0.0)
        features['report_trend_24h'] = data.get('report_trend_24h', 0.0)
        features['alert_trend_24h'] = data.get('alert_trend_24h', 0.0)
        features['cluster_growth_rate_7d'] = data.get('cluster_growth_rate_7d', 0.0)
        features['trend_direction'] = data.get('trend_direction', 'STABLE')
        features['has_trend_data'] = data.get('has_trend_data', False)
        
        # ✅ NEW: Extract active alerts
        features['active_alerts_24h'] = data.get('active_alerts_24h', 0)
        
        if features['has_trend_data']:
            logger.info(f"📈 Trend Features: WQI Δ{features['wqi_trend_24h']:.1f}, "
                       f"Reports Δ{features['report_trend_24h']:.0f}, "
                       f"Alerts Δ{features['alert_trend_24h']:.0f}, "
                       f"Direction: {features['trend_direction']}")
    
    return features

def predict_outbreak_probability(features):
    """
    Predict outbreak probability based on features.
    Enhanced formula considering cluster severity:
    - Cluster Factor = min(max_cluster_severity / 2, 50) [0-50 points]
    - Report Factor = min(total_reports / 10, 20) [0-20 points]
    - Quality Factor = (poor_sensors / total_sensors × 20) [0-20 points]
    - Source Factor = (contaminated_sources / total_sources × 10) [0-10 points]
    """
    risk_score = 0
    
    # Cluster Factor (0-50 points) - Use max severity instead of count
    # If max_cluster_severity = 100, then cluster_score = 50 (max)
    max_severity = features.get('max_cluster_severity', 0)
    cluster_count = features.get('cluster_count', 0)
    
    if max_severity > 0:
        # Severity-based scoring (0-100 severity → 0-50 points)
        cluster_score = min(max_severity / 2, 50)
    else:
        # Fallback to count-based if no severity data
        cluster_score = min(cluster_count * 10, 50)
    
    risk_score += cluster_score
    
    # Report Factor (0-20 points) - Documentation formula
    report_score = min(features['total_reports'] / 10, 20)
    risk_score += report_score
    
    # Quality Factor (0-20 points) - Poor sensors ratio
    poor_sensors = features.get('poor_sensors', 0)
    total_sensors = features.get('total_sensors', 1)
    if total_sensors > 0:
        quality_score = (poor_sensors / total_sensors) * 20
    else:
        quality_score = 0
    risk_score += quality_score
    
    # Source Factor (0-10 points) - Contaminated sources ratio
    contaminated_sources = features.get('contaminated_sources', 0)
    total_sources = features.get('total_sources', 1)
    if total_sources > 0:
        source_score = (contaminated_sources / total_sources) * 10
    else:
        source_score = 0
    risk_score += source_score
    
    # ✅ NEW: Alert Factor (0-10 points) - Active alerts
    active_alerts = features.get('active_alerts_24h', 0)
    alert_score = min(active_alerts * 2, 10)  # 2 points per alert, max 10
    risk_score += alert_score
    
    logger.info(f"📊 Base Risk: Cluster={cluster_score:.1f}, Report={report_score:.1f}, "
                f"Quality={quality_score:.1f}, Source={source_score:.1f}, Alert={alert_score:.1f}, "
                f"Total={risk_score:.1f}")
    
    # ✅ NEW: Apply trend multipliers for temporal intelligence
    base_risk = risk_score
    trend_multiplier = 1.0
    trend_adjustments = []
    
    if features.get('has_trend_data', False):
        wqi_trend = features.get('wqi_trend_24h', 0)
        report_trend = features.get('report_trend_24h', 0)
        alert_trend = features.get('alert_trend_24h', 0)
        cluster_growth = features.get('cluster_growth_rate_7d', 0)
        
        # Rapid WQI deterioration (worsening water quality)
        if wqi_trend > 15:
            trend_multiplier *= 1.4
            trend_adjustments.append(f"Rapid WQI deterioration (+{wqi_trend:.1f})")
        elif wqi_trend > 10:
            trend_multiplier *= 1.3
            trend_adjustments.append(f"WQI deteriorating (+{wqi_trend:.1f})")
        
        # Spike in reports
        if report_trend > 10:
            trend_multiplier *= 1.3
            trend_adjustments.append(f"Report spike (+{report_trend:.0f})")
        elif report_trend > 5:
            trend_multiplier *= 1.2
            trend_adjustments.append(f"Reports increasing (+{report_trend:.0f})")
        
        # Alert trend
        if alert_trend > 5:
            trend_multiplier *= 1.2
            trend_adjustments.append(f"Alert surge (+{alert_trend:.0f})")
        elif alert_trend > 3:
            trend_multiplier *= 1.1
            trend_adjustments.append(f"Alerts rising (+{alert_trend:.0f})")
        
        # Sustained cluster growth
        if cluster_growth > 1.0:
            trend_multiplier *= 1.5
            trend_adjustments.append(f"Sustained cluster growth ({cluster_growth:.2f}/day)")
        elif cluster_growth > 0.5:
            trend_multiplier *= 1.3
            trend_adjustments.append(f"Cluster growth ({cluster_growth:.2f}/day)")
        
        # Improving trends (reduce risk)
        if wqi_trend < -10 and report_trend < -5:
            trend_multiplier *= 0.7
            trend_adjustments.append("Improving conditions")
        elif wqi_trend < -5 and report_trend < 0:
            trend_multiplier *= 0.85
            trend_adjustments.append("Slight improvement")
        
        # Apply multiplier
        risk_score = base_risk * trend_multiplier
        
        if trend_adjustments:
            logger.info(f"📈 Trend Adjustments: {', '.join(trend_adjustments)}")
            logger.info(f"📈 Trend Multiplier: {trend_multiplier:.2f}x → Risk: {base_risk:.1f} → {risk_score:.1f}")
    else:
        logger.info(f"⚠️ No trend data available - using base risk only")
    
    # Clamp to 0-100
    risk_score = min(max(risk_score, 0), 100)
    
    # Determine risk level (as per documentation)
    if risk_score >= 75:
        risk_level = 'CRITICAL'
    elif risk_score >= 50:
        risk_level = 'HIGH'
    elif risk_score >= 25:
        risk_level = 'MEDIUM'
    else:
        risk_level = 'LOW'
    
    # Calculate confidence based on data completeness (as per documentation)
    confidence = calculate_prediction_confidence(features)
    
    # Adjust confidence based on trend data availability
    if features.get('has_trend_data', False):
        confidence = min(confidence * 1.1, 100)  # Boost confidence with trend data
    else:
        confidence = max(confidence * 0.9, 40)  # Reduce confidence without trends
    
    # Log final result
    logger.info(f"🎯 Outbreak Risk: {risk_level} ({risk_score:.1f}/100) - Confidence: {confidence:.1f}%")
    if trend_adjustments:
        logger.info(f"🎯 Trend-Enhanced: Base {base_risk:.1f} × {trend_multiplier:.2f} = {risk_score:.1f}")
    
    return {
        'risk_score': risk_score,
        'risk_level': risk_level,
        'confidence': confidence,
        'factors': {
            'cluster_factor': cluster_score,
            'report_factor': report_score,
            'quality_factor': quality_score,
            'source_factor': source_score,
            'alert_factor': alert_score
        },
        'trend_analysis': {
            'base_risk': base_risk,
            'trend_multiplier': trend_multiplier,
            'adjustments': trend_adjustments,
            'has_trend_data': features.get('has_trend_data', False)
        }
    }

def calculate_prediction_confidence(features):
    """
    Calculate prediction confidence based on data completeness.
    As per documentation:
    - Symptom reports: 10+ required (25 points)
    - Active sensors: 5+ required (25 points)
    - Recent data: <24 hours (25 points)
    - Geographic coverage: 80%+ (25 points)
    """
    score = 0
    
    # Symptom reports factor (0-25 points)
    total_reports = features.get('total_reports', 0)
    if total_reports >= 10:
        score += 25
    else:
        score += (total_reports / 10) * 25
    
    # Active sensors factor (0-25 points)
    total_sensors = features.get('total_sensors', 0)
    if total_sensors >= 5:
        score += 25
    else:
        score += (total_sensors / 5) * 25
    
    # Data recency factor (0-25 points)
    # Assume recent if we have data (can be enhanced with actual timestamps)
    data_recency_hours = features.get('data_recency_hours', 24)
    if data_recency_hours <= 24:
        score += 25
    elif data_recency_hours <= 48:
        score += 15
    elif data_recency_hours <= 72:
        score += 10
    else:
        score += 5
    
    # Geographic coverage factor (0-25 points)
    coverage_ratio = features.get('geographic_coverage', 0.5)
    score += coverage_ratio * 25
    
    confidence = min(score, 100)
    
    logger.info(f"📈 Confidence: {confidence:.1f}% (Reports={total_reports}, Sensors={total_sensors})")
    
    return confidence

def calculate_location_risk(data):
    """Calculate comprehensive risk assessment for a location."""
    reports = data.get('reports', [])
    clusters = data.get('clusters', [])
    water_tests = data.get('water_tests', [])
    
    # Calculate component risks
    symptom_risk = calculate_symptom_risk(reports)
    cluster_risk = calculate_cluster_risk(clusters)
    water_risk = calculate_water_risk(water_tests)
    
    # Overall risk (weighted average)
    overall_risk = (symptom_risk * 0.4 + cluster_risk * 0.4 + water_risk * 0.2)
    
    # Determine category
    if overall_risk >= 75:
        category = 'CRITICAL'
    elif overall_risk >= 60:
        category = 'HIGH'
    elif overall_risk >= 40:
        category = 'MEDIUM'
    elif overall_risk >= 20:
        category = 'LOW'
    else:
        category = 'MINIMAL'
    
    # Generate recommendations
    recommendations = generate_recommendations(category, symptom_risk, cluster_risk, water_risk)
    
    return {
        'overall_risk': overall_risk,
        'category': category,
        'components': {
            'symptom_risk': symptom_risk,
            'cluster_risk': cluster_risk,
            'water_risk': water_risk
        },
        'recommendations': recommendations
    }

def calculate_symptom_risk(reports):
    """Calculate risk from symptom reports."""
    if not reports:
        return 0
    
    risk = 0
    severe_count = sum(1 for r in reports if r.get('severity') in ['SEVERE', 'CRITICAL'])
    risk += (severe_count / len(reports)) * 50
    risk += min(len(reports) * 2, 50)
    
    return min(risk, 100)

def calculate_cluster_risk(clusters):
    """Calculate risk from clusters."""
    if not clusters:
        return 0
    
    avg_score = sum(c.get('cluster_score', 0) for c in clusters) / len(clusters)
    cluster_factor = min(len(clusters) * 20, 40)
    
    return min(avg_score * 0.6 + cluster_factor, 100)

def calculate_water_risk(water_tests):
    """Calculate risk from water quality."""
    if not water_tests:
        return 50  # Assume moderate risk if no data
    
    unsafe_count = sum(1 for t in water_tests 
                      if t.get('quality_status') in ['UNSAFE', 'CONTAMINATED'])
    
    return (unsafe_count / len(water_tests)) * 100

def generate_recommendations(category, symptom_risk, cluster_risk, water_risk):
    """Generate recommendations based on risk assessment."""
    recommendations = []
    
    if category == 'CRITICAL':
        recommendations.extend([
            'Immediate intervention required',
            'Deploy emergency medical teams',
            'Activate outbreak response protocol'
        ])
    elif category == 'HIGH':
        recommendations.extend([
            'Increase surveillance and monitoring',
            'Prepare emergency response resources',
            'Issue health advisory to community'
        ])
    elif category == 'MEDIUM':
        recommendations.extend([
            'Continue monitoring situation',
            'Increase testing frequency',
            'Conduct preventive health education'
        ])
    else:
        recommendations.append('Continue routine surveillance')
    
    if water_risk > 60:
        recommendations.append('PRIORITY: Address water quality issues')
    
    if cluster_risk > 70:
        recommendations.append('PRIORITY: Investigate active clusters')
    
    if symptom_risk > 70:
        recommendations.append('PRIORITY: Increase medical support')
    
    return recommendations

if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
