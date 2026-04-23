import * as XLSX from 'xlsx';

// ============================================================================
// EXCEL EXPORT UTILITY FOR GOVERNMENT REPORTS
// ============================================================================

interface ExcelReportData {
  metadata: {
    region: string;
    dateRange: { start: string; end: string };
    reportId: string;
    generatedAt: string;
  };
  summary: {
    totalSources: number;
    functionalSources: number;
    samplesTested: number;
    safeCount: number;
    unsafeCount: number;
    outbreakRiskLevel: string;
    activeAlerts: number;
  };
  sources: Array<{
    id: string;
    name: string;
    location: string;
    status: string;
    lastSample?: {
      timestamp: string;
      ph?: number;
      tds?: number;
      turbidity?: number;
      temperature?: number;
      wqi?: number;
    };
  }>;
  alerts: Array<{
    id: string;
    type: string;
    source: string;
    condition: string;
    timestamp: string;
    status: string;
    severity: string;
  }>;
}

export const exportToExcel = (data: ExcelReportData): void => {
  const workbook = XLSX.utils.book_new();

  // ========================================================================
  // SHEET 1: SUMMARY
  // ========================================================================
  const summaryData = [
    ['ArogyaJal Water Quality Report'],
    [''],
    ['Report Metadata'],
    ['Region', data.metadata.region],
    ['Report ID', data.metadata.reportId],
    ['Date Range', `${new Date(data.metadata.dateRange.start).toLocaleString()} - ${new Date(data.metadata.dateRange.end).toLocaleString()}`],
    ['Generated At', new Date(data.metadata.generatedAt).toLocaleString()],
    [''],
    ['Executive Summary'],
    ['Total Water Sources', data.summary.totalSources],
    ['Functional Sources', data.summary.functionalSources],
    ['Samples Tested', data.summary.samplesTested],
    ['Safe Count', data.summary.safeCount],
    ['Unsafe Count', data.summary.unsafeCount],
    ['Outbreak Risk Level', data.summary.outbreakRiskLevel],
    ['Active Water Safety Incidents', data.summary.activeAlerts]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  summarySheet['!cols'] = [
    { wch: 30 },
    { wch: 50 }
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // ========================================================================
  // SHEET 2: COMPLIANCE OVERVIEW
  // ========================================================================
  const complianceData = [
    ['Source Name', 'Location', 'Source ID', 'Status', 'Last Sample Time', 'pH', 'TDS', 'Turbidity', 'Temperature', 'WQI']
  ];

  data.sources.forEach(source => {
    const sample = source.lastSample;
    complianceData.push([
      source.name,
      source.location,
      source.id,
      source.status,
      sample ? new Date(sample.timestamp).toLocaleString() : 'N/A',
      sample?.ph?.toFixed(2) || 'N/A',
      sample?.tds?.toFixed(0) || 'N/A',
      sample?.turbidity?.toFixed(2) || 'N/A',
      sample?.temperature?.toFixed(1) || 'N/A',
      sample?.wqi?.toFixed(1) || 'N/A'
    ]);
  });

  const complianceSheet = XLSX.utils.aoa_to_sheet(complianceData);
  
  // Set column widths
  complianceSheet['!cols'] = [
    { wch: 25 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 }
  ];

  XLSX.utils.book_append_sheet(workbook, complianceSheet, 'Compliance Overview');

  // ========================================================================
  // SHEET 3: PARAMETER DETAILS
  // ========================================================================
  const parameterData = [
    ['Source ID', 'Source Name', 'Parameter', 'Value', 'Unit', 'BIS Limit', 'Status']
  ];

  data.sources.forEach(source => {
    const sample = source.lastSample;
    if (sample) {
      if (sample.ph !== undefined) {
        const compliant = sample.ph >= 6.5 && sample.ph <= 8.5;
        parameterData.push([
          source.id,
          source.name,
          'pH',
          sample.ph.toFixed(2),
          '-',
          '6.5-8.5',
          compliant ? 'Compliant' : 'Non-Compliant'
        ]);
      }
      if (sample.tds !== undefined) {
        const compliant = sample.tds <= 2000;
        parameterData.push([
          source.id,
          source.name,
          'TDS',
          sample.tds.toFixed(0),
          'mg/L',
          '<2000',
          compliant ? 'Compliant' : 'Non-Compliant'
        ]);
      }
      if (sample.turbidity !== undefined) {
        const compliant = sample.turbidity <= 5;
        parameterData.push([
          source.id,
          source.name,
          'Turbidity',
          sample.turbidity.toFixed(2),
          'NTU',
          '<5',
          compliant ? 'Compliant' : 'Non-Compliant'
        ]);
      }
      if (sample.temperature !== undefined) {
        const compliant = sample.temperature >= 15 && sample.temperature <= 30;
        parameterData.push([
          source.id,
          source.name,
          'Temperature',
          sample.temperature.toFixed(1),
          '°C',
          '15-30',
          compliant ? 'Compliant' : 'Check'
        ]);
      }
    }
  });

  const parameterSheet = XLSX.utils.aoa_to_sheet(parameterData);
  
  parameterSheet['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, parameterSheet, 'Parameter Details');

  // ========================================================================
  // SHEET 4: ALERTS
  // ========================================================================
  const alertsData = [
    ['Alert ID', 'Type', 'Source', 'Severity', 'Condition', 'Timestamp', 'Status']
  ];

  data.alerts.forEach(alert => {
    alertsData.push([
      alert.id,
      alert.type,
      alert.source,
      alert.severity,
      alert.condition,
      new Date(alert.timestamp).toLocaleString(),
      alert.status
    ]);
  });

  const alertsSheet = XLSX.utils.aoa_to_sheet(alertsData);
  
  alertsSheet['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 12 },
    { wch: 40 },
    { wch: 20 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, alertsSheet, 'Alerts');

  // ========================================================================
  // SAVE WORKBOOK
  // ========================================================================
  const regionName = data.metadata.region.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = `ArogyaJal_Report_${regionName}_${dateStr}_${timeStr.substring(0, 4)}.xlsx`;

  XLSX.writeFile(workbook, filename);
  console.log(`✅ Excel report generated: ${filename}`);
};

// ========================================================================
// CSV EXPORT FOR SPECIFIC TABLES
// ========================================================================

export const exportComplianceToCSV = (sources: ExcelReportData['sources']): void => {
  const csvData = [
    ['Source Name', 'Location', 'Source ID', 'Status', 'Last Sample Time', 'pH', 'TDS', 'Turbidity', 'Temperature', 'WQI']
  ];

  sources.forEach(source => {
    const sample = source.lastSample;
    csvData.push([
      source.name,
      source.location,
      source.id,
      source.status,
      sample ? new Date(sample.timestamp).toLocaleString() : 'N/A',
      sample?.ph?.toFixed(2) || 'N/A',
      sample?.tds?.toFixed(0) || 'N/A',
      sample?.turbidity?.toFixed(2) || 'N/A',
      sample?.temperature?.toFixed(1) || 'N/A',
      sample?.wqi?.toFixed(1) || 'N/A'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(csvData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Compliance');

  const filename = `ArogyaJal_Compliance_${new Date().toISOString().split('T')[0]}.csv`;
  XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  console.log(`✅ CSV export generated: ${filename}`);
};

export const exportAlertsToCSV = (alerts: ExcelReportData['alerts']): void => {
  const csvData = [
    ['Alert ID', 'Type', 'Source', 'Severity', 'Condition', 'Timestamp', 'Status']
  ];

  alerts.forEach(alert => {
    csvData.push([
      alert.id,
      alert.type,
      alert.source,
      alert.severity,
      alert.condition,
      new Date(alert.timestamp).toLocaleString(),
      alert.status
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(csvData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alerts');

  const filename = `ArogyaJal_Alerts_${new Date().toISOString().split('T')[0]}.csv`;
  XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  console.log(`✅ CSV export generated: ${filename}`);
};
