import React, { useState, useEffect, useCallback } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import { useToast } from '../../contexts/ToastContext';
import { getAllowedDeviceIds } from '../../utils/locationMapper';
import { getStatusColor } from '../../utils/statusConfig';
import '../../App.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ArcElement,
} from 'chart.js';
import {
  getAllSensorReadings,
  type TrendsResponse,
  type SensorReading,
  type DataPoint,
} from '../../services/api.service';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ParameterConfig {
  label: string;
  color: string;
  unit: string;
  key: string;
}

const PARAMETERS: ParameterConfig[] = [
  { label: 'pH Level', color: 'rgb(75, 192, 192)', unit: '', key: 'ph' },
  { label: 'Temperature', color: 'rgb(255, 99, 132)', unit: '°C', key: 'temperature' },
  { label: 'Turbidity', color: 'rgb(255, 205, 86)', unit: 'NTU', key: 'turbidity' },
  { label: 'Total Dissolved Solids', color: 'rgb(54, 162, 235)', unit: 'ppm', key: 'totalDissolvedSolids' },
];

const Trends: React.FC = () => {
  const { filter, getBreadcrumb } = useGlobalFilter();
  const { addToast } = useToast();
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(24);
  const [selectedParameter, setSelectedParameter] = useState<string>('ph');
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [allReadings, setAllReadings] = useState<SensorReading[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDeviceIds = useCallback(async () => {
    try {
      // Get allowed device IDs based on global filter
      const allowedDeviceIds = await getAllowedDeviceIds({
        state: filter.state,
        district: filter.district,
        city: filter.city,
        village: filter.village
      });

      // Convert Set to Array
      const filteredIds = Array.from(allowedDeviceIds);
      setDeviceIds(filteredIds);
    } catch (err) {
      console.error('Error fetching device IDs:', err);
      addToast('Failed to fetch device IDs', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchAllReadings = useCallback(async () => {
    try {
      // Get allowed device IDs based on global filter
      const allowedDeviceIds = await getAllowedDeviceIds({
        state: filter.state,
        district: filter.district,
        city: filter.city,
        village: filter.village
      });

      const readings = await getAllSensorReadings();
      // Filter readings based on allowed device IDs
      const filteredReadings = readings.filter(reading => {
        // If no filter, show all
        if (allowedDeviceIds.size === 0 && !filter.state && !filter.district && !filter.city && !filter.village) {
          return true;
        }
        // Check if device is in allowed list
        if (allowedDeviceIds.size > 0 && !allowedDeviceIds.has(reading.sensorId)) {
          return false;
        }
        // Check specific deviceId filter
        if (filter.deviceId && reading.sensorId !== filter.deviceId) {
          return false;
        }
        return true;
      });
      setAllReadings(filteredReadings);
    } catch (err) {
      console.error('Error fetching all readings:', err);
      addToast('Failed to fetch sensor readings', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get allowed device IDs based on global filter
      const allowedDeviceIds = await getAllowedDeviceIds({
        state: filter.state,
        district: filter.district,
        city: filter.city,
        village: filter.village
      });

      // Fetch all readings and transform them into trends format
      const readings = await getAllSensorReadings();

      // Helper function to convert timestamp to Date
      const parseTimestamp = (timestamp: string | { seconds: number; nanos: number }): Date => {
        if (typeof timestamp === 'string') {
          return new Date(timestamp);
        } else {
          return new Date(timestamp.seconds * 1000);
        }
      };

      // Filter readings by time range AND global filter
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - timeRange * 60 * 60 * 1000);

      const filteredReadings = readings.filter(reading => {
        // Time range filter
        const readingTime = parseTimestamp(reading.timestamp);
        if (readingTime < cutoffTime) return false;

        // Global filter - Check if device is in allowed list
        if (allowedDeviceIds.size > 0 && !allowedDeviceIds.has(reading.sensorId)) {
          return false;
        }

        // Global filter - Specific device
        if (filter.deviceId && reading.sensorId !== filter.deviceId) {
          return false;
        }

        return true;
      });

      // Transform readings into trends format
      const trends: { [key: string]: DataPoint[] } = {};
      const latestValues: { [key: string]: number } = {};

      PARAMETERS.forEach(param => {
        trends[param.key] = filteredReadings
          .filter(r => {
            const value = r[param.key as keyof SensorReading];
            return value !== null && value !== undefined;
          })
          .map(r => ({
            timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date(r.timestamp.seconds * 1000).toISOString(),
            value: Number(r[param.key as keyof SensorReading])
          }))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Get latest value
        if (trends[param.key].length > 0) {
          latestValues[param.key] = trends[param.key][trends[param.key].length - 1].value;
        }
      });

      setTrendsData({
        trends,
        latestValues,
        timeRange: `${timeRange} hours`
      });

      // Set filtered readings for pie charts
      setAllReadings(filteredReadings);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load trends data. Please check if the backend is running.');
      console.error('Error fetching trends:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, filter]);

  useEffect(() => {
    fetchDeviceIds();
    fetchAllReadings();
  }, [fetchDeviceIds, fetchAllReadings]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrends();
      fetchAllReadings();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchTrends, fetchAllReadings]);

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (timeRange <= 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getChartData = (paramKey: string) => {
    if (!trendsData || !trendsData.trends[paramKey]) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const paramConfig = PARAMETERS.find(p => p.key === paramKey);
    const dataPoints = trendsData.trends[paramKey];

    return {
      labels: dataPoints.map(dp => formatTimestamp(dp.timestamp)),
      datasets: [
        {
          label: paramConfig?.label || paramKey,
          data: dataPoints.map(dp => dp.value),
          borderColor: paramConfig?.color || 'rgb(75, 192, 192)',
          backgroundColor: paramConfig?.color ? `${paramConfig.color.replace('rgb', 'rgba').replace(')', ', 0.1)')}` : 'rgba(75, 192, 192, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const getChartOptions = (paramKey: string): ChartOptions<'line'> => {
    const paramConfig = PARAMETERS.find(p => p.key === paramKey);

    // Special handling for pH scale
    const yAxisConfig = paramKey === 'ph' ? {
      beginAtZero: true,
      min: 0,
      max: 14,
      ticks: {
        color: '#666',
        stepSize: 2,
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    } : {
      beginAtZero: false,
      ticks: {
        color: '#666',
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    };

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#333',
            font: {
              size: 12,
            },
          },
        },
        title: {
          display: true,
          text: `${paramConfig?.label || paramKey} ${paramConfig?.unit ? `(${paramConfig.unit})` : ''}`,
          color: '#333',
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y.toFixed(2);
              return `${context.dataset.label}: ${value} ${paramConfig?.unit || ''}`;
            },
          },
        },
      },
      scales: {
        y: yAxisConfig,
        x: {
          ticks: {
            color: '#666',
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
      },
    };
  };

  const getLatestValue = (paramKey: string): string => {
    if (!trendsData || !trendsData.latestValues[paramKey]) {
      return 'No data';
    }
    const paramConfig = PARAMETERS.find(p => p.key === paramKey);
    const value = trendsData.latestValues[paramKey].toFixed(2);
    return `${value} ${paramConfig?.unit || ''}`;
  };

  // Pie chart for quality status distribution
  const getQualityStatusDistribution = () => {
    const statusCount: { [key: string]: number } = {};

    allReadings.forEach(reading => {
      const status = reading.qualityStatus || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return statusCount;
  };

  const getQualityPieData = () => {
    const distribution = getQualityStatusDistribution();
    const labels = Object.keys(distribution);
    const data = Object.values(distribution);

    const colors = labels.map(label => getStatusColor(label));

    return {
      labels,
      datasets: [
        {
          label: 'Water Quality Status',
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c),
          borderWidth: 2,
        },
      ],
    };
  };

  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#333',
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Water Quality Status Distribution',
        color: '#333',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} readings (${percentage}%)`;
          },
        },
      },
    },
  };

  // Pie chart for parameter ranges
  const getParameterRangeDistribution = (paramKey: string) => {
    if (!trendsData || !trendsData.trends[paramKey]) return null;

    const dataPoints = trendsData.trends[paramKey];
    const ranges: { [key: string]: number } = {};

    // Define ranges based on parameter
    const getRangeLabel = (value: number, param: string): string => {
      switch (param) {
        case 'ph':
          if (value < 6.5) return 'Acidic (<6.5)';
          if (value <= 8.5) return 'Normal (6.5-8.5)';
          return 'Alkaline (>8.5)';
        case 'temperature':
          if (value < 20) return 'Cold (<20°C)';
          if (value <= 30) return 'Normal (20-30°C)';
          return 'Warm (>30°C)';
        case 'turbidity':
          if (value < 5) return 'Clear (<5 NTU)';
          if (value <= 25) return 'Moderate (5-25 NTU)';
          return 'Cloudy (>25 NTU)';
        case 'totalDissolvedSolids':
          if (value < 300) return 'Good (<300 ppm)';
          if (value <= 600) return 'Acceptable (300-600 ppm)';
          return 'High (>600 ppm)';
        case 'conductivity':
          if (value < 500) return 'Low (<500 μS/cm)';
          if (value <= 1500) return 'Normal (500-1500 μS/cm)';
          return 'High (>1500 μS/cm)';
        default:
          return 'Unknown';
      }
    };

    dataPoints.forEach(dp => {
      const rangeLabel = getRangeLabel(dp.value, paramKey);
      ranges[rangeLabel] = (ranges[rangeLabel] || 0) + 1;
    });

    return ranges;
  };

  const getParameterPieData = (paramKey: string) => {
    const distribution = getParameterRangeDistribution(paramKey);
    if (!distribution) return null;

    const labels = Object.keys(distribution);
    const data = Object.values(distribution);

    const paramConfig = PARAMETERS.find(p => p.key === paramKey);
    const baseColor = paramConfig?.color || 'rgb(75, 192, 192)';

    // Generate shades of the base color
    const colors = labels.map((_, index) => {
      const opacity = 0.4 + (index * 0.3);
      return baseColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    });

    return {
      labels,
      datasets: [
        {
          label: paramConfig?.label || paramKey,
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace(/[\d.]+\)$/g, '1)')),
          borderWidth: 2,
        },
      ],
    };
  };

  const breadcrumb = getBreadcrumb();
  const hasFilter = breadcrumb.length > 0;

  return (
    <div className="page-content">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>Water Quality Trends - North East India</h1>
        <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
          Historical analysis and forecasting for NER region
          {hasFilter && (
            <span style={{ marginLeft: '10px', color: '#667eea', fontWeight: '500' }}>
              (Filtered: {breadcrumb.join(' › ')})
            </span>
          )}
        </p>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Time Range Selector */}
          <div>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={168}>Last 7 Days</option>
              <option value={720}>Last 30 Days</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchTrends();
              fetchAllReadings();
            }}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          {/* Auto-refresh Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Auto-refresh (10s)</span>
          </label>

          {/* Last Updated */}
          <div style={{ fontSize: '14px', color: '#666' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>

          {/* Device Count */}
          {deviceIds.length > 0 && (
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              fontSize: '14px',
            }}>
              <strong>{deviceIds.length}</strong> Active Device{deviceIds.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {/* Latest Values Summary */}
        {trendsData && !loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '30px',
          }}>
            {PARAMETERS.map(param => (
              <div
                key={param.key}
                style={{
                  padding: '15px',
                  backgroundColor: selectedParameter === param.key ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '8px',
                  border: selectedParameter === param.key ? '2px solid #2196F3' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onClick={() => setSelectedParameter(param.key)}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  {param.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: param.color }}>
                  {getLatestValue(param.key)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
          Loading trends data...
        </div>
      ) : trendsData && trendsData.trends[selectedParameter] && trendsData.trends[selectedParameter].length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Selected Parameter Chart (Large) */}
          <div>
            <h2 className="chart-section-header">📈 Detailed Trend Analysis</h2>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              height: '400px',
            }}>
              <Line options={getChartOptions(selectedParameter)} data={getChartData(selectedParameter)} />
            </div>
          </div>

          {/* Pie Charts Section */}
          <div>
            <h2 className="chart-section-header">📊 Distribution Analysis</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Quality Status Distribution Pie Chart */}
              {allReadings.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    height: '400px',
                  }}
                >
                  <Pie options={pieOptions} data={getQualityPieData()} />
                </div>
              )}

              {/* Selected Parameter Range Distribution */}
              {getParameterPieData(selectedParameter) && (
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    height: '400px',
                  }}
                >
                  <Pie
                    options={{
                      ...pieOptions,
                      plugins: {
                        ...pieOptions.plugins,
                        title: {
                          ...pieOptions.plugins?.title,
                          text: `${PARAMETERS.find(p => p.key === selectedParameter)?.label} Range Distribution`,
                        },
                      },
                    }}
                    data={getParameterPieData(selectedParameter)!}
                  />
                </div>
              )}
            </div>
          </div>

          {/* All Parameters Grid */}
          <div>
            <h2 className="chart-section-header">📉 All Parameters Overview</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px',
            }}>
              {PARAMETERS.filter(p => p.key !== selectedParameter).map(param => (
                <div
                  key={param.key}
                  style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    height: '300px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedParameter(param.key)}
                >
                  <Line
                    options={getChartOptions(param.key)}
                    data={getChartData(param.key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '20px' }}>
            No Historical Data Available
          </h3>
          <p style={{ margin: '0', color: '#64748b', fontSize: '16px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            {filter.state || filter.district || filter.city || filter.village
              ? `No historical data available for the selected region (${getBreadcrumb().join(' › ')}) and time range.`
              : 'No historical data available for the selected time range. Please select a location filter or ensure sensors are sending data.'}
          </p>
          <p style={{ margin: '15px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Try selecting a different time range or location filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default Trends;
