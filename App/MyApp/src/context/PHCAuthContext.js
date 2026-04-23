/**
 * PHC Authentication Context
 * Manages PHC doctor login, profile, and assigned area data
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PHCAuthContext = createContext();

export const usePHCAuth = () => {
  const context = useContext(PHCAuthContext);
  if (!context) {
    throw new Error('usePHCAuth must be used within PHCAuthProvider');
  }
  return context;
};

export const PHCAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [phcProfile, setPHCProfile] = useState(null);
  const [assignedAreas, setAssignedAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load cached data immediately
    const loadCachedData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('phc_profile');
        const cachedAreas = await AsyncStorage.getItem('phc_assigned_areas');
        
        if (cachedProfile) {
          const profile = JSON.parse(cachedProfile);
          setPHCProfile(profile);
          setUser({ uid: profile.uid });
          console.log('[PHCAuth] Loaded cached profile:', profile.uid);
        }
        
        if (cachedAreas) {
          setAssignedAreas(JSON.parse(cachedAreas));
          console.log('[PHCAuth] Loaded cached areas');
        }
      } catch (error) {
        console.error('[PHCAuth] Error loading cached data:', error);
      }
    };

    loadCachedData();

    // Set up Firebase auth state listener
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      console.log('[PHCAuth] Auth state changed:', firebaseUser?.uid);
      
      if (firebaseUser) {
        // Check session type to avoid loading PHC data for other user types
        const sessionType = await AsyncStorage.getItem('session_type');
        console.log('[PHCAuth] Session type:', sessionType);
        
        // Only load PHC data if session type is 'phc'
        if (sessionType === 'phc') {
          await loadPHCData(firebaseUser.uid);
        } else {
          // Different session type, don't load PHC data
          console.log('[PHCAuth] Different session type, skipping PHC data load');
          setLoading(false);
        }
      } else {
        const cachedProfile = await AsyncStorage.getItem('phc_profile');
        if (!cachedProfile) {
          setUser(null);
          setPHCProfile(null);
          setAssignedAreas([]);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadPHCData = async (uid) => {
    try {
      // Load PHC doctor profile
      const phcDoc = await firestore()
        .collection('phc_doctors')
        .doc(uid)
        .get();

      if (phcDoc.exists) {
        const profile = phcDoc.data();
        setPHCProfile(profile);
        setUser({ uid });

        // Cache profile and mark session type
        await AsyncStorage.setItem('phc_profile', JSON.stringify(profile));
        await AsyncStorage.setItem('session_type', 'phc');
        console.log('[PHCAuth] Profile loaded and cached for:', uid);

        // Load assigned areas
        if (profile.assignedAreas && profile.assignedAreas.length > 0) {
          await loadAssignedAreas(profile.assignedAreas);
        }
        
        setLoading(false);
      } else {
        setError('PHC doctor profile not found');
        setLoading(false);
      }
    } catch (err) {
      console.error('[PHCAuth] Error loading PHC data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const loadAssignedAreas = async (areaIds) => {
    try {
      const areas = [];
      for (const areaId of areaIds) {
        const areaDoc = await firestore()
          .collection('areas')
          .doc(areaId)
          .get();
        
        if (areaDoc.exists) {
          areas.push({ id: areaDoc.id, ...areaDoc.data() });
        }
      }
      
      setAssignedAreas(areas);
      await AsyncStorage.setItem('phc_assigned_areas', JSON.stringify(areas));
      console.log('[PHCAuth] Loaded assigned areas:', areas.length);
    } catch (err) {
      console.error('[PHCAuth] Error loading assigned areas:', err);
    }
  };

  const login = async (firebaseUser) => {
    try {
      setError(null);
      await loadPHCData(firebaseUser.uid);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      console.log('[PHCAuth] Logging out PHC doctor');
      await auth().signOut();
      await AsyncStorage.multiRemove(['phc_profile', 'phc_assigned_areas', 'session_type']);
      setUser(null);
      setPHCProfile(null);
      setAssignedAreas([]);
    } catch (err) {
      console.error('[PHCAuth] Logout error:', err);
    }
  };

  const refreshData = async () => {
    if (user) {
      await loadPHCData(user.uid);
    }
  };

  const value = {
    user,
    phcProfile,
    assignedAreas,
    loading,
    error,
    login,
    logout,
    refreshData,
  };

  return (
    <PHCAuthContext.Provider value={value}>
      {children}
    </PHCAuthContext.Provider>
  );
};
