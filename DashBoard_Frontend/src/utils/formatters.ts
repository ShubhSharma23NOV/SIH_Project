/**
 * Data Formatting Utilities
 * Centralized formatting functions for consistent data display across the dashboard
 */

/**
 * Format sensor data for display in tables or exports
 */
export interface SensorDataFormatted {
  sensorId: string;
  location: string;
  timestamp: string;
  wqi: string;
  wqiStatus: string;
  battery: string;
  signal: string;
  uptime: string;
}

/**
 * Format sensor reading data for display
 */
export const formatSensorData = (data: {
  sensorId: string;
  location?: { lat: number; lon: number } | string;
  timestamp?: Date | string;
  wqi?: number;
  wqiStatus?: string;
  batteryLevel?: number;
  batteryVoltage?: number;
  signalStrength?: number;
  uptime?: number;
}): SensorDataFormatted => {
  // Format location
  let locationStr = 'Unknown';
  if (data.location) {
    if (typeof data.location === 'string') {
      locationStr = data.location;
    } else {
      locationStr = `${data.location.lat.toFixed(4)}, ${data.location.lon.toFixed(4)}`;
    }
  }

  // Format timestamp
  let timestampStr = 'N/A';
  if (data.timestamp) {
    const date = typeof data.timestamp === 'string' ? new Date(data.timestamp) : data.timestamp;
    timestampStr = date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Format WQI
  const wqiStr = data.wqi !== undefined && data.wqi !== null ? data.wqi.toFixed(1) : 'N/A';
  const wqiStatusStr = data.wqiStatus || 'Unknown';

  // Format battery
  let batteryStr = 'Not reported';
  if (data.batteryLevel !== undefined && data.batteryLevel !== null) {
    batteryStr = `${data.batteryLevel.toFixed(0)}%`;
    if (data.batteryVoltage) {
      batteryStr += ` (${data.batteryVoltage.toFixed(2)}V)`;
    }
  } else if (data.batteryVoltage !== undefined && data.batteryVoltage !== null) {
    // Estimate percentage from voltage (3.0V-4.2V range)
    const percentage = Math.max(0, Math.min(100, ((data.batteryVoltage - 3.0) / (4.2 - 3.0)) * 100));
    batteryStr = `${percentage.toFixed(0)}% (${data.batteryVoltage.toFixed(2)}V)`;
  }

  // Format signal
  let signalStr = 'Not reported';
  if (data.signalStrength !== undefined && data.signalStrength !== null) {
    signalStr = `${data.signalStrength} dBm`;
    if (data.signalStrength >= -60) signalStr += ' (Excellent)';
    else if (data.signalStrength >= -80) signalStr += ' (Good)';
    else if (data.signalStrength >= -100) signalStr += ' (Fair)';
    else signalStr += ' (Poor)';
  }

  // Format uptime
  let uptimeStr = 'N/A';
  if (data.uptime !== undefined && data.uptime !== null) {
    const hours = Math.floor(data.uptime / 3600);
    const minutes = Math.floor((data.uptime % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      uptimeStr = `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      uptimeStr = `${hours}h ${minutes}m`;
    } else {
      uptimeStr = `${minutes}m`;
    }
  }

  return {
    sensorId: data.sensorId,
    location: locationStr,
    timestamp: timestampStr,
    wqi: wqiStr,
    wqiStatus: wqiStatusStr,
    battery: batteryStr,
    signal: signalStr,
    uptime: uptimeStr
  };
};

/**
 * Format sensor data as a readable string (for exports or logs)
 */
export const formatSensorDataString = (data: {
  sensorId: string;
  location?: { lat: number; lon: number } | string;
  timestamp?: Date | string;
  wqi?: number;
  wqiStatus?: string;
  batteryLevel?: number;
  batteryVoltage?: number;
  signalStrength?: number;
  uptime?: number;
}): string => {
  const formatted = formatSensorData(data);
  
  return [
    `Sensor: ${formatted.sensorId}`,
    `Location: ${formatted.location}`,
    `Time: ${formatted.timestamp}`,
    `WQI: ${formatted.wqi} (${formatted.wqiStatus})`,
    `Battery: ${formatted.battery}`,
    `Signal: ${formatted.signal}`,
    `Uptime: ${formatted.uptime}`
  ].join(' | ');
};

/**
 * Format sensor data as CSV row
 */
export const formatSensorDataCSV = (data: {
  sensorId: string;
  location?: { lat: number; lon: number } | string;
  timestamp?: Date | string;
  wqi?: number;
  wqiStatus?: string;
  batteryLevel?: number;
  batteryVoltage?: number;
  signalStrength?: number;
  uptime?: number;
}): string => {
  const formatted = formatSensorData(data);
  
  return [
    formatted.sensorId,
    formatted.location,
    formatted.timestamp,
    formatted.wqi,
    formatted.wqiStatus,
    formatted.battery,
    formatted.signal,
    formatted.uptime
  ].map(val => `"${val}"`).join(',');
};

/**
 * Get CSV header for sensor data
 */
export const getSensorDataCSVHeader = (): string => {
  return [
    'Sensor ID',
    'Location',
    'Timestamp',
    'WQI',
    'WQI Status',
    'Battery',
    'Signal',
    'Uptime'
  ].map(val => `"${val}"`).join(',');
};

/**
 * Format location coordinates
 */
export const formatCoordinates = (lat: number, lon: number, precision: number = 4): string => {
  return `${lat.toFixed(precision)}°N, ${lon.toFixed(precision)}°E`;
};

/**
 * Format time ago (e.g., "5 minutes ago")
 */
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format number with commas
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('en-IN');
};

/**
 * Parse malformed sensor data string (like the one provided)
 * Example: "SIM-ASS-TEZ-00226.64,92.8059:35:35 AM12.5WQIExcellent🔋BatteryNot reported..."
 */
export const parseMalformedSensorData = (dataString: string): Partial<{
  sensorId: string;
  location: string;
  timestamp: string;
  wqi: number;
  wqiStatus: string;
  battery: string;
  signal: string;
  uptime: string;
}> => {
  const result: any = {};

  try {
    // Extract sensor ID (pattern: XXX-XXX-XXX-XXXXX)
    const sensorIdMatch = dataString.match(/([A-Z]+-[A-Z]+-[A-Z]+-\d+)/);
    if (sensorIdMatch) {
      result.sensorId = sensorIdMatch[1];
    }

    // Extract coordinates (pattern: number.number,number.number)
    const coordsMatch = dataString.match(/(\d+\.\d+),(\d+\.\d+)/);
    if (coordsMatch) {
      result.location = `${coordsMatch[1]}, ${coordsMatch[2]}`;
    }

    // Extract time (pattern: HH:MM:SS AM/PM)
    const timeMatch = dataString.match(/(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM))/i);
    if (timeMatch) {
      result.timestamp = timeMatch[1];
    }

    // Extract WQI value (pattern: number before "WQI")
    const wqiMatch = dataString.match(/(\d+\.?\d*)\s*WQI/i);
    if (wqiMatch) {
      result.wqi = parseFloat(wqiMatch[1]);
    }

    // Extract WQI status (pattern: word after "WQI")
    const wqiStatusMatch = dataString.match(/WQI\s*([A-Za-z]+)/i);
    if (wqiStatusMatch) {
      result.wqiStatus = wqiStatusMatch[1];
    }

    // Extract battery info (pattern: after 🔋Battery)
    const batteryMatch = dataString.match(/🔋\s*Battery\s*([^📶]+)/);
    if (batteryMatch) {
      result.battery = batteryMatch[1].trim();
    }

    // Extract signal info (pattern: after 📶Signal)
    const signalMatch = dataString.match(/📶\s*Signal\s*([^⏱️]+)/);
    if (signalMatch) {
      result.signal = signalMatch[1].trim();
    }

    // Extract uptime (pattern: after ⏱️Uptime)
    const uptimeMatch = dataString.match(/⏱️\s*Uptime\s*([^\s?]+)/);
    if (uptimeMatch) {
      result.uptime = uptimeMatch[1].trim();
    }
  } catch (error) {
    console.error('Error parsing malformed sensor data:', error);
  }

  return result;
};

/**
 * Format parsed sensor data into a readable display
 */
export const formatParsedSensorData = (parsed: ReturnType<typeof parseMalformedSensorData>): string => {
  const lines = [];
  
  if (parsed.sensorId) lines.push(`Sensor ID: ${parsed.sensorId}`);
  if (parsed.location) lines.push(`Location: ${parsed.location}`);
  if (parsed.timestamp) lines.push(`Timestamp: ${parsed.timestamp}`);
  if (parsed.wqi !== undefined) lines.push(`WQI: ${parsed.wqi} (${parsed.wqiStatus || 'Unknown'})`);
  if (parsed.battery) lines.push(`Battery: ${parsed.battery}`);
  if (parsed.signal) lines.push(`Signal: ${parsed.signal}`);
  if (parsed.uptime) lines.push(`Uptime: ${parsed.uptime}`);
  
  return lines.join('\n');
};
