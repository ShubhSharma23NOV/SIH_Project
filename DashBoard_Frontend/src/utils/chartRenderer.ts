/**
 * Chart Renderer for PDF Reports
 * Creates charts in hidden DOM container, waits for rendering, then captures as images
 */

import Chart from 'chart.js/auto';

interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut';
  data: any;
  options: any;
}

/**
 * Create hidden container for chart rendering
 */
const createHiddenContainer = (): HTMLDivElement => {
  const container = document.createElement('div');
  container.id = 'pdf-chart-container';
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.height = 'auto';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);
  return container;
};

/**
 * Remove hidden container
 */
const removeHiddenContainer = () => {
  const container = document.getElementById('pdf-chart-container');
  if (container) {
    container.remove();
  }
};

/**
 * Wait for chart rendering to complete
 */
const waitForChartRender = (delay: number = 1000): Promise<void> => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, delay);
    });
  });
};

/**
 * Render chart in hidden container and capture as base64 image
 */
export const renderAndCaptureChart = async (
  config: ChartConfig,
  width: number = 800,
  height: number = 400
): Promise<string | null> => {
  let container: HTMLDivElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let chart: Chart | null = null;

  try {
    // Get or create hidden container
    container = document.getElementById('pdf-chart-container') as HTMLDivElement;
    if (!container) {
      container = createHiddenContainer();
    }

    // Create canvas element
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    container.appendChild(canvas);

    // Create Chart.js chart
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    chart = new Chart(ctx, {
      type: config.type,
      data: config.data,
      options: {
        ...config.options,
        animation: false, // Disable animation for faster rendering
        responsive: false,
        maintainAspectRatio: false
      }
    });

    // Wait for chart to render
    await waitForChartRender(1000);

    // Capture chart as base64 image
    const imageData = chart.toBase64Image('image/jpeg', 0.85);

    // Cleanup
    chart.destroy();
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    return imageData;

  } catch (error) {
    console.error('Error rendering chart:', error);

    // Cleanup on error
    if (chart) {
      try {
        chart.destroy();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    return null;
  }
};

/**
 * Generate risk gauge chart configuration
 */
export const createRiskGaugeConfig = (
  riskScore: number,
  riskLevel: string,
  confidence: number
): ChartConfig => {
  const color = riskScore >= 75 ? '#dc2626' : riskScore >= 50 ? '#f59e0b' : riskScore >= 25 ? '#fbbf24' : '#10b981';

  return {
    type: 'doughnut',
    data: {
      labels: ['Risk Score', 'Remaining'],
      datasets: [{
        data: [riskScore, 100 - riskScore],
        backgroundColor: [color, '#e5e7eb'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: `Outbreak Risk: ${riskLevel} (${riskScore.toFixed(1)})`,
          font: {
            size: 18,
            weight: 'bold'
          }
        },
        subtitle: {
          display: true,
          text: `Confidence: ${confidence.toFixed(0)}%`,
          font: {
            size: 14
          }
        }
      }
    }
  };
};

/**
 * Generate factor bar chart configuration
 */
export const createFactorBarConfig = (factors: Record<string, number>): ChartConfig => {
  const entries = Object.entries(factors);
  const labels = entries.map(([key]) => 
    key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  );
  const values = entries.map(([, value]) => value);
  const colors = values.map(v => v > 30 ? '#dc2626' : v > 15 ? '#f59e0b' : '#10b981');

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Factor Value',
        data: values,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      indexAxis: 'x',
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Contribution (%)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Contributing Factors',
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      }
    }
  };
};

/**
 * Generate line chart configuration
 */
export const createLineChartConfig = (
  labels: string[],
  values: number[],
  label: string,
  color: string
): ChartConfig => {
  return {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: color,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: label
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time'
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: label,
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  };
};

/**
 * Cleanup all chart resources
 */
export const cleanupChartResources = () => {
  removeHiddenContainer();
};
