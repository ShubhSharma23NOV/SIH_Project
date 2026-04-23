import React, { useEffect, useRef } from 'react';
import { Alert } from '../../types/alert.types';
import Chart from 'chart.js/auto';
import './Alerts.css';

interface AlertHistoryChartProps {
  alerts: Alert[];
}

const AlertHistoryChart: React.FC<AlertHistoryChartProps> = ({ alerts }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Process alert data for the last 7 days
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const severityCounts = {
      high: Array(7).fill(0),
      medium: Array(7).fill(0),
      low: Array(7).fill(0)
    };

    alerts.forEach(alert => {
      const alertDate = new Date(alert.timestamp).toISOString().split('T')[0];
      const dayIndex = days.indexOf(alertDate);
      
      if (dayIndex !== -1 && alert.severity in severityCounts) {
        severityCounts[alert.severity as keyof typeof severityCounts][dayIndex]++;
      }
    });

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart instance
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days.map(date => {
          const d = new Date(date);
          return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'High Priority',
            data: severityCounts.high,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Medium Priority',
            data: severityCounts.medium,
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Low Priority',
            data: severityCounts.low,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Alerts'
            },
            ticks: {
              stepSize: 1
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [alerts]);

  return <canvas ref={chartRef} className="chart-canvas" />;
};

export default AlertHistoryChart;
