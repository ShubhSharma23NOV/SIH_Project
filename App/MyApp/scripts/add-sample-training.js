// Script to add sample training modules to Firestore
// Run with: node scripts/add-sample-training.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
// You need to download your service account key from Firebase Console
// Go to: Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const sampleModules = [
  {
    title: 'Water Quality Testing Basics',
    description: 'Learn the fundamentals of water quality testing and how to use testing kits effectively.',
    type: 'video',
    duration: 15, // minutes
    cloudinaryUrl: 'training/videos/water-testing-basics', // Replace with your Cloudinary public ID
    thumbnailUrl: 'training/images/water-testing-thumb', // Replace with your thumbnail
    category: 'Water Testing',
    language: 'hindi',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Community Health Survey Guide',
    description: 'Step-by-step guide for conducting household health surveys in your community.',
    type: 'pdf',
    duration: 10,
    cloudinaryUrl: 'training/documents/survey-guide', // Replace with your Cloudinary public ID
    thumbnailUrl: 'training/images/survey-thumb',
    category: 'Surveys',
    language: 'hindi',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Using the Mobile App',
    description: 'Complete tutorial on how to use all features of the Arogya Jal mobile application.',
    type: 'video',
    duration: 20,
    cloudinaryUrl: 'training/videos/app-tutorial', // Replace with your Cloudinary public ID
    thumbnailUrl: 'training/images/app-tutorial-thumb',
    category: 'App Training',
    language: 'hindi',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addSampleData() {
  try {
    console.log('Adding sample training modules...');
    
    for (const module of sampleModules) {
      const docRef = await db.collection('training_modules').add(module);
      console.log(`✓ Added: ${module.title} (ID: ${docRef.id})`);
    }
    
    console.log('\n✅ All sample modules added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding modules:', error);
    process.exit(1);
  }
}

addSampleData();
