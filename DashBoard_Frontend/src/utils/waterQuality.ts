/**
 * Water Quality Index (WQI) Utility
 * Centralized WQI calculation and labeling for consistent UI across the dashboard
 */

export type WQILabel = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
export type WQISeverity = 'GOOD' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export interface WQIClassification {
  label: WQILabel | 'Unknown';
  severity: WQISeverity;
  color: string;
  description: string;
}

/**
 * Standard WQI ranges based on water quality standards
 * 0-25: Excellent
 * 26-50: Good
 * 51-75: Fair
 * 76-90: Poor
 * >90: Very Poor
 */
export const getWaterQualityClassification = (wqi: number | null | undefined): WQIClassification => {
  if (wqi === null || wqi === undefined || isNaN(wqi)) {
    return {
      label: 'Unknown',
      severity: 'UNKNOWN',
      color: '#6b7280',
      description: 'No data available'
    };
  }

  if (wqi <= 25) {
    return {
      label: 'Excellent',
      severity: 'GOOD',
      color: '#10b981',
      description: 'Water quality is excellent'
    };
  } else if (wqi <= 50) {
    return {
      label: 'Good',
      severity: 'GOOD',
      color: '#22c55e',
      description: 'Water quality is good'
    };
  } else if (wqi <= 75) {
    return {
      label: 'Fair',
      severity: 'MODERATE',
      color: '#f59e0b',
      description: 'Water quality needs monitoring'
    };
  } else if (wqi <= 90) {
    return {
      label: 'Poor',
      severity: 'HIGH',
      color: '#f97316',
      description: 'Water quality is poor'
    };
  } else {
    return {
      label: 'Very Poor',
      severity: 'CRITICAL',
      color: '#ef4444',
      description: 'Water quality is very poor'
    };
  }
};

/**
 * Get WQI label only
 */
export const getWQILabel = (wqi: number | null | undefined): string => {
  return getWaterQualityClassification(wqi).label;
};

/**
 * Get WQI severity only
 */
export const getWQISeverity = (wqi: number | null | undefined): WQISeverity => {
  return getWaterQualityClassification(wqi).severity;
};

/**
 * Get WQI color only
 */
export const getWQIColor = (wqi: number | null | undefined): string => {
  return getWaterQualityClassification(wqi).color;
};

/**
 * Format WQI value for display
 */
export const formatWQI = (wqi: number | null | undefined): string => {
  if (wqi === null || wqi === undefined || isNaN(wqi)) {
    return 'N/A';
  }
  return wqi.toFixed(1);
};

/**
 * WQI Legend data for consistent display across all pages
 */
export const WQI_LEGEND = [
  { range: '0-25', label: 'Excellent', color: '#10b981', severity: 'GOOD' },
  { range: '26-50', label: 'Good', color: '#22c55e', severity: 'GOOD' },
  { range: '51-75', label: 'Fair', color: '#f59e0b', severity: 'MODERATE' },
  { range: '76-90', label: 'Poor', color: '#f97316', severity: 'HIGH' },
  { range: '>90', label: 'Very Poor', color: '#ef4444', severity: 'CRITICAL' }
];

/**
 * Battery percentage calculation and classification
 */
export interface BatteryStatus {
  percentage: number | null;
  label: string;
  color: string;
  warning: string | null;
}

export const getBatteryStatus = (
  batteryPercentage?: number | null,
  batteryVoltage?: number | null
): BatteryStatus => {
  let percentage: number | null = null;

  // If percentage is directly available
  if (batteryPercentage !== null && batteryPercentage !== undefined && !isNaN(batteryPercentage)) {
    percentage = batteryPercentage;
  }
  // If voltage is available, estimate percentage (assuming 3.0V-4.2V range for Li-ion)
  else if (batteryVoltage !== null && batteryVoltage !== undefined && !isNaN(batteryVoltage)) {
    const minVoltage = 3.0;
    const maxVoltage = 4.2;
    percentage = Math.max(0, Math.min(100, ((batteryVoltage - minVoltage) / (maxVoltage - minVoltage)) * 100));
  }

  if (percentage === null) {
    return {
      percentage: null,
      label: 'Not reported',
      color: '#6b7280',
      warning: null
    };
  }

  if (percentage >= 70) {
    return {
      percentage,
      label: 'Good',
      color: '#10b981',
      warning: null
    };
  } else if (percentage >= 30) {
    return {
      percentage,
      label: 'Moderate',
      color: '#f59e0b',
      warning: 'Battery level is moderate'
    };
  } else {
    return {
      percentage,
      label: 'Low',
      color: '#ef4444',
      warning: 'Low battery – replacement recommended'
    };
  }
};

