## Local Residents Module - Implementation Plan

### ✅ Files Created

1. **Authentication**
   - `src/context/ResidentAuthContext.js` - Auth state management
   - `src/screens/ResidentLoginScreen.js` - OTP login

### 📋 Files to Create

2. **Dashboard & Home**
   - `src/screens/ResidentDashboardScreen.js` - Main dashboard
   - `src/components/resident/StatsCard.js` - Stats display
   - `src/components/resident/QuickActionButton.js` - Action buttons

3. **Alerts & Notifications**
   - `src/screens/ResidentAlertsScreen.js` - Alerts feed
   - `src/components/resident/AlertCard.js` - Alert item
   - `src/services/ResidentAlertService.js` - Alert management

4. **Household Profile**
   - `src/screens/ResidentHouseholdScreen.js` - Household details
   - `src/components/resident/MemberCard.js` - Family member
   - `src/components/resident/VisitTimeline.js` - Visit history

5. **Service Requests**
   - `src/screens/ResidentRequestScreen.js` - Request form
   - `src/screens/ResidentRequestHistoryScreen.js` - Request tracking
   - `src/services/ResidentRequestService.js` - Request management

6. **Communication**
   - `src/screens/ResidentContactScreen.js` - ASHA contact
   - `src/components/resident/ContactCard.js` - Contact display

7. **Database & Sync**
   - `src/database/ResidentDatabaseService.js` - Local storage
   - `src/services/ResidentSyncService.js` - Sync logic

8. **Navigation**
   - Update `src/navigation/AppNavigator.js` - Add resident routes

### 🔐 Firestore Collections Structure

```javascript
// residents/{uid}
{
  uid: string,
  role: "RESIDENT",
  name: string,
  nameHindi: string,
  phoneNumber: string,
  householdId: string,
  village: string,
  block: string,
  district: string,
  profilePhoto: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLogin: timestamp
}

// households/{householdId}
{
  householdId: string,
  headOfHousehold: string,
  members: array,
  address: string,
  village: string,
  block: string,
  district: string,
  ashaWorkerId: string,
  riskLevel: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// resident_alerts/{alertId}
{
  alertId: string,
  type: "water" | "vaccination" | "outbreak" | "followup",
  title: string,
  titleHindi: string,
  message: string,
  messageHindi: string,
  severity: "low" | "medium" | "high",
  district: string,
  block: string,
  village: string,
  targetHouseholds: array,
  createdAt: timestamp,
  expiresAt: timestamp,
  isRead: boolean
}

// service_requests/{requestId}
{
  requestId: string,
  residentUid: string,
  householdId: string,
  type: "asha_visit" | "water_test" | "complaint" | "referral",
  description: string,
  priority: "low" | "medium" | "high",
  status: "pending" | "assigned" | "completed" | "cancelled",
  ashaWorkerId: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: timestamp,
  notes: string
}
```

### 🔒 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Residents can only read their own profile
    match /residents/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if false; // Only admin can write
    }
    
    // Residents can only read their household
    match /households/{householdId} {
      allow read: if request.auth.uid != null 
                  && get(/databases/$(database)/documents/residents/$(request.auth.uid)).data.householdId == householdId;
      allow write: if false;
    }
    
    // Residents can read alerts for their area
    match /resident_alerts/{alertId} {
      allow read: if request.auth.uid != null;
      allow update: if request.auth.uid != null 
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
    }
    
    // Residents can create and read their own requests
    match /service_requests/{requestId} {
      allow create: if request.auth.uid != null 
                    && request.resource.data.residentUid == request.auth.uid;
      allow read: if request.auth.uid != null 
                  && resource.data.residentUid == request.auth.uid;
      allow update: if false; // Only ASHA/admin can update
    }
  }
}
```

### 📱 Screen Flow

```
Launch Screen
    ↓
Resident Login (OTP)
    ↓
Resident Dashboard (Home)
    ├── Alerts Tab
    ├── Household Tab
    ├── Requests Tab
    └── Profile Tab
```

### 🎨 UI Components Needed

1. **StatsCard** - Display counts with icons
2. **AlertCard** - Alert item with severity indicator
3. **MemberCard** - Household member display
4. **VisitTimeline** - Timeline of ASHA visits
5. **RequestCard** - Service request status
6. **QuickActionButton** - Large action buttons
7. **ContactCard** - ASHA worker contact
8. **SyncIndicator** - Online/offline status

### 🌐 Multilingual Support

Create translation files:
- `src/i18n/resident_en.json`
- `src/i18n/resident_hi.json`

### 📶 Offline Strategy

1. **On Login:**
   - Fetch resident profile → Cache in SQLite
   - Fetch household data → Cache in SQLite
   - Fetch recent alerts → Cache in SQLite

2. **Offline Actions:**
   - Draft service requests → Store locally
   - Mark alerts as read → Queue for sync
   - View cached data

3. **On Reconnect:**
   - Sync pending requests
   - Sync read status
   - Fetch new alerts
   - Update cached data

### 🔄 Implementation Priority

**Phase 1: Core (Week 1)**
- ✅ Authentication context
- ✅ Login screen
- Dashboard screen
- Basic navigation

**Phase 2: Data Display (Week 2)**
- Household profile screen
- Alerts screen
- Stats integration

**Phase 3: Actions (Week 3)**
- Service request screen
- Request history
- Contact screen

**Phase 4: Offline & Sync (Week 4)**
- Local database
- Sync service
- Offline indicators

**Phase 5: Polish (Week 5)**
- Multilingual toggle
- UI refinements
- Testing

### 🎯 Next Steps

1. Create Resident Dashboard Screen
2. Create Alerts Screen
3. Create Household Screen
4. Create Request Screen
5. Implement offline database
6. Add to navigation
7. Test end-to-end flow
