/**
 * Reusable Metric Card Component
 * Displays key metrics with consistent styling
 */

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-green-50 border-green-200 text-green-900',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  red: 'bg-red-50 border-red-200 text-red-900',
  gray: 'bg-gray-50 border-gray-200 text-gray-900',
};

const trendIcons = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'gray',
  trend,
  trendValue,
  loading = false,
  onClick,
}) => {
  const cardClasses = `
    p-4 rounded-lg border-2 transition-all duration-200
    ${colorClasses[color]}
    ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
  `;

  if (loading) {
    return (
      <div className={cardClasses}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-60 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-2 text-xs">
              <span className="mr-1">{trendIcons[trend]}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-3 opacity-75">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
