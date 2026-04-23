/**
 * Ops Authentication Context
 * Manages ops/support team login and permissions
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OpsAuthContext = createContext();

export const useOpsAuth = () => {
  const context = useContext(OpsAuthContext);
  if (!context) {
    throw new Error('useOpsAuth must be used within OpsAuthProvider');
  }
  return context;
};

export const OpsAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [opsProfile, setOpsProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load cached data immediately
    const loadCachedData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('ops_profile');
        
        if (cachedProfile) {
          const profile = JSON.parse(cachedProfile);
          setOpsProfile(profile);
          setUser({ uid: profile.uid });
          console.log('[OpsAuth] Loaded cached profile:', profile.uid);
        }
      } catch (error) {
        console.error('[OpsAuth] Error loading cached data:', error);
      }
    };

    loadCachedData();

    // Set up Firebase auth state listener
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      console.log('[OpsAuth] Auth state changed:', firebaseUser?.uid);
      
      if (firebaseUser) {
        // Check session type to avoid loading ops data for other user types
        const sessionType = await AsyncStorage.getItem('session_type');
        console.log('[OpsAuth] Session type:', sessionType);
        
        // Only load ops data if session type is 'ops'
        if (sessionType === 'ops') {
          await loadOpsData(firebaseUser.uid);
        } else {
          // Different session type, don't load ops data
          console.log('[OpsAuth] Different session type, skipping ops data load');
          setLoading(false);
        }
      } else {
        const cachedProfile = await AsyncStorage.getItem('ops_profile');
        if (!cachedProfile) {
          setUser(null);
          setOpsProfile(null);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadOpsData = async (uid) => {
    try {
      // Load ops profile
      const opsDoc = await firestore()
        .collection('ops_support')
        .doc(uid)
        .get();

      if (opsDoc.exists) {
        const profile = opsDoc.data();
        setOpsProfile(profile);
        setUser({ uid });

        // Cache profile and mark session type
        await AsyncStorage.setItem('ops_profile', JSON.stringify(profile));
        await AsyncStorage.setItem('session_type', 'ops');
        console.log('[OpsAuth] Profile loaded and cached for:', uid);
      } else {
        setError('Ops profile not found');
      }
    } catch (err) {
      console.error('[OpsAuth] Error loading ops data:', err);
      setError(err.message);
    }
  };

  const login = async (firebaseUser) => {
    try {
      setError(null);
      await loadOpsData(firebaseUser.uid);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      console.log('[OpsAuth] Logging out ops user');
      await auth().signOut();
      await AsyncStorage.multiRemove(['ops_profile', 'session_type']);
      setUser(null);
      setOpsProfile(null);
    } catch (err) {
      console.error('[OpsAuth] Logout error:', err);
    }
  };

  const refreshData = async () => {
    if (user) {
      await loadOpsData(user.uid);
    }
  };

  const value = {
    user,
    opsProfile,
    loading,
    error,
    login,
    logout,
    refreshData,
  };

  return (
    <OpsAuthContext.Provider value={value}>
      {children}
    </OpsAuthContext.Provider>
  );
};
