/**
 * AuthContext - React Context for Authentication State Management
 * Provides authentication state and methods to all components
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import AuthService from '../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize AuthService and listen to auth state changes
  useEffect(() => {
    console.log('🔄 Initializing AuthService...');
    
    // DISABLED: AuthService global initialization interferes with PHC/Resident auth
    // Each auth context (PHC, Resident, ASHA) manages its own auth state
    // AuthService.initialize();
    
    // DISABLED: Global auth state listener
    // const unsubscribe = AuthService.onAuthStateChange((state, data) => {
    //   console.log('[AuthContext] Auth state changed:', state);
    //   
    //   switch (state) {
    //     case 'authenticated':
    //       setAuthenticated(true);
    //       setUser(data.user);
    //       setProfile(data.profile);
    //       setError(null);
    //       break;
    //       
    //     case 'unauthenticated':
    //       setAuthenticated(false);
    //       setUser(null);
    //       setProfile(null);
    //       setError(null);
    //       break;
    //       
    //     case 'unauthorized':
    //       setAuthenticated(false);
    //       setUser(null);
    //       setProfile(null);
    //       setError('Access denied. Only ASHA workers can use this app.');
    //       break;
    //   }
    //   
    //   if (initializing) {
    //     setInitializing(false);
    //   }
    //   setLoading(false);
    // });

    // Check initial auth state
    checkInitialAuthState();
    
    if (initializing) {
      setInitializing(false);
    }
    setLoading(false);

    // Cleanup
    return () => {
      // unsubscribe();
      // AuthService.cleanup();
    };
  }, []);

  /**
   * Check initial authentication state
   */
  const checkInitialAuthState = async () => {
    try {
      const sessionInfo = await AuthService.getSessionInfo();
      
      if (sessionInfo.authenticated) {
        setAuthenticated(true);
        setUser(sessionInfo.user);
        setProfile(sessionInfo.profile);
        setError(null);
      } else {
        setAuthenticated(false);
        setUser(null);
        setProfile(null);
        setError(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error checking initial auth state:', error);
      setAuthenticated(false);
      setUser(null);
      setProfile(null);
      setError(error.message);
    } finally {
      if (initializing) {
        setInitializing(false);
      }
      setLoading(false);
    }
  };

  /**
   * Handle user signed in
   */
  const handleUserSignedIn = async (firebaseUser) => {
    try {
      console.log('👤 User signed in:', firebaseUser.uid);
      
      // Try to load cached profile first
      const cachedProfile = await AsyncStorage.getItem('asha_profile');
      
      if (cachedProfile) {
        const parsedProfile = JSON.parse(cachedProfile);
        setUser(firebaseUser);
        setProfile(parsedProfile);
        setAuthenticated(true);
        console.log('✅ Loaded cached profile');
      }

      // Verify ASHA role (will update if needed)
      const roleCheck = await AuthService.verifyASHARole(firebaseUser.uid);
      
      if (roleCheck.success) {
        setUser(firebaseUser);
        setProfile(roleCheck.profile);
        setAuthenticated(true);
        setError(null);
        console.log('✅ User authenticated as ASHA worker');
      } else {
        // Not an ASHA worker
        setUser(null);
        setProfile(null);
        setAuthenticated(false);
        setError(roleCheck.message);
        console.log('❌ User is not an ASHA worker');
        
        // Sign out
        await AuthService.signOut();
      }
    } catch (err) {
      console.error('❌ Error handling signed in user:', err);
      setError('Failed to verify user');
      setAuthenticated(false);
    }
  };

  /**
   * Handle user signed out
   */
  const handleUserSignedOut = () => {
    console.log('🚪 User signed out');
    setUser(null);
    setProfile(null);
    setAuthenticated(false);
    setError(null);
  };

  /**
   * Send OTP to phone number
   */
  const sendOTP = async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AuthService.sendOTP(phoneNumber);
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMsg = 'Failed to send OTP';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP code
   */
  const verifyOTP = async (otp) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AuthService.verifyOTP(otp);
      
      if (!result.success) {
        setError(result.message);
      }
      
      // Auth state listener will handle the rest
      return result;
    } catch (err) {
      const errorMsg = 'Failed to verify OTP';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const resendOTP = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AuthService.resendOTP();
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMsg = 'Failed to resend OTP';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out user
   */
  const signOut = async () => {
    try {
      setLoading(true);
      const result = await AuthService.signOut();
      
      // Auth state listener will handle the rest
      return result;
    } catch (err) {
      const errorMsg = 'Failed to sign out';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh auth token
   */
  const refreshToken = async () => {
    try {
      const token = await AuthService.getAuthToken(true);
      return {
        success: true,
        token: token,
      };
    } catch (err) {
      return {
        success: false,
        message: 'Failed to refresh token',
        error: err.message,
      };
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const result = await AuthService.updateProfile(updates);
      
      if (result.success) {
        // Update local profile state
        setProfile((prev) => ({ ...prev, ...updates }));
      }
      
      return result;
    } catch (err) {
      return {
        success: false,
        message: 'Failed to update profile',
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get auth token
   */
  const getAuthToken = async (forceRefresh = false) => {
    try {
      return await AuthService.getAuthToken(forceRefresh);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Validate phone number
   */
  const validatePhoneNumber = (phoneNumber) => {
    return AuthService.validatePhoneNumber(phoneNumber);
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    // State
    loading: loading || initializing,
    authenticated,
    user,
    profile,
    error,
    initializing,
    
    // Methods
    sendOTP,
    verifyOTP,
    resendOTP,
    signOut,
    refreshToken,
    updateProfile,
    getAuthToken,
    validatePhoneNumber,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
