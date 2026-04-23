import { useState } from 'react';
import axios from 'axios';
import { generatePDF } from '../utils/pdfGenerator';
import { generateGovernmentReport } from '../utils/govPdfGenerator';
import { exportToExcel, exportComplianceToCSV, exportAlertsToCSV } from '../utils/excelExporter';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

interface ReportFilters {
  type?: string;
  state?: string;
  district?: string;
  city?: string;
  village?: string;
  range?: string;
  format?: 'pdf' | 'excel' | 'csv-compliance' | 'csv-alerts';
  useGovernmentFormat?: boolean;
}

export const useReportDownload = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadReport = async (filters: ReportFilters) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('📊 Step 1: Requesting report with filters:', filters);

      // Build query params
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.state) params.append('state', filters.state);
      if (filters.district) params.append('district', filters.district);
      if (filters.city) params.append('city', filters.city);
      if (filters.village) params.append('village', filters.village);
      params.append('range', filters.range || '24h');

      const url = `${API_BASE_URL}/api/report?${params.toString()}`;
      console.log('📡 Fetching report data from:', url);

      // Fetch report data
      const response = await axios.get(url, {
        timeout: 30000, // 30 second timeout
      });

      console.log('✅ Report data received');

      const format = filters.format || 'pdf';
      const useGovFormat = filters.useGovernmentFormat !== false; // Default to true

      // Generate report based on format
      if (format === 'pdf') {
        if (useGovFormat) {
          console.log('📊 Generating Government Standard PDF...');
          await generateGovernmentReport(transformToGovFormat(response.data, filters));
        } else {
          console.log('📊 Generating Legacy PDF with charts...');
          await generatePDF(response.data, true);
        }
      } else if (format === 'excel') {
        console.log('📊 Generating Excel report...');
        exportToExcel(transformToExcelFormat(response.data, filters));
      } else if (format === 'csv-compliance') {
        console.log('📊 Generating Compliance CSV...');
        exportComplianceToCSV(transformToExcelFormat(response.data, filters).sources);
      } else if (format === 'csv-alerts') {
        console.log('📊 Generating Alerts CSV...');
        exportAlertsToCSV(transformToExcelFormat(response.data, filters).alerts);
      }

      console.log('✅ Report generated successfully');
      
      return { success: true };

    } catch (err: any) {
      console.error('❌ Error generating report:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Could not generate report right now. Please try again.';
      
      setError(errorMessage);
      return { success: false, error: errorMessage };

    } finally {
      setIsGenerating(false);
    }
  };

  return {
    downloadReport,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
};

// Transform legacy report data to government format
const transformToGovFormat = (legacyData: any, filters: ReportFilters): any => {
  const now = new Date();
  const rangeHours = filters.range === '7d' ? 168 : filters.range === '30d' ? 720 : 24;
  const startDate = new Date(now.getTime() - rangeHours * 60 * 60 * 1000);

  // Build region string
  const regionParts = [filters.state, filters.district, filters.city, filters.village].filter(Boolean);
  const region = regionParts.length > 0 ? regionParts.join(' → ') : legacyData.metadata?.regionName || 'All Regions';

  // Transform sources
  const sources = (legacyData.sensorHistory || []).map((sensor: any) => {
    const latestReading = sensor.readings && sensor.readings.length > 0 
      ? sensor.readings[sensor.readings.length - 1] 
      : null;

    return {
      id: sensor.deviceId,
      name: sensor.deviceId,
      location: sensor.location || 'Unknown',
      status: latestReading ? 'Functional' : 'Non-Functional',
      lastSample: latestReading ? {
        timestamp: latestReading.timestamp,
        ph: latestReading.ph,
        tds: latestReading.tds,
        turbidity: latestReading.turbidity,
        temperature: latestReading.temperature,
        wqi: latestReading.wqi
      } : undefined
    };
  });

  // Calculate summary
  const functionalSources = sources.filter((s: any) => s.status === 'Functional').length;
  const samplesTested = sources.filter((s: any) => s.lastSample).length;
  
  let safeCount = 0;
  let unsafeCount = 0;
  sources.forEach((source: any) => {
    if (source.lastSample) {
      const sample = source.lastSample;
      const isSafe = 
        (sample.ph === undefined || (sample.ph >= 6.5 && sample.ph <= 8.5)) &&
        (sample.tds === undefined || sample.tds <= 2000) &&
        (sample.turbidity === undefined || sample.turbidity <= 5);
      
      if (isSafe) safeCount++;
      else unsafeCount++;
    }
  });

  // Determine risk level
  let outbreakRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (legacyData.mlPrediction) {
    const score = legacyData.mlPrediction.riskScore || 0;
    if (score >= 75) outbreakRiskLevel = 'Critical';
    else if (score >= 50) outbreakRiskLevel = 'High';
    else if (score >= 25) outbreakRiskLevel = 'Medium';
  }

  // Transform alerts
  const alerts = (legacyData.alerts || []).map((alert: any) => ({
    id: alert.alertId,
    type: alert.type,
    source: alert.deviceId || 'Unknown',
    condition: alert.description || alert.type,
    timestamp: alert.timestamp,
    status: alert.status,
    severity: alert.severity
  }));

  return {
    metadata: {
      region,
      state: filters.state,
      district: filters.district,
      block: filters.city,
      village: filters.village,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      reportId: `RPT-${now.toISOString().split('T')[0].replace(/-/g, '')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`,
      preparedBy: 'ArogyaJal System',
      officerName: undefined,
      version: '1.2.1'
    },
    summary: {
      totalSources: sources.length,
      functionalSources,
      samplesTested,
      safeCount,
      unsafeCount,
      outbreakRiskLevel,
      activeAlerts: alerts.length
    },
    sources,
    alerts,
    mlPrediction: legacyData.mlPrediction,
    trends: legacyData.sensorHistory && legacyData.sensorHistory.length > 0 ? {
      labels: legacyData.sensorHistory[0].readings?.map((r: any) => 
        new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      ) || [],
      ph: legacyData.sensorHistory[0].readings?.map((r: any) => r.ph) || [],
      tds: legacyData.sensorHistory[0].readings?.map((r: any) => r.tds) || [],
      turbidity: legacyData.sensorHistory[0].readings?.map((r: any) => r.turbidity) || [],
      temperature: legacyData.sensorHistory[0].readings?.map((r: any) => r.temperature) || []
    } : undefined
  };
};

// Transform to Excel format (similar structure)
const transformToExcelFormat = (legacyData: any, filters: ReportFilters): any => {
  const govData = transformToGovFormat(legacyData, filters);
  return {
    metadata: {
      region: govData.metadata.region,
      dateRange: govData.metadata.dateRange,
      reportId: govData.metadata.reportId,
      generatedAt: new Date().toISOString()
    },
    summary: govData.summary,
    sources: govData.sources,
    alerts: govData.alerts
  };
};
