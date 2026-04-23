export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'active';

export interface Alert {
  id: number;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  village: string;
  deviceId: string;
  type?: string;
  value?: number;
  threshold?: number;
  lastUpdated?: string;
  assignedTo?: string;
  notes?: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface AlertFilters {
  severity: 'all' | AlertSeverity;
  village: string;
  status: 'all' | AlertStatus;
  searchQuery: string;
  dateRange: DateRange;
}

export interface AlertStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  active: number;
  acknowledged: number;
  resolved: number;
}
