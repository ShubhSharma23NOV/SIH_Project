import React, { useEffect } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { ResidentAuthProvider } from './src/context/ResidentAuthContext';
import { PHCAuthProvider } from './src/context/PHCAuthContext';
import { OpsAuthProvider } from './src/context/OpsAuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';
import { createTables } from './src/database/tables';
import { runMigrations } from './src/database/migrations';
import SyncService from './src/services/SyncService';
import LocationService from './src/services/LocationService';
import './src/utils/i18n'; // Initialize i18n

export default function App() {
  useEffect(() => {
    // Initialize all services on app startup
    const initializeApp = async () => {
      try {
        // Initialize database
        await initDatabase();
        console.log('✅ Database initialized');
        await createTables();
        console.log('✅ Database tables created');
        
        // Run migrations for existing installations
        await runMigrations();
        console.log('✅ Database migrations completed');
        
        // Small delay to ensure database is fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Initialize location service (non-blocking)
        try {
          await LocationService.init();
          console.log('✅ Location service initialized');
          
          // Request location permission on first launch
          const hasPermission = await LocationService.requestPermission();
          if (hasPermission) {
            console.log('✅ Location permission granted');
            // Get initial location (don't await to avoid blocking)
            LocationService.getLocation().catch(err => 
              console.warn('⚠️ Could not get initial location:', err.message)
            );
          } else {
            console.warn('⚠️ Location permission denied');
          }
        } catch (error) {
          console.warn('⚠️ Location service initialization failed:', error.message);
        }
        
        // Initialize offline sync service
        const syncInitialized = await SyncService.init();
        if (syncInitialized) {
          console.log('✅ Sync service initialized');
        } else {
          console.warn('⚠️ Sync service initialization incomplete');
        }
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      SyncService.stopSync();
    };
  }, []);

  return (
    <AuthProvider>
      <ResidentAuthProvider>
        <PHCAuthProvider>
          <OpsAuthProvider>
            <AppNavigator />
          </OpsAuthProvider>
        </PHCAuthProvider>
      </ResidentAuthProvider>
    </AuthProvider>
  );
}
