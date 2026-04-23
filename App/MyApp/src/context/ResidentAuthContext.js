/**
 * Resident Authentication Context
 * Manages resident login, profile, and household data
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ResidentAuthContext = createContext();

export const useResidentAuth = () => {
  const context = useContext(ResidentAuthContext);
  if (!context) {
    throw new Error('useResidentAuth must be used within ResidentAuthProvider');
  }
  return context;
};

export const ResidentAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [residentProfile, setResidentProfile] = useState(null);
  const [householdData, setHouseholdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load cached data immediately on mount
    const loadCachedData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('resident_profile');
        const cachedHousehold = await AsyncStorage.getItem('household_data');
        
        if (cachedProfile) {
          const profile = JSON.parse(cachedProfile);
          setResidentProfile(profile);
          setUser({ uid: profile.uid });
          console.log('[ResidentAuth] Loaded cached profile:', profile.uid);
        }
        
        if (cachedHousehold) {
          setHouseholdData(JSON.parse(cachedHousehold));
          console.log('[ResidentAuth] Loaded cached household data');
        }
      } catch (error) {
        console.error('[ResidentAuth] Error loading cached data:', error);
      }
    };

    loadCachedData();

    // Set up Firebase auth state listener
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      console.log('[ResidentAuth] Auth state changed:', firebaseUser?.uid);
      
      if (firebaseUser) {
        // Check session type to avoid loading resident data for other user types
        const sessionType = await AsyncStorage.getItem('session_type');
        console.log('[ResidentAuth] Session type:', sessionType);
        
        // Only load resident data if session type is 'resident' or not set
        if (sessionType === 'resident' || !sessionType) {
          // Check if this is actually a resident by trying to load the profile
          try {
            const residentDoc = await firestore()
              .collection('resident_profiles')
              .doc(firebaseUser.uid)
              .get();
            
            if (residentDoc.exists) {
              await loadResidentData(firebaseUser.uid);
            } else {
              // Not a resident, skip loading
              console.log('[ResidentAuth] User is not a resident, skipping data load');
              setLoading(false);
            }
          } catch (error) {
            console.log('[ResidentAuth] Error checking resident profile:', error.message);
            setLoading(false);
          }
        } else {
          // Different session type (PHC, ASHA, etc.), don't load resident data
          console.log('[ResidentAuth] Different session type, skipping resident data load');
          setLoading(false);
        }
      } else {
        // Only clear if we don't have cached data (user explicitly logged out)
        const cachedProfile = await AsyncStorage.getItem('resident_profile');
        if (!cachedProfile) {
          setUser(null);
          setResidentProfile(null);
          setHouseholdData(null);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadResidentData = async (uid) => {
    try {
      // Load resident profile from resident_profiles collection
      const residentDoc = await firestore()
        .collection('resident_profiles')
        .doc(uid)
        .get();

      if (residentDoc.exists) {
        const profile = residentDoc.data();
        setResidentProfile(profile);
        setUser({ uid });

        // Update lastLogin
        await firestore()
          .collection('resident_profiles')
          .doc(uid)
          .update({
            lastLogin: firestore.FieldValue.serverTimestamp(),
          });

        // Cache profile and mark session type
        await AsyncStorage.setItem('resident_profile', JSON.stringify(profile));
        await AsyncStorage.setItem('session_type', 'resident');
        console.log('[ResidentAuth] Profile loaded and cached for:', uid);

        // Load household data if available
        if (profile.householdId) {
          await loadHouseholdData(profile.householdId);
        }
      } else {
        console.log('[ResidentAuth] Profile not found in resident_profiles, checking old collection');
        
        // Fallback: check old residents collection for migration
        const oldResidentDoc = await firestore()
          .collection('residents')
          .doc(uid)
          .get();
        
        if (oldResidentDoc.exists) {
          const oldProfile = oldResidentDoc.data();
          setResidentProfile(oldProfile);
          setUser({ uid });
          await AsyncStorage.setItem('resident_profile', JSON.stringify(oldProfile));
          await AsyncStorage.setItem('session_type', 'resident');
          console.log('[ResidentAuth] Loaded from old residents collection');
        } else {
          setError('Resident profile not found');
        }
      }
    } catch (err) {
      console.error('Error loading resident data:', err);
      setError(err.message);
    }
  };

  const loadHouseholdData = async (householdId) => {
    try {
      const householdDoc = await firestore()
        .collection('households')
        .doc(householdId)
        .get();

      if (householdDoc.exists) {
        const household = householdDoc.data();
        setHouseholdData(household);

        // Cache household data
        await AsyncStorage.setItem('household_data', JSON.stringify(household));
      }
    } catch (err) {
      console.error('Error loading household data:', err);
    }
  };

  const sendOTP = async (phoneNumber) => {
    try {
      setError(null);
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      return { success: true, confirmation };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const verifyOTP = async (confirmation, otp) => {
    try {
      setError(null);
      await confirmation.confirm(otp);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const login = async (firebaseUser) => {
    try {
      setError(null);
      await loadResidentData(firebaseUser.uid);
      // Mark this as a resident session
      await AsyncStorage.setItem('session_type', 'resident');
      console.log('[ResidentAuth] Resident session created');
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      console.log('[ResidentAuth] Logging out resident');
      await auth().signOut();
      await AsyncStorage.multiRemove(['resident_profile', 'household_data', 'session_type']);
      setUser(null);
      setResidentProfile(null);
      setHouseholdData(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshData = async () => {
    if (user) {
      await loadResidentData(user.uid);
    }
  };

  const value = {
    user,
    residentProfile,
    householdData,
    loading,
    error,
    login,
    sendOTP,
    verifyOTP,
    logout,
    refreshData,
  };

  return (
    <ResidentAuthContext.Provider value={value}>
      {children}
    </ResidentAuthContext.Provider>
  );
};
