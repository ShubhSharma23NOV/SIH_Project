# Service Request Acknowledgment System

## Overview
This system ensures ASHA workers acknowledge service requests within 24 hours. If not acknowledged, an alert is automatically sent to your backend server.

## Features
- ✅ Acknowledge button on each new request
- ⏱️ 24-hour countdown timer
- 🚨 Automatic alert to backend if not acknowledged
- 📊 Visual indicators (normal, urgent, overdue)
- 🔔 System alerts collection for tracking

## How It Works

### 1. Request Creation
When a resident submits a request, the following fields are added:
```javascript
{
  acknowledged: false,
  acknowledgedAt: null,
  acknowledgedBy: null,
  alertSent: false,
  alertSentAt: null,
  createdAt: timestamp
}
```

### 2. ASHA Dashboard
- Requests show an "Acknowledge" button if not acknowledged
- Timer shows time remaining (green → yellow → red)
- After 24 hours, timer shows "Overdue" in red

### 3. Acknowledgment
When ASHA clicks "Acknowledge":
```javascript
{
  acknowledged: true,
  acknowledgedAt: timestamp,
  acknowledgedBy: ashaUserId
}
```

### 4. Monitoring Service
The `RequestMonitorService` runs in the background:
- Checks every 30 minutes for unacknowledged requests
- Finds requests older than 24 hours
- Sends alert to your backend
- Marks request as `alertSent: true`

## Backend Integration

### Step 1: Configure Backend URL

In your app initialization (e.g., `App.js` or when ASHA logs in):

```javascript
import RequestMonitorService from './src/services/RequestMonitorService';

// Initialize with your backend URL
await RequestMonitorService.initialize('https://your-backend.com');

// Start monitoring when ASHA logs in
RequestMonitorService.startMonitoring();

// Stop monitoring when ASHA logs out
RequestMonitorService.stopMonitoring();
```

### Step 2: Create Backend Endpoint

Your backend should have an endpoint to receive alerts:

**Endpoint:** `POST /api/alerts/unacknowledged-request`

**Request Body:**
```json
{
  "requestId": "abc123",
  "type": "asha_visit",
  "priority": "high",
  "residentName": "John Doe",
  "residentPhone": "+917477081440",
  "village": "Shillong",
  "assignedAshaId": "xyz789",
  "assignedAshaName": "ASHA Worker",
  "createdAt": "2024-12-09T10:30:00.000Z",
  "description": "Need water testing",
  "alertType": "UNACKNOWLEDGED_REQUEST",
  "alertMessage": "Service request abc123 has not been acknowledged within 24 hours",
  "timestamp": "2024-12-10T10:30:00.000Z"
}
```

**Response:** `200 OK`

### Step 3: Backend Actions

When your backend receives an alert, you can:
1. Send SMS/email to ASHA supervisor
2. Send push notification to ASHA worker
3. Log to monitoring dashboard
4. Escalate to PHC if needed
5. Create incident report

### Example Backend Implementation (Node.js/Express)

```javascript
app.post('/api/alerts/unacknowledged-request', async (req, res) => {
  try {
    const alert = req.body;
    
    console.log('🚨 Unacknowledged request alert:', alert.requestId);
    
    // 1. Log to database
    await db.collection('alerts').insert(alert);
    
    // 2. Send SMS to supervisor
    await sendSMS({
      to: SUPERVISOR_PHONE,
      message: `URGENT: Request ${alert.requestId} not acknowledged by ${alert.assignedAshaName}. Priority: ${alert.priority}`
    });
    
    // 3. Send email notification
    await sendEmail({
      to: SUPERVISOR_EMAIL,
      subject: 'Unacknowledged Service Request Alert',
      body: `
        Request ID: ${alert.requestId}
        Type: ${alert.type}
        Priority: ${alert.priority}
        Resident: ${alert.residentName} (${alert.residentPhone})
        Village: ${alert.village}
        ASHA: ${alert.assignedAshaName}
        Created: ${alert.createdAt}
        
        This request has not been acknowledged within 24 hours.
      `
    });
    
    // 4. Send push notification to ASHA
    await sendPushNotification({
      userId: alert.assignedAshaId,
      title: 'Urgent: Acknowledge Request',
      body: `Please acknowledge request from ${alert.residentName}`
    });
    
    res.status(200).json({ success: true, message: 'Alert received' });
  } catch (error) {
    console.error('Error processing alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Firestore Collections

### service_requests
```javascript
{
  id: "request_id",
  type: "asha_visit",
  priority: "high",
  status: "assigned",
  acknowledged: false,
  acknowledgedAt: null,
  acknowledgedBy: null,
  alertSent: false,
  alertSentAt: null,
  createdAt: timestamp,
  // ... other fields
}
```

### system_alerts (auto-created)
```javascript
{
  requestId: "request_id",
  alertType: "UNACKNOWLEDGED_REQUEST",
  alertMessage: "...",
  sentAt: timestamp,
  status: "sent",
  // ... alert data
}
```

## Testing

### Manual Test
```javascript
// In your app, trigger manual check
import RequestMonitorService from './src/services/RequestMonitorService';

// This will immediately check for unacknowledged requests
await RequestMonitorService.manualCheck();
```

### Create Test Request
1. Submit a request as a resident
2. Don't acknowledge it as ASHA
3. Manually update Firestore to set `createdAt` to 25 hours ago
4. Run manual check
5. Verify alert is sent to backend

## Configuration Options

### Change Check Interval
In `RequestMonitorService.js`, modify:
```javascript
// Check every 30 minutes (default)
this.checkInterval = setInterval(() => {
  this.checkUnacknowledgedRequests();
}, 30 * 60 * 1000);

// Change to 15 minutes
this.checkInterval = setInterval(() => {
  this.checkUnacknowledgedRequests();
}, 15 * 60 * 1000);
```

### Change Deadline
Modify the 24-hour threshold:
```javascript
// 24 hours (default)
const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

// Change to 12 hours
const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
```

## Firestore Security Rules

Add these rules to allow the monitoring service:

```javascript
match /service_requests/{requestId} {
  allow read: if request.auth != null;
  allow update: if request.auth != null && 
    (request.resource.data.acknowledged == true || 
     request.resource.data.alertSent == true);
}

match /system_alerts/{alertId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null;
}
```

## Monitoring Dashboard

You can query unacknowledged requests:
```javascript
const unacknowledged = await RequestMonitorService.getUnacknowledgedRequests(ashaId);
console.log('Unacknowledged requests:', unacknowledged.length);
```

## Troubleshooting

### Alerts not sending
1. Check backend URL is configured
2. Verify backend endpoint is accessible
3. Check Firestore permissions
4. Review console logs for errors

### Timer not showing
1. Ensure `createdAt` field exists
2. Check request has `acknowledged: false`
3. Verify timer calculation logic

### Multiple alerts sent
- System prevents duplicate alerts with `alertSent` flag
- Each request only triggers one alert

## Next Steps

1. Configure your backend URL in the app
2. Implement the backend endpoint
3. Test with a sample request
4. Monitor the `system_alerts` collection
5. Set up notifications (SMS/email/push)
