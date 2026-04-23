/**
 * Chart Generator for PDF Reports
 * Creates canvas-based charts that can be embedded as images in PDFs
 */

interface ChartData {
  labels: string[];
  values: number[];
  label: string;
  color: string;
}

/**
 * Generate a line chart on canvas and return as base64 image
 */
export const generateLineChart = (
  data: ChartData,
  width: number = 800,
  height: number = 400
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Chart dimensions
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const chartX = padding;
  const chartY = padding;

  // Find min and max values
  const maxValue = Math.max(...data.values);
  const minValue = Math.min(...data.values);
  const valueRange = maxValue - minValue || 1;

  // Draw axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartHeight);
  ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
  ctx.stroke();

  // Draw grid lines
  ctx.strokeStyle = '#f3f4f6';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = chartY + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + chartWidth, y);
    ctx.stroke();
  }

  // Draw Y-axis labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const value = maxValue - (valueRange / 5) * i;
    const y = chartY + (chartHeight / 5) * i;
    ctx.fillText(value.toFixed(1), chartX - 10, y + 4);
  }

  // Draw line
  if (data.values.length > 0) {
    ctx.strokeStyle = data.color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.values.forEach((value, index) => {
      const x = chartX + (chartWidth / (data.values.length - 1)) * index;
      const y = chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = data.color;
    data.values.forEach((value, index) => {
      const x = chartX + (chartWidth / (data.values.length - 1)) * index;
      const y = chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw X-axis labels (sample every few labels to avoid crowding)
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  const labelStep = Math.ceil(data.labels.length / 8);
  data.labels.forEach((label, index) => {
    if (index % labelStep === 0 || index === data.labels.length - 1) {
      const x = chartX + (chartWidth / (data.labels.length - 1)) * index;
      ctx.fillText(label, x, chartY + chartHeight + 20);
    }
  });

  // Draw title
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(data.label, width / 2, 30);

  // Convert to base64
  return canvas.toDataURL('image/jpeg', 0.85);
};

/**
 * Generate a bar chart for contributing factors
 */
export const generateFactorBarChart = (
  factors: Record<string, number>,
  width: number = 800,
  height: number = 400
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Chart dimensions
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const chartX = padding;
  const chartY = padding;

  const entries = Object.entries(factors);
  const maxValue = Math.max(...entries.map(([, v]) => v), 100);
  const barWidth = chartWidth / entries.length - 20;

  // Draw axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartHeight);
  ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
  ctx.stroke();

  // Draw bars
  entries.forEach(([key, value], index) => {
    const x = chartX + (chartWidth / entries.length) * index + 10;
    const barHeight = (value / maxValue) * chartHeight;
    const y = chartY + chartHeight - barHeight;

    // Bar color based on value
    const color = value > 30 ? '#dc2626' : value > 15 ? '#f59e0b' : '#10b981';
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Value label on top of bar
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value.toFixed(1), x + barWidth / 2, y - 5);

    // Factor label below bar
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const words = label.split(' ');
    words.forEach((word, wordIndex) => {
      ctx.fillText(word, x + barWidth / 2, chartY + chartHeight + 20 + wordIndex * 15);
    });
  });

  // Draw title
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Contributing Factors', width / 2, 30);

  // Convert to base64
  return canvas.toDataURL('image/jpeg', 0.85);
};

/**
 * Generate a risk gauge chart
 */
export const generateRiskGauge = (
  riskScore: number | null,
  riskLevel: string,
  confidence: number | null,
  width: number = 400,
  height: number = 300
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const radius = Math.min(width, height) / 3;

  // Handle DATA_UNAVAILABLE or null values
  if (riskScore === null || confidence === null || riskLevel === 'DATA_UNAVAILABLE') {
    // Draw a simple message for unavailable data
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DATA UNAVAILABLE', centerX, centerY - 20);
    
    ctx.font = '16px Arial';
    ctx.fillText('Insufficient sensor data', centerX, centerY + 10);
    ctx.fillText('for risk assessment', centerX, centerY + 35);
    
    // Draw title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Outbreak Risk Score', centerX, 30);
    
    return canvas.toDataURL('image/png');
  }

  // Draw gauge background
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
  ctx.stroke();

  // Draw gauge fill based on risk score
  const angle = Math.PI + (riskScore / 100) * Math.PI;
  const color = riskScore >= 75 ? '#dc2626' : riskScore >= 50 ? '#f59e0b' : riskScore >= 25 ? '#fbbf24' : '#10b981';
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, angle);
  ctx.stroke();

  // Draw center circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 30, 0, 2 * Math.PI);
  ctx.fill();

  // Draw risk score
  ctx.fillStyle = color;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(riskScore.toFixed(1), centerX, centerY - 10);

  // Draw risk level
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(riskLevel, centerX, centerY + 25);

  // Draw confidence
  ctx.fillStyle = '#6b7280';
  ctx.font = '16px Arial';
  ctx.fillText(`Confidence: ${confidence.toFixed(0)}%`, centerX, centerY + 50);

  // Draw title
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Outbreak Risk Score', centerX, 30);

  // Convert to base64
  return canvas.toDataURL('image/jpeg', 0.85);
};
