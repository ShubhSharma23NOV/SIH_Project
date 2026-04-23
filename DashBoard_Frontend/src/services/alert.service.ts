import { Alert, AlertSeverity, AlertStatus } from '../types/alert.types';
import { collection, query, where, orderBy, onSnapshot, getFirestore } from 'firebase/firestore';
import { firebaseApp } from '../config/firebase.config';
import { COLLECTIONS } from '../config/firebase.config';
import { API_BASE_URL } from '../config/api.config';

const db = getFirestore(firebaseApp);

interface AlertDocument extends Omit<Alert, 'id' | 'timestamp'> {
  timestamp: any; // Firestore timestamp
}

class AlertService {
  // Subscribe to real-time alerts
  static subscribeToAlerts(
    onAlertsUpdate: (alerts: Alert[]) => void,
    filters: { status?: string; severity?: string } = {}
  ): () => void {
    let q = query(
      collection(db, COLLECTIONS.ALERTS),
      orderBy('timestamp', 'desc')
    ) as any;

    // Apply filters if provided
    if (filters.status && filters.status !== 'all') {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.severity && filters.severity !== 'all') {
      q = query(q, where('severity', '==', filters.severity));
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: any) => {
        const alerts = querySnapshot.docs.map((doc: any) => {
          const data = doc.data() as AlertDocument;
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            severity: data.severity as AlertSeverity,
            status: data.status as AlertStatus,
            deviceId: data.deviceId,
            timestamp: data.timestamp?.toDate().toISOString()
          } as Alert;
        });
        onAlertsUpdate(alerts);
      },
      (error: Error) => {
        console.error('Error listening to alerts:', error);
      }
    );

    return unsubscribe;
  }

  // For backward compatibility
  static async getAlerts(): Promise<Alert[]> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribeToAlerts(
        (alerts) => {
          unsubscribe(); // Unsubscribe after first fetch
          resolve(alerts);
        },
        { status: 'all', severity: 'all' }
      );
    });
  }

  static async acknowledgeAlert(id: number): Promise<void> {
    await this.updateAlertStatus(id, 'acknowledged');
  }

  static async resolveAlert(id: number): Promise<void> {
    await this.updateAlertStatus(id, 'resolved');
  }

  private static async updateAlertStatus(id: number, status: AlertStatus): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status} alert`);
      }
    } catch (error) {
      console.error(`Error updating alert status to ${status}:`, error);
      throw error;
    }
  }

  // Mock data for development
  static getMockAlerts(): Alert[] {
    const villages = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];
    const severities: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];
    const statuses: AlertStatus[] = ['open', 'acknowledged', 'resolved'];
    const alertTypes = [
      'Water Quality',
      'Water Level',
      'Infrastructure',
      'Sensor Status',
      'Water Pressure'
    ];
    
    return Array.from({ length: 20 }, (_, i) => {
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const village = villages[Math.floor(Math.random() * villages.length)];
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 72)); // Random time in last 3 days
      
      // Generate a more specific alert based on type
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const alertDetails = this.generateAlertDetails(alertType, severity, village);
      
      return {
        id: i + 1,
        title: `${alertType} Alert - ${village}`,
        description: alertDetails.description,
        severity,
        status,
        timestamp: timestamp.toISOString(),
        village,
        deviceId: `DEV-${1000 + i}`,
        lastUpdated: new Date(timestamp.getTime() + Math.floor(Math.random() * 3600000)).toISOString(),
        assignedTo: status !== 'open' ? `User${Math.floor(Math.random() * 5) + 1}` : undefined,
        notes: status !== 'open' ? `Action taken: ${['Acknowledged by team', 'Under investigation', 'Scheduled for maintenance', 'Resolved by technician'][Math.floor(Math.random() * 4)]}` : undefined
      };
    });
  }

  private static generateAlertDetails(type: string, severity: string, location: string) {
    const details: Record<string, any> = {
      'Water Quality': {
        description: `Water quality alert in ${location}: ${severity} priority issue detected.`
      },
      'Water Level': {
        description: `Water level alert in ${location}: ${severity} priority - ${Math.floor(Math.random() * 50) + 20}% capacity.`
      },
      'Infrastructure': {
        description: `Infrastructure alert in ${location}: ${severity} priority issue reported.`
      },
      'Sensor Status': {
        description: `Sensor alert in ${location}: ${severity} priority - ${['battery low', 'offline', 'malfunctioning', 'calibration needed'][Math.floor(Math.random() * 4)]}.`
      },
      'Water Pressure': {
        description: `Pressure alert in ${location}: ${severity} priority - ${['low', 'high', 'fluctuating'][Math.floor(Math.random() * 3)]} pressure detected.`
      }
    };

    return details[type] || { description: `Alert in ${location}: ${severity} priority issue.` };
  }
}

export default AlertService;