/**
 * Signal strength classification
 */
export interface SignalStatus {
  strength: number | null;
  label: string;
  color: string;
}

export const getSignalStatus = (signalStrength?: number | null): SignalStatus => {
  if (signalStrength === null || signalStrength === undefined || isNaN(signalStrength)) {
    return {
      strength: null,
      label: 'Not reported',
      color: '#6b7280'
    };
  }

  // Signal strength in dBm (typical range: -120 to -30)
  if (signalStrength >= -60) {
    return {
      strength: signalStrength,
      label: 'Excellent',
      color: '#10b981'
    };
  } else if (signalStrength >= -80) {
    return {
      strength: signalStrength,
      label: 'Good',
      color: '#22c55e'
    };
  } else if (signalStrength >= -100) {
    return {
      strength: signalStrength,
      label: 'Fair',
      color: '#f59e0b'
    };
  } else {
    return {
      strength: signalStrength,
      label: 'Poor',
      color: '#ef4444'
    };
  }
};

/**
 * Format uptime for display
 */
export const formatUptime = (uptimeSeconds?: number | null, lastSeen?: Date | string | null): string => {
  if (uptimeSeconds !== null && uptimeSeconds !== undefined && !isNaN(uptimeSeconds)) {
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Try to calculate from lastSeen timestamp
  if (lastSeen) {
    try {
      const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      
      if (diffSeconds > 0 && diffSeconds < 86400 * 7) { // Less than 7 days
        return formatUptime(diffSeconds);
      }
    } catch (e) {
      // Invalid date
    }
  }

  return 'Not available';
};

/**
 * Format location string, removing leading commas and extra whitespace
 */
export const formatLocation = (location?: string | null): string => {
  if (!location) return 'Unknown Location';
  
  return location
    .trim()
    .replace(/^,\s*/, '') // Remove leading comma
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Get friendly device name from device ID
 * Example: NER-ASS-BAR-001 → "Handpump – Barpeta, Assam"
 */
export const getDeviceFriendlyName = (deviceId: string, location?: string): string => {
  if (!deviceId) return 'Unknown Device';
  
  // Parse device ID pattern: NER-STATE-DISTRICT-NUMBER
  const parts = deviceId.split('-');
  
  if (parts.length >= 4) {
    const stateCode = parts[1];
    const districtCode = parts[2];
    
    // Map state codes
    const stateMap: Record<string, string> = {
      'ASS': 'Assam',
      'MEG': 'Meghalaya',
      'ARU': 'Arunachal Pradesh',
      'NAG': 'Nagaland',
      'MAN': 'Manipur',
      'MIZ': 'Mizoram',
      'TRI': 'Tripura',
      'SIK': 'Sikkim'
    };
    
    // Map district codes (partial list)
    const districtMap: Record<string, string> = {
      'BAR': 'Barpeta',
      'GUW': 'Guwahati',
      'DIB': 'Dibrugarh',
      'NAG': 'Nagaon',
      'SIL': 'Silchar',
      'TIN': 'Tinsukia',
      'TEZ': 'Tezpur',
      'JOR': 'Jorhat',
      'SHI': 'Shillong'
    };
    
    const state = stateMap[stateCode] || stateCode;
    const district = districtMap[districtCode] || districtCode;
    
    return `Handpump – ${district}, ${state}`;
  }
  
  // Fallback to location if available
  if (location) {
    return `Handpump – ${formatLocation(location)}`;
  }
  
  return `Device ${deviceId}`;
};

/**
 * Check if device is a test device
 */
export const isTestDevice = (deviceId: string): boolean => {
  if (!deviceId) return false;
  const upperDeviceId = deviceId.toUpperCase();
  return upperDeviceId.includes('TEST') || 
         upperDeviceId.includes('VERIFY') || 
         upperDeviceId.includes('DEMO');
};
