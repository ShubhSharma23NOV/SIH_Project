import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

// ============================================================================
// GOVERNMENT STANDARD PDF REPORT GENERATOR
// Implements BIS IS 10500:2012 compliance reporting
// ============================================================================

// BIS IS 10500:2012 Standards
const BIS_STANDARDS = {
  ph: { min: 6.5, max: 8.5, unit: '-', name: 'pH' },
  tds: { acceptable: 500, permissible: 2000, unit: 'mg/L', name: 'TDS' },
  turbidity: { acceptable: 1, permissible: 5, unit: 'NTU', name: 'Turbidity' },
  temperature: { min: 15, max: 30, unit: '°C', name: 'Temperature' },
  conductivity: { max: 2000, unit: 'μS/cm', name: 'Conductivity' }
};

// Government color scheme
const COLORS = {
  navyBlue: [12, 59, 97] as [number, number, number],
  grey: [244, 246, 248] as [number, number, number],
  green: [39, 174, 96] as [number, number, number],
  amber: [243, 156, 18] as [number, number, number],
  red: [211, 47, 47] as [number, number, number],
  darkGrey: [100, 100, 100] as [number, number, number]
};

interface WaterSource {
  id: string;
  name: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  status: string;
  lastSample?: {
    timestamp: string;
    ph?: number;
    tds?: number;
    turbidity?: number;
    temperature?: number;
    conductivity?: number;
    wqi?: number;
  };
}

interface Alert {
  id: string;
  type: string;
  source: string;
  condition: string;
  timestamp: string;
  status: string;
  severity: string;
}

interface GovReportData {
  metadata: {
    region: string;
    state?: string;
    district?: string;
    block?: string;
    village?: string;
    dateRange: { start: string; end: string };
    reportId: string;
    preparedBy: string;
    officerName?: string;
    version: string;
  };
  summary: {
    totalSources: number;
    functionalSources: number;
    samplesTested: number;
    safeCount: number;
    unsafeCount: number;
    outbreakRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    activeAlerts: number;
  };
  sources: WaterSource[];
  alerts: Alert[];
  mlPrediction?: {
    riskScore: number;
    riskLevel: string;
    confidence: number;
    contributingFactors: Record<string, number>;
    recommendations: string[];
  };
  trends?: {
    labels: string[];
    ph: number[];
    tds: number[];
    turbidity: number[];
    temperature: number[];
  };
}

