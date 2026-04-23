/**
 * Cleanup Duplicate ASHA Worker Profiles
 * 
 * This script helps identify and remove duplicate profiles in Firestore
 * Run this script to clean up any duplicate entries created during development
 * 
 * Usage:
 * node scripts/cleanupDuplicateProfiles.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin (you'll need to add your service account key)
// Download from: Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function findDuplicatesByPhone() {
  console.log('\n🔍 Searching for duplicate profiles by phone number...\n');
  
  const snapshot = await db.collection('asha_workers').get();
  const phoneMap = new Map();
  const duplicates = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const phone = data.phoneNumber;
    
    if (!phone) {
      console.log(`⚠️  Document ${doc.id} has no phone number`);
      return;
    }
    
    if (phoneMap.has(phone)) {
      duplicates.push({
        phone,
        docs: [...phoneMap.get(phone), { id: doc.id, data }]
      });
      phoneMap.get(phone).push({ id: doc.id, data });
    } else {
      phoneMap.set(phone, [{ id: doc.id, data }]);
    }
  });
  
  return duplicates;
}

async function listAllProfiles() {
  console.log('\n📋 All ASHA Worker Profiles:\n');
  
  const snapshot = await db.collection('asha_workers').get();
  
  if (snapshot.empty) {
    console.log('No profiles found.');
    return [];
  }
  
  const profiles = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    profiles.push({ id: doc.id, ...data });
    
    console.log(`ID: ${doc.id}`);
    console.log(`  Name: ${data.name || 'N/A'}`);
    console.log(`  Phone: ${data.phoneNumber || 'N/A'}`);
    console.log(`  Status: ${data.status || 'N/A'}`);
    console.log(`  Created: ${data.createdAt?.toDate?.() || 'N/A'}`);
    console.log(`  Last Login: ${data.lastLogin?.toDate?.() || 'N/A'}`);
    console.log('---');
  });
  
  return profiles;
}

async function deleteDuplicates(duplicates) {
  console.log('\n🗑️  Deleting duplicate profiles...\n');
  
  for (const dup of duplicates) {
    console.log(`\nPhone: ${dup.phone}`);
    console.log(`Found ${dup.docs.length} profiles:`);
    
    // Sort by creation date (keep oldest)
    dup.docs.sort((a, b) => {
      const aTime = a.data.createdAt?.toMillis?.() || 0;
      const bTime = b.data.createdAt?.toMillis?.() || 0;
      return aTime - bTime;
    });
    
    // Keep the first one (oldest)
    const toKeep = dup.docs[0];
    const toDelete = dup.docs.slice(1);
    
    console.log(`  ✅ Keeping: ${toKeep.id} (${toKeep.data.name})`);
    
    for (const doc of toDelete) {
      console.log(`  ❌ Deleting: ${doc.id} (${doc.data.name})`);
      await db.collection('asha_workers').doc(doc.id).delete();
    }
  }
  
  console.log('\n✅ Cleanup complete!');
}

async function deleteProfile(profileId) {
  const answer = await question(`Are you sure you want to delete profile ${profileId}? (yes/no): `);
  
  if (answer.toLowerCase() === 'yes') {
    await db.collection('asha_workers').doc(profileId).delete();
    console.log(`✅ Profile ${profileId} deleted`);
  } else {
    console.log('❌ Deletion cancelled');
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('ASHA Worker Profile Cleanup Tool');
  console.log('='.repeat(60));
  
  while (true) {
    console.log('\nOptions:');
    console.log('1. List all profiles');
    console.log('2. Find duplicates by phone number');
    console.log('3. Auto-delete duplicates (keeps oldest)');
    console.log('4. Delete specific profile');
    console.log('5. Exit');
    
    const choice = await question('\nEnter your choice (1-5): ');
    
    switch (choice) {
      case '1':
        await listAllProfiles();
        break;
        
      case '2':
        const duplicates = await findDuplicatesByPhone();
        if (duplicates.length === 0) {
          console.log('\n✅ No duplicates found!');
        } else {
          console.log(`\n⚠️  Found ${duplicates.length} duplicate phone numbers:`);
          duplicates.forEach(dup => {
            console.log(`\n  Phone: ${dup.phone}`);
            console.log(`  Profiles: ${dup.docs.length}`);
            dup.docs.forEach(doc => {
              console.log(`    - ${doc.id} (${doc.data.name})`);
            });
          });
        }
        break;
        
      case '3':
        const dupsToDelete = await findDuplicatesByPhone();
        if (dupsToDelete.length === 0) {
          console.log('\n✅ No duplicates to delete!');
        } else {
          const confirm = await question(`\nFound ${dupsToDelete.length} duplicate groups. Delete? (yes/no): `);
          if (confirm.toLowerCase() === 'yes') {
            await deleteDuplicates(dupsToDelete);
          } else {
            console.log('❌ Deletion cancelled');
          }
        }
        break;
        
      case '4':
        const profileId = await question('Enter profile ID to delete: ');
        await deleteProfile(profileId);
        break;
        
      case '5':
        console.log('\n👋 Goodbye!');
        rl.close();
        process.exit(0);
        
      default:
        console.log('❌ Invalid choice');
    }
  }
}

main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
