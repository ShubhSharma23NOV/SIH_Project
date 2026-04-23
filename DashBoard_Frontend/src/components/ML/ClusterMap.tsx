import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import { matchesState } from '../../utils/locationMapper';
import './ClusterMap.css';

interface Cluster {
  id: string;
  location: string;
  centroid: {
    latitude: number;
    longitude: number;
  };
  reportCount: number;
  dominantSymptoms: string[];
  clusterScore: number;
  status: string;
}

const ClusterMap: React.FC = () => {
  const { filter } = useGlobalFilter();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClusters = React.useCallback(async () => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    
    try {
      // Use the /api/clusters/active endpoint which returns properly formatted data
      const response = await fetch(`${API_BASE}/api/clusters/active`);
      if (response.ok) {
        const data = await response.json();
        
        // Transform backend response to match frontend interface
        const transformedClusters: Cluster[] = Array.isArray(data) 
          ? data.map((cluster: any, index: number) => ({
              id: cluster.id || `cluster-${index}`,
              location: cluster.location || 'Unknown Location',
              centroid: {
                latitude: cluster.latitude || 26.2006,
                longitude: cluster.longitude || 92.9376
              },
              reportCount: cluster.reportCount || 0,
              dominantSymptoms: cluster.dominantSymptoms || ['No symptoms'],
              clusterScore: cluster.clusterScore || 0,
              status: cluster.status || 'ACTIVE'
            }))
          : [];
        
        // Filter clusters based on global filter
        const filteredClusters = transformedClusters.filter((cluster: Cluster) => {
          // For now, show all clusters as they are region-wide
          // Can be enhanced to filter by location if cluster data includes proper location info
          if (filter.state && cluster.location) {
            return matchesState(cluster.location, filter.state);
          }
          return true;
        });
        
        console.log('Transformed clusters:', filteredClusters);
        setClusters(filteredClusters);
      }
    } catch (error) {
      console.error('Error fetching clusters:', error);
      setClusters([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchClusters();
    const interval = setInterval(fetchClusters, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchClusters]);

  const getClusterIcon = (score: number) => {
    const color = score >= 75 ? '#dc2626' : score >= 50 ? '#f59e0b' : '#10b981';
    return L.divIcon({
      className: 'cluster-marker',
      html: `<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${score.toFixed(0)}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const getClusterRadius = (reportCount: number) => {
    return Math.min(reportCount * 500, 5000); // Max 5km radius
  };

  const getClusterColor = (score: number) => {
    if (score >= 75) return '#dc2626';
    if (score >= 50) return '#f59e0b';
    return '#10b981';
  };

  if (loading) {
    return <div className="cluster-map loading">Loading clusters...</div>;
  }

  if (!clusters || clusters.length === 0) {
    return (
      <div className="cluster-map-container">
        <div className="cluster-map-header">
          <h2>Active Symptom Clusters</h2>
          <div className="cluster-count">0 Active Clusters</div>
        </div>
        <div className="no-clusters">
          <p>No active symptom clusters detected.</p>
          <p>This is a good sign - no outbreak patterns identified.</p>
        </div>
      </div>
    );
  }

  // Calculate center point of all clusters for better map view
  const calculateMapCenter = (): [number, number] => {
    if (clusters.length === 0) {
      return [26.2006, 92.9376]; // North East India center
    }
    
    const avgLat = clusters.reduce((sum, c) => sum + c.centroid.latitude, 0) / clusters.length;
    const avgLon = clusters.reduce((sum, c) => sum + c.centroid.longitude, 0) / clusters.length;
    return [avgLat, avgLon];
  };

  const defaultCenter = calculateMapCenter();

  return (
    <div className="cluster-map-container">
      <div className="cluster-map-header">
        <h2>Active Symptom Clusters</h2>
        <div className="cluster-count">
          {clusters.length} Active Cluster{clusters.length !== 1 ? 's' : ''}
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={7}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {clusters.map((cluster) => (
          <React.Fragment key={cluster.id}>
            {/* Cluster Circle */}
            <Circle
              center={[cluster.centroid.latitude, cluster.centroid.longitude]}
              radius={getClusterRadius(cluster.reportCount)}
              pathOptions={{
                color: getClusterColor(cluster.clusterScore),
                fillColor: getClusterColor(cluster.clusterScore),
                fillOpacity: 0.2,
                weight: 2
              }}
            />

            {/* Cluster Marker */}
            <Marker
              position={[cluster.centroid.latitude, cluster.centroid.longitude]}
              icon={getClusterIcon(cluster.clusterScore)}
            >
              <Popup>
                <div className="cluster-popup">
                  <h3>{cluster.location}</h3>
                  <div className="cluster-info">
                    <div className="info-row">
                      <span className="label">Reports:</span>
                      <span className="value">{cluster.reportCount}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Score:</span>
                      <span className="value">{cluster.clusterScore.toFixed(1)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Status:</span>
                      <span className={`status ${cluster.status.toLowerCase()}`}>
                        {cluster.status}
                      </span>
                    </div>
                  </div>
                  <div className="symptoms">
                    <strong>Dominant Symptoms:</strong>
                    <ul>
                      {cluster.dominantSymptoms.slice(0, 3).map((symptom, idx) => (
                        <li key={idx}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="cluster-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#dc2626' }}></div>
          <span>High Risk (75+)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#f59e0b' }}></div>
          <span>Medium Risk (50-74)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#10b981' }}></div>
          <span>Low Risk (&lt;50)</span>
        </div>
      </div>
    </div>
  );
};

export default ClusterMap;