export const generateGovernmentReport = async (data: GovReportData): Promise<void> => {
  const doc = new jsPDF();
  doc.setFont('helvetica');
  
  let yPos = 20;
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);

  // Helper: Set color safely
  const setColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  // Helper: Check page break
  const checkPageBreak = (space: number = 40) => {
    if (yPos > 280 - space) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Helper: Add text with wrapping
  const addText = (text: string, x: number, y: number, maxWidth: number = contentWidth) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 7);
  };

  // ========================================================================
  // SECTION 1: HEADER PAGE
  // ========================================================================
  
  // Government emblem placeholder (centered)
  setFillColor(COLORS.navyBlue);
  doc.circle(pageWidth / 2, yPos + 10, 8, 'F');
  yPos += 25;

  // Title (English only - Hindi requires special font support)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.navyBlue);
  doc.text('Water Quality Assessment Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.setFontSize(14);
  doc.text('Jal Gunvatta Mulyankan Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Project name
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text('ArogyaJal — Smart Water Safety & Outbreak Monitoring System', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Region information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Region:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const regionParts = [
    data.metadata.state,
    data.metadata.district,
    data.metadata.block,
    data.metadata.village
  ].filter(Boolean);
  doc.text(regionParts.join(' → ') || data.metadata.region, margin + 20, yPos);
  yPos += 8;

  // Date range
  doc.setFont('helvetica', 'bold');
  doc.text('Period:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const startDate = new Date(data.metadata.dateRange.start).toLocaleString('en-IN');
  const endDate = new Date(data.metadata.dateRange.end).toLocaleString('en-IN');
  doc.text(`${startDate} - ${endDate}`, margin + 20, yPos);
  yPos += 8;

  // Report ID
  doc.setFont('helvetica', 'bold');
  doc.text('Report ID:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.metadata.reportId, margin + 25, yPos);
  yPos += 8;

  // Prepared by
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared by:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const preparedBy = data.metadata.officerName 
    ? `${data.metadata.preparedBy} | Officer: ${data.metadata.officerName}`
    : data.metadata.preparedBy;
  doc.text(preparedBy, margin + 30, yPos);
  yPos += 8;

  // Version
  doc.setFont('helvetica', 'bold');
  doc.text('Version:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.metadata.version, margin + 20, yPos);
  yPos += 20;

  // ========================================================================
  // SECTION 2: EXECUTIVE SUMMARY
  // ========================================================================
  
  checkPageBreak(80);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.navyBlue);
  doc.text('Executive Summary', margin, yPos);
  yPos += 10;
  doc.setTextColor(0);

  // Summary table
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Water Sources', data.summary.totalSources.toString()],
      ['Functional Sources', data.summary.functionalSources.toString()],
      ['Samples Tested', data.summary.samplesTested.toString()],
      ['Safe/Unsafe Count', `${data.summary.safeCount}/${data.summary.unsafeCount}`],
      ['Outbreak Risk Level', data.summary.outbreakRiskLevel],
      ['Active Water Safety Incidents', data.summary.activeAlerts.toString()]
    ],
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navyBlue[0], COLORS.navyBlue[1], COLORS.navyBlue[2]], textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Status paragraph
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const statusText = `During the reporting period, ${data.summary.functionalSources} out of ${data.summary.totalSources} water sources were operational. ` +
    `${data.summary.samplesTested} samples were tested, with ${data.summary.safeCount} meeting BIS standards and ${data.summary.unsafeCount} requiring attention. ` +
    `The overall outbreak risk level is assessed as ${data.summary.outbreakRiskLevel}.`;
  yPos = addText(statusText, margin, yPos);
  yPos += 10;

  // Risk stamp (no emojis)
  const riskColors: Record<string, [number, number, number]> = {
    'Low': COLORS.green,
    'Medium': COLORS.amber,
    'High': COLORS.red,
    'Critical': COLORS.red
  };
  const riskLabels: Record<string, string> = {
    'Low': 'SAFE',
    'Medium': 'WATCH',
    'High': 'CRITICAL',
    'Critical': 'CRITICAL'
  };
  
  const riskColor = riskColors[data.summary.outbreakRiskLevel] || COLORS.grey;
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(margin, yPos, 60, 15, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255);
  doc.text(riskLabels[data.summary.outbreakRiskLevel] || 'UNKNOWN', margin + 30, yPos + 10, { align: 'center' });
  doc.setTextColor(0);
  yPos += 25;

  // ========================================================================
  // SECTION 3: COMPLIANCE OVERVIEW TABLE
  // ========================================================================
  
  checkPageBreak(60);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.navyBlue);
  doc.text('Compliance Overview', margin, yPos);
  yPos += 10;
  doc.setTextColor(0);

  const complianceRows = data.sources.slice(0, 20).map(source => {
    const sample = source.lastSample;
    let status = 'No Data';
    let concernedParams: string[] = [];

    if (sample) {
      const issues: string[] = [];
      
      if (sample.ph !== undefined && (sample.ph < BIS_STANDARDS.ph.min || sample.ph > BIS_STANDARDS.ph.max)) {
        issues.push('pH');
      }
      if (sample.tds !== undefined && sample.tds > BIS_STANDARDS.tds.permissible) {
        issues.push('TDS');
      }
      if (sample.turbidity !== undefined && sample.turbidity > BIS_STANDARDS.turbidity.permissible) {
        issues.push('Turbidity');
      }
      
      status = issues.length === 0 ? 'Safe' : 'Unsafe';
      concernedParams = issues;
    }

    return [
      source.name,
      source.location.substring(0, 30),
      source.id,
      sample ? new Date(sample.timestamp).toLocaleDateString('en-IN') : 'N/A',
      status,
      concernedParams.length > 0 ? concernedParams.join(', ') : '-'
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Source Name', 'Location', 'Source ID', 'Test Date', 'Status', 'Concerned Parameters']],
    body: complianceRows,
    theme: 'striped',
    headStyles: { fillColor: COLORS.navyBlue, textColor: 255, fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18 },
      5: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========================================================================
  // SECTION 4: PARAMETER LEVEL RESULTS
  // ========================================================================
  
  checkPageBreak(60);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.navyBlue);
  doc.text('Parameter Level Results', margin, yPos);
  yPos += 10;
  doc.setTextColor(0);

  // Show detailed results for top 5 sources
  const detailedSources = data.sources.filter(s => s.lastSample).slice(0, 5);
  
  for (const source of detailedSources) {
    checkPageBreak(50);
    
    // Source header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${source.name} - ${source.location}`, margin, yPos);
    yPos += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.darkGrey);
    doc.text(`Source ID: ${source.id} | Sample Time: ${source.lastSample ? new Date(source.lastSample.timestamp).toLocaleString('en-IN') : 'N/A'}`, margin, yPos);
    yPos += 8;
    doc.setTextColor(0);

    if (source.lastSample) {
      const sample = source.lastSample;
      const paramRows: any[] = [];

      // pH
      if (sample.ph !== undefined) {
        const compliant = sample.ph >= BIS_STANDARDS.ph.min && sample.ph <= BIS_STANDARDS.ph.max;
        paramRows.push([
          'pH',
          sample.ph.toFixed(2),
          BIS_STANDARDS.ph.unit,
          `${BIS_STANDARDS.ph.min}-${BIS_STANDARDS.ph.max}`,
          compliant ? '✓ Compliant' : '✗ Non-Compliant'
        ]);
      }

      // TDS
      if (sample.tds !== undefined) {
        const compliant = sample.tds <= BIS_STANDARDS.tds.permissible;
        paramRows.push([
          'TDS',
          sample.tds.toFixed(0),
          BIS_STANDARDS.tds.unit,
          `<${BIS_STANDARDS.tds.permissible}`,
          compliant ? '✓ Compliant' : '✗ Non-Compliant'
        ]);
      }

      // Turbidity
      if (sample.turbidity !== undefined) {
        const compliant = sample.turbidity <= BIS_STANDARDS.turbidity.permissible;
        paramRows.push([
          'Turbidity',
          sample.turbidity.toFixed(2),
          BIS_STANDARDS.turbidity.unit,
          `<${BIS_STANDARDS.turbidity.permissible}`,
          compliant ? '✓ Compliant' : '✗ Non-Compliant'
        ]);
      }

      // Temperature
      if (sample.temperature !== undefined) {
        const compliant = sample.temperature >= BIS_STANDARDS.temperature.min && sample.temperature <= BIS_STANDARDS.temperature.max;
        paramRows.push([
          'Temperature',
          sample.temperature.toFixed(1),
          BIS_STANDARDS.temperature.unit,
          `${BIS_STANDARDS.temperature.min}-${BIS_STANDARDS.temperature.max}`,
          compliant ? '✓ Compliant' : '⚠ Check'
        ]);
      }

      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Result', 'Unit', 'BIS 10500 Limit', 'Status']],
        body: paramRows,
        theme: 'grid',
        headStyles: { fillColor: COLORS.navyBlue, textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: margin, right: margin }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // BIS reference
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  setColor(COLORS.darkGrey);
  doc.text('Standards: BIS IS 10500:2012 - Drinking Water Specification', margin, yPos);
  yPos += 15;
  doc.setTextColor(0);

  // ========================================================================
  // SECTION 5: TREND & VISUAL ANALYSIS
  // ========================================================================
  
  if (data.trends && data.trends.labels.length > 0) {
    checkPageBreak(60);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.navyBlue);
    doc.text('Trend Analysis', margin, yPos);
    yPos += 10;
    doc.setTextColor(0);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('24-hour trend analysis of key water quality parameters', margin, yPos);
    yPos += 8;

    // Placeholder for charts (would need chart generation implementation)
    setFillColor(COLORS.grey);
    doc.rect(margin, yPos, contentWidth, 60, 'F');
    doc.setFontSize(10);
    setColor(COLORS.darkGrey);
    doc.text('[Trend Charts - pH, TDS, Turbidity, Temperature]', pageWidth / 2, yPos + 30, { align: 'center' });
    doc.text('Charts available in live dashboard', pageWidth / 2, yPos + 38, { align: 'center' });
    yPos += 70;
    doc.setTextColor(0);
  }

  // ========================================================================
  // SECTION 6: ALERTS & HEALTH RISK SIGNALS
  // ========================================================================
  
  checkPageBreak(60);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.navyBlue);
  doc.text('Alerts & Health Risk Signals', margin, yPos);
  yPos += 10;
  doc.setTextColor(0);

  if (data.alerts.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    setColor(COLORS.green);
    doc.text('No water safety alerts were detected during this reporting period.', margin, yPos);
    yPos += 15;
    doc.setTextColor(0);
  } else {
    // Alerts table
    const alertRows = data.alerts.slice(0, 15).map(alert => [
      alert.id.substring(0, 15),
      alert.type,
      alert.source.substring(0, 20),
      alert.condition.substring(0, 30),
      new Date(alert.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      alert.status
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Alert ID', 'Type', 'Source', 'Trigger Condition', 'Time', 'Status']],
      body: alertRows,
      theme: 'striped',
      headStyles: { fillColor: COLORS.red, textColor: 255, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 28 },
        5: { cellWidth: 22 }
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ML Prediction summary
  if (data.mlPrediction && data.mlPrediction.riskLevel !== 'UNKNOWN') {
    checkPageBreak(50);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Outbreak Prediction Summary', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Risk Score: ${data.mlPrediction.riskScore.toFixed(1)}/100`, margin, yPos);
    yPos += 6;
    doc.text(`Confidence: ${data.mlPrediction.confidence.toFixed(1)}%`, margin, yPos);
    yPos += 6;
    doc.text(`Risk Category: ${data.mlPrediction.riskLevel}`, margin, yPos);
    yPos += 10;

    if (Object.keys(data.mlPrediction.contributingFactors).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Top Contributing Factors:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');

      const sortedFactors = Object.entries(data.mlPrediction.contributingFactors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      sortedFactors.forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.text(`- ${label}: ${value.toFixed(1)}`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 5;
    }
  }

  // ========================================================================
  // SECTION 7: RECOMMENDATIONS & ACTIONS
  // ========================================================================
  
  checkPageBreak(60);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.navyBlue);
  doc.text('Recommendations & Actions', margin, yPos);
  yPos += 10;
  doc.setTextColor(0);

  // Preventive actions
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Preventive Actions:', margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const preventiveActions = data.mlPrediction?.recommendations || [
    'Continue regular monitoring of all water sources',
    'Maintain proper chlorination levels',
    'Ensure timely maintenance of water treatment facilities'
  ];

  preventiveActions.forEach(action => {
    checkPageBreak(10);
    yPos = addText(`• ${action}`, margin + 5, yPos, contentWidth - 5);
    yPos += 2;
  });
  yPos += 8;

  // Required follow-up
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Required Follow-up Activities:', margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const followUpActions = [
    'Investigate non-compliant sources within 24 hours',
    'Conduct additional testing for sources showing parameter exceedances',
    'Update community health workers on current water quality status'
  ];

  followUpActions.forEach(action => {
    checkPageBreak(10);
    yPos = addText(`• ${action}`, margin + 5, yPos, contentWidth - 5);
    yPos += 2;
  });
  yPos += 8;

  // Sampling intervals
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Suggested Sampling Intervals:', margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  yPos = addText('• High-risk sources: Daily monitoring', margin + 5, yPos);
  yPos = addText('• Medium-risk sources: Every 3 days', margin + 5, yPos);
  yPos = addText('• Low-risk sources: Weekly monitoring', margin + 5, yPos);
  yPos += 10;

  // ========================================================================
  // SECTION 8: FOOTER AND METADATA
  // ========================================================================
  
  // Generate QR code
  let qrCodeDataUrl: string | null = null;
  try {
    const dashboardUrl = `${window.location.origin}/dashboard?report=${data.metadata.reportId}`;
    qrCodeDataUrl = await QRCode.toDataURL(dashboardUrl, { width: 100, margin: 1 });
  } catch (error) {
    console.error('QR code generation failed:', error);
  }

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...COLORS.darkGrey);
    doc.setLineWidth(0.5);
    doc.line(margin, 280, pageWidth - margin, 280);
    
    // Footer text
    doc.setFontSize(8);
    setColor(COLORS.darkGrey);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by: ArogyaJal Automated Report System', margin, 285);
    doc.text(`Timestamp: ${new Date().toLocaleString('en-IN')} IST`, margin, 289);
    doc.text(`Version: ${data.metadata.version}`, pageWidth - margin, 285, { align: 'right' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 289, { align: 'right' });
    
    // QR code on last page
    if (i === pageCount && qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth / 2 - 10, 270, 20, 20);
    }
  }

  // Disclaimer on last page
  doc.setPage(pageCount);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  setColor(COLORS.darkGrey);
  const disclaimer = 'Disclaimer: This report is auto-generated and intended for official monitoring purposes. ' +
    'Data should be used for informational purposes and decision support. For critical health concerns, consult appropriate authorities.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(disclaimerLines, margin, 265);

  // Save PDF
  const regionName = (data.metadata.district || data.metadata.state || data.metadata.region).replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = `ArogyaJal_Report_${regionName}_${dateStr}_${timeStr.substring(0, 4)}.pdf`;
  
  doc.save(filename);
  console.log(`✅ Government report generated: ${filename}`);
};
