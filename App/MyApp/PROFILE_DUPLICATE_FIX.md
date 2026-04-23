# ASHA Profile Duplicate Entry Fix

## Problem
Every time a user logs in, a new entry was being created in the `asha_workers` Firestore collection instead of reusing the existing profile.

## Root Cause
The `verifyASHARole()` function in `AuthService.js` was creating a new profile every time it didn't find one, without proper race condition handling.

## Solution Applied

### 1. Updated AuthService.js
- Added double-check logic to prevent race conditions
- Added proper error handling for profile creation
- Added `updateLastLogin()` function to track logins without creating duplicates
- Modified `updateProfile()` to check if document exists before updating

### 2. Key Changes

**Before:**
```javascript
// Would create profile every time
await firestore()
  .collection('asha_workers')
  .doc(uid)
  .set(defaultProfile);
```

**After:**
```javascript
// Double-checks and handles race conditions
const recheckDoc = await firestore()
  .collection('asha_workers')
  .doc(uid)
  .get();

if (recheckDoc.exists) {
  return { success: true, profile: recheckDoc.data() };
}

// Only creates if truly doesn't exist
await firestore()
  .collection('asha_workers')
  .doc(uid)
  .set(defaultProfile);
```

## How to Clean Up Existing Duplicates

### Option 1: Using Firebase Console (Manual)
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open `asha_workers` collection
4. Look for documents with the same `phoneNumber`
5. Keep the oldest one (check `createdAt` timestamp)
6. Delete the duplicates

### Option 2: Using Cleanup Script (Automated)

#### Prerequisites
1. Install Firebase Admin SDK:
```bash
cd MyApp
npm install firebase-admin --save-dev
```

2. Download Service Account Key:
   - Go to Firebase Console
   - Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `MyApp/scripts/serviceAccountKey.json`
   - **IMPORTANT:** Add this file to `.gitignore`!

#### Run Cleanup Script
```bash
cd MyApp
node scripts/cleanupDuplicateProfiles.js
```

The script will:
- List all profiles
- Find duplicates by phone number
- Auto-delete duplicates (keeps oldest profile)
- Allow manual deletion of specific profiles

### Option 3: Using Firestore Rules (Prevention)

Add this to your `firestore.rules` to prevent duplicates:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /asha_workers/{userId} {
      // Only allow creation if document doesn't exist
      allow create: if request.auth != null 
                    && request.auth.uid == userId
                    && !exists(/databases/$(database)/documents/asha_workers/$(userId));
      
      // Allow read/update for authenticated user
      allow read, update: if request.auth != null 
                          && request.auth.uid == userId;
      
      // Prevent deletion by users
      allow delete: if false;
    }
  }
}
```

## Verification

After cleanup, verify no duplicates exist:

### Check in Firebase Console
1. Go to Firestore Database
2. Open `asha_workers` collection
3. Count documents - should match number of unique users

### Check in App
1. Login with a test account
2. Go to Profile screen
3. Logout and login again
4. Check Firebase Console - should still be only 1 document

## Prevention Going Forward

The updated code now:
1. ✅ Checks if profile exists before creating
2. ✅ Handles race conditions with double-check
3. ✅ Updates `lastLogin` timestamp instead of recreating profile
4. ✅ Only creates profile once per user (by UID)
5. ✅ Logs all operations for debugging

## Profile Data Structure

Each user should have **exactly ONE** document in `asha_workers`:

```javascript
{
  uid: "firebase_auth_uid",           // Document ID = UID
  role: "ASHA",
  status: "active",
  name: "Worker Name",
  nameHindi: "कार्यकर्ता नाम",
  phoneNumber: "+919876543210",
  email: "worker@example.com",
  district: "District Name",
  block: "Block Name",
  village: "Village Name",
  certification: "Level 2 Certified",
  createdAt: Timestamp,               // When profile was created
  updatedAt: Timestamp,               // Last profile update
  lastLogin: Timestamp                // Last login time
}
```

## Monitoring

To monitor for duplicates in the future:

```javascript
// Run this query in Firebase Console
db.collection('asha_workers')
  .get()
  .then(snapshot => {
    const phones = {};
    snapshot.forEach(doc => {
      const phone = doc.data().phoneNumber;
      phones[phone] = (phones[phone] || 0) + 1;
    });
    
    const duplicates = Object.entries(phones)
      .filter(([phone, count]) => count > 1);
    
    console.log('Duplicates:', duplicates);
  });
```

## Support

If you continue to see duplicates:
1. Check the logs in `AuthService.js` for "Creating new ASHA profile"
2. Verify the UID matches between Firebase Auth and Firestore document ID
3. Check if multiple devices/sessions are logging in simultaneously
4. Review Firestore security rules

## Notes

- The fix is backward compatible
- Existing profiles will continue to work
- Only new logins will use the updated logic
- Development mode auto-creates profiles if they don't exist
- Production should require pre-created profiles
