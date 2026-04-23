import React, { useState, useEffect } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import './OutbreakPredictionPanel.css';

interface OutbreakPrediction {
  riskScore: number;
  riskLevel: string;
  confidence: number;
  contributingFactors: {
    cluster_factor: number;
    report_factor: number;
    quality_factor: number;
    water_factor: number;
    // Fusion metadata
    ml_risk_score?: number;
    rule_risk_score?: number;
    final_risk_score?: number;
    fusion_method?: number;
  };
  recommendations: string[];
  modelVersion?: string;
}

const OutbreakPredictionPanel: React.FC = () => {
  const { getBreadcrumb } = useGlobalFilter();
  const [prediction, setPrediction] = useState<OutbreakPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutbreakPrediction();
    const interval = setInterval(fetchOutbreakPrediction, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchOutbreakPrediction = async () => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    
    try {
      const response = await fetch(`${API_BASE}/api/outbreak-predictions/latest`);
      if (response.ok) {
        const data = await response.json();
        
        console.log('Outbreak prediction data:', data);
        
        // Transform backend response to match frontend interface
        const transformedData: OutbreakPrediction = {
          riskScore: data.risk_score || 0,
          riskLevel: data.risk_level || data.outbreak_risk || 'LOW',
          confidence: data.confidence || 0,
          contributingFactors: {
            cluster_factor: data.contributing_factors?.cluster_factor || data.risk_factors?.cluster_factor || 0,
            report_factor: data.contributing_factors?.report_factor || data.risk_factors?.report_factor || 0,
            quality_factor: data.contributing_factors?.quality_factor || data.risk_factors?.quality_factor || 0,
            water_factor: data.contributing_factors?.water_factor || data.risk_factors?.water_factor || 0,
            // ✅ FUSION METADATA
            ml_risk_score: data.contributing_factors?.ml_risk_score,
            rule_risk_score: data.contributing_factors?.rule_risk_score,
            final_risk_score: data.contributing_factors?.final_risk_score,
            fusion_method: data.contributing_factors?.fusion_method
          },
          recommendations: data.recommendations || ['No specific recommendations at this time'],
          modelVersion: data.model_version || 'Unknown'
        };
        
        console.log('Transformed prediction:', transformedData);
        setPrediction(transformedData);
      }
    } catch (error) {
      console.error('Error fetching outbreak prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div className="outbreak-panel loading">Loading prediction...</div>;
  }

  if (!prediction) {
    return <div className="outbreak-panel no-data">No outbreak data available</div>;
  }

  const breadcrumb = getBreadcrumb();
  const hasFilter = breadcrumb.length > 0;

  return (
    <div className="outbreak-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 className="outbreak-title" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #e5e7eb' }}>
        Outbreak Risk Prediction
      </h2>
      
      {hasFilter && (
        <div className="filter-warning" style={{ marginBottom: '12px' }}>
          ⚠️ Note: Risk prediction is region-wide (not filtered by location)
        </div>
      )}
      
      {/* Risk Meter */}
      <div className="risk-meter" style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div className="risk-circle" style={{ 
          borderColor: getRiskColor(prediction.riskLevel),
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div className="risk-score" style={{ margin: 0 }}>{prediction.riskScore.toFixed(1)}</div>
          <div className="risk-label" style={{ margin: 0 }}>{prediction.riskLevel}</div>
        </div>
        <div className="confidence" style={{ margin: 0 }}>
          Confidence: {prediction.confidence.toFixed(0)}%
        </div>
        
        {/* ✅ FUSION INDICATOR */}
        {prediction.contributingFactors.fusion_method === 1 && (
          <div style={{ 
            fontSize: '11px', 
            color: '#6b7280', 
            backgroundColor: '#f3f4f6', 
            padding: '4px 8px', 
            borderRadius: '4px',
            marginTop: '4px'
          }}>
            🔀 Hybrid: ML ({prediction.contributingFactors.ml_risk_score?.toFixed(1)}) + 
            Rule ({prediction.contributingFactors.rule_risk_score?.toFixed(1)})
          </div>
        )}
        
        {prediction.modelVersion && prediction.modelVersion.includes('FUSION') && (
          <div style={{ 
            fontSize: '10px', 
            color: '#059669', 
            fontWeight: 600,
            marginTop: '2px'
          }}>
            ✓ Fusion-Enhanced Prediction
          </div>
        )}
      </div>

      {/* Contributing Factors */}
      <div className="factors" style={{ padding: '16px 0', borderTop: '1px solid #f3f4f6' }}>
        <h3 className="factors-title" style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
          Contributing Factors
        </h3>
        <div className="factor-bars" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="factor" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: '12px', minHeight: '32px' }}>
            <span className="factor-label">Clusters</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${prediction.contributingFactors.cluster_factor}%` }}
              ></div>
            </div>
            <span className="factor-value">{prediction.contributingFactors.cluster_factor.toFixed(1)}</span>
          </div>
          <div className="factor" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: '12px', minHeight: '32px' }}>
            <span className="factor-label">Reports</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${prediction.contributingFactors.report_factor}%` }}
              ></div>
            </div>
            <span className="factor-value">{prediction.contributingFactors.report_factor.toFixed(1)}</span>
          </div>
          <div className="factor" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: '12px', minHeight: '32px' }}>
            <span className="factor-label">Quality</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${prediction.contributingFactors.quality_factor}%` }}
              ></div>
            </div>
            <span className="factor-value">{prediction.contributingFactors.quality_factor.toFixed(1)}</span>
          </div>
          <div className="factor" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: '12px', minHeight: '32px' }}>
            <span className="factor-label">Water</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${prediction.contributingFactors.water_factor}%` }}
              ></div>
            </div>
            <span className="factor-value">{prediction.contributingFactors.water_factor.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Trend Analysis (if available) */}
      {prediction.contributingFactors.ml_risk_score && prediction.contributingFactors.rule_risk_score && (
        <div className="trend-analysis" style={{ padding: '16px 0', borderTop: '1px solid #f3f4f6' }}>
          <h3 className="trend-title" style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
            Risk Analysis Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>ML Risk Score</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {prediction.contributingFactors.ml_risk_score.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                Pattern-based prediction
              </div>
            </div>
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Rule-Based Risk</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {prediction.contributingFactors.rule_risk_score.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                Threshold-based assessment
              </div>
            </div>
          </div>
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px',
            border: '1px solid #fbbf24'
          }}>
            <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600, marginBottom: '4px' }}>
              🔀 Fusion Result
            </div>
            <div style={{ fontSize: '14px', color: '#78350f' }}>
              Final Risk: <strong>{prediction.riskScore.toFixed(1)}</strong> = max(
              ML: {prediction.contributingFactors.ml_risk_score.toFixed(1)}, 
              Rule: {prediction.contributingFactors.rule_risk_score.toFixed(1)})
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="recommendations" style={{ padding: '16px 0', borderTop: '1px solid #f3f4f6' }}>
        <h3 className="recommendations-title" style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
          Recommendations
        </h3>
        <ul className="recommendations-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {prediction.recommendations.map((rec, index) => (
            <li 
              key={index} 
              className={`recommendation-item ${rec.startsWith('PRIORITY') ? 'priority' : ''}`}
              style={{ display: 'block', marginBottom: '8px' }}
            >
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OutbreakPredictionPanel;
