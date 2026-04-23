/**
 * AuthService - Core Authentication Logic
 * Singleton service for Firebase Phone Authentication
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.confirmation = null;
    this.pendingPhone = null;
    this.currentUser = null;
    this.authStateListener = null;
    this.tokenRefreshInterval = null;
    this.authStateCallbacks = [];
  }

  /**
   * Initialize AuthService
   * Sets up auth state listener and token refresh
   */
  initialize() {
    console.log('[AuthService] Initializing...');
    this.setupAuthStateListener();
    this.setupTokenRefresh();
  }

  /**
   * Setup Firebase auth state listener
   * Automatically detects sign in/out and updates app state
   */
  setupAuthStateListener() {
    if (this.authStateListener) {
      return; // Already set up
    }

    this.authStateListener = auth().onAuthStateChanged(async (user) => {
      console.log('[AuthService] Auth state changed:', user ? user.uid : 'No user');
      
      if (user) {
        // User signed in
        this.currentUser = user;
        
        // Verify ASHA role
        const profile = await this.verifyASHARole(user.uid);
        
        if (profile) {
          // Valid ASHA worker
          await this.cacheUserData(user, profile);
          this.notifyAuthStateChange('authenticated', { user, profile });
        } else {
          // Not ASHA worker - sign out
          console.log('[AuthService] User is not ASHA worker, signing out');
          await auth().signOut();
          this.notifyAuthStateChange('unauthorized', null);
        }
      } else {
        // User signed out
        this.currentUser = null;
        this.notifyAuthStateChange('unauthenticated', null);
      }
    });
  }

  /**
   * Setup automatic token refresh
   * Refreshes token every 50 minutes (Firebase tokens expire after 60 min)
   */
  setupTokenRefresh() {
    // Clear existing interval
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    // Refresh token every 50 minutes
    this.tokenRefreshInterval = setInterval(async () => {
      const user = auth().currentUser;
      if (user) {
        console.log('[AuthService] Auto-refreshing token...');
        try {
          await user.getIdToken(true); // Force refresh
          console.log('[AuthService] Token refreshed successfully');
        } catch (error) {
          console.error('[AuthService] Token refresh failed:', error);
        }
      }
    }, 50 * 60 * 1000); // 50 minutes
  }

  /**
   * Register callback for auth state changes
   * @param {function} callback - Function to call on auth state change
   * @returns {function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all registered callbacks of auth state change
   * @param {string} state - 'authenticated' | 'unauthenticated' | 'unauthorized'
   * @param {object} data - User and profile data
   */
  notifyAuthStateChange(state, data) {
    console.log('[AuthService] Notifying auth state change:', state);
    this.authStateCallbacks.forEach(callback => {
      try {
        callback(state, data);
      } catch (error) {
        console.error('[AuthService] Error in auth state callback:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
    this.authStateCallbacks = [];
  }

  /**
   * Validate Indian phone number
   * @param {string} phoneNumber - 10 digit phone number
   * @returns {object} { valid: boolean, formatted: string, error: string }
   */
  validatePhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length !== 10) {
      return {
        valid: false,
        formatted: null,
        error: 'Phone number must be 10 digits',
        errorHindi: 'फ़ोन नंबर 10 अंकों का होना चाहिए',
      };
    }

    const firstDigit = cleaned[0];
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      return {
        valid: false,
        formatted: null,
        error: 'Phone number must start with 6, 7, 8, or 9',
        errorHindi: 'फ़ोन नंबर 6, 7, 8, या 9 से शुरू होना चाहिए',
      };
    }

    return {
      valid: true,
      formatted: `+91${cleaned}`,
      error: null,
    };
  }

  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Phone number (10 digits or +91XXXXXXXXXX)
   * @returns {Promise<object>} { success: boolean, message: string }
   */
  async sendOTP(phoneNumber) {
    try {
      // Validate phone number
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error,
          messageHindi: validation.errorHindi,
        };
      }

      const formattedPhone = validation.formatted;
      console.log('📱 Sending OTP to:', formattedPhone);

      // Send OTP via Firebase
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      
      // Store confirmation object and phone
      this.confirmation = confirmation;
      this.pendingPhone = formattedPhone;
      
      // Cache pending phone in AsyncStorage
      await AsyncStorage.setItem('pending_phone', formattedPhone);

      console.log('✅ OTP sent successfully');
      return {
        success: true,
        message: 'OTP sent successfully',
        messageHindi: 'ओटीपी सफलतापूर्वक भेजा गया',
        phone: formattedPhone,
      };
    } catch (error) {
      console.error('❌ Send OTP Error:', error);
      return this.handleAuthError(error);
    }
  }

  /**
   * Verify OTP and authenticate user
   * @param {string} otp - 6 digit OTP code
   * @returns {Promise<object>} { success: boolean, user: object, profile: object }
   */
  async verifyOTP(otp) {
    try {
      if (!this.confirmation) {
        return {
          success: false,
          message: 'Please request OTP first',
          messageHindi: 'कृपया पहले ओटीपी का अनुरोध करें',
        };
      }

      if (!otp || otp.length !== 6) {
        return {
          success: false,
          message: 'Please enter a valid 6-digit OTP',
          messageHindi: 'कृपया एक मान्य 6 अंकों का ओटीपी दर्ज करें',
        };
      }

      console.log('🔐 Verifying OTP...');

      // Verify OTP with Firebase
      const userCredential = await this.confirmation.confirm(otp);
      const user = userCredential.user;

      console.log('✅ OTP verified, User UID:', user.uid);

      // Verify ASHA role
      const roleCheck = await this.verifyASHARole(user.uid);
      
      if (!roleCheck.success) {
        // Not an ASHA worker, sign out
        await auth().signOut();
        return roleCheck;
      }

      // Cache user data
      await this.cacheUserData(user, roleCheck.profile);

      // Update last login timestamp (non-blocking)
      this.updateLastLogin().catch(err => 
        console.log('⚠️ Last login update failed:', err.message)
      );

      // Start token refresh
      this.startTokenRefresh();

      // Clear pending phone
      this.pendingPhone = null;
      await AsyncStorage.removeItem('pending_phone');

      return {
        success: true,
        message: 'Login successful',
        messageHindi: 'लॉगिन सफल',
        user: user,
        profile: roleCheck.profile,
      };
    } catch (error) {
      console.error('❌ Verify OTP Error:', error);
      return this.handleAuthError(error);
    }
  }

  /**
   * Resend OTP to the same phone number
   * @returns {Promise<object>}
   */
  async resendOTP() {
    if (!this.pendingPhone) {
      const cachedPhone = await AsyncStorage.getItem('pending_phone');
      if (cachedPhone) {
        this.pendingPhone = cachedPhone;
      } else {
        return {
          success: false,
          message: 'No pending phone number found',
          messageHindi: 'कोई लंबित फ़ोन नंबर नहीं मिला',
        };
      }
    }

    return this.sendOTP(this.pendingPhone);
  }

  /**
   * Verify if user is an ASHA worker
   * @param {string} uid - User ID
   * @returns {Promise<object>}
   */
  async verifyASHARole(uid) {
    try {
      console.log('👤 Checking ASHA role for UID:', uid);

      const doc = await firestore()
        .collection('asha_workers')
        .doc(uid)
        .get();

      if (doc.exists) {
        const profile = doc.data();
        
        if (profile.role === 'ASHA' && profile.status === 'active') {
          console.log('✅ ASHA worker verified:', profile.name);
          return {
            success: true,
            profile: profile,
          };
        } else {
          console.log('❌ User is not an active ASHA worker');
          return {
            success: false,
            message: 'Account is not active or not authorized',
            messageHindi: 'खाता सक्रिय नहीं है या अधिकृत नहीं है',
          };
        }
      } else {
        // Profile doesn't exist - user is not registered
        console.log('❌ ASHA profile not found for UID:', uid);
        const user = auth().currentUser;
        
        return {
          success: false,
          message: `Phone number ${user?.phoneNumber || 'this'} is not registered as an ASHA worker. Please contact your administrator.`,
          messageHindi: 'यह फ़ोन नंबर आशा कार्यकर्ता के रूप में पंजीकृत नहीं है। कृपया अपने प्रशासक से संपर्क करें।',
        };
      }
    } catch (error) {
      console.error('❌ Role verification error:', error);
      return {
        success: false,
        message: 'Failed to verify user role',
        messageHindi: 'उपयोगकर्ता भूमिका सत्यापित करने में विफल',
        error: error.message,
      };
    }
  }

  /**
   * Sign out user
   * @returns {Promise<object>}
   */
  async signOut() {
    try {
      console.log('🚪 Signing out...');
      
      // Stop token refresh
      this.stopTokenRefresh();
      
      // Clear cached data including session_type
      await AsyncStorage.multiRemove(['user_data', 'asha_profile', 'pending_phone', 'session_type']);
      
      // Clear global session flags
      global.hasExistingSession = false;
      global.sessionType = null;
      
      // Sign out from Firebase
      await auth().signOut();
      
      // Clear confirmation
      this.confirmation = null;
      this.pendingPhone = null;

      console.log('✅ Signed out successfully');
      return {
        success: true,
        message: 'Signed out successfully',
        messageHindi: 'सफलतापूर्वक साइन आउट किया गया',
      };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return {
        success: false,
        message: 'Failed to sign out',
        messageHindi: 'साइन आउट करने में विफल',
        error: error.message,
      };
    }
  }

  /**
   * Get Firebase ID token
   * @param {boolean} forceRefresh - Force token refresh
   * @returns {Promise<string>}
   */
  async getAuthToken(forceRefresh = false) {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const token = await user.getIdToken(forceRefresh);
      return token;
    } catch (error) {
      console.error('❌ Get token error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {object} updates - Profile updates
   * @returns {Promise<object>}
   */
  async updateProfile(updates) {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Only update if document exists
      const docRef = firestore()
        .collection('asha_workers')
        .doc(user.uid);
      
      const doc = await docRef.get();
      
      if (!doc.exists) {
        console.log('⚠️ Profile does not exist, cannot update');
        return {
          success: false,
          message: 'Profile not found',
          messageHindi: 'प्रोफ़ाइल नहीं मिला',
        };
      }

      await docRef.update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update cached profile
      const cachedProfile = await AsyncStorage.getItem('asha_profile');
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);
        const updatedProfile = { ...profile, ...updates };
        await AsyncStorage.setItem('asha_profile', JSON.stringify(updatedProfile));
      }

      console.log('✅ Profile updated successfully');
      return {
        success: true,
        message: 'Profile updated successfully',
        messageHindi: 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई',
      };
    } catch (error) {
      console.error('❌ Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile',
        messageHindi: 'प्रोफ़ाइल अपडेट करने में विफल',
        error: error.message,
      };
    }
  }

  /**
   * Update last login timestamp
   * @private
   */
  async updateLastLogin() {
    try {
      const user = auth().currentUser;
      if (!user) return;

      await firestore()
        .collection('asha_workers')
        .doc(user.uid)
        .update({
          lastLogin: firestore.FieldValue.serverTimestamp(),
        });
      
      console.log('✅ Last login updated');
    } catch (error) {
      // Silently fail - not critical
      console.log('⚠️ Could not update last login:', error.message);
    }
  }

  /**
   * Cache user data locally
   * @private
   */
  async cacheUserData(user, profile) {
    try {
      const userData = {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        lastLogin: new Date().toISOString(),
      };

      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      await AsyncStorage.setItem('asha_profile', JSON.stringify(profile));
      
      console.log('💾 User data cached');
    } catch (error) {
      console.error('❌ Cache error:', error);
    }
  }

  /**
   * Start automatic token refresh (every 50 minutes)
   * @private
   */
  startTokenRefresh() {
    this.stopTokenRefresh(); // Clear any existing interval
    
    this.tokenRefreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Refreshing auth token...');
        await this.getAuthToken(true);
        console.log('✅ Token refreshed');
      } catch (error) {
        console.error('❌ Token refresh error:', error);
      }
    }, 50 * 60 * 1000); // 50 minutes
  }

  /**
   * Stop automatic token refresh
   * @private
   */
  stopTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  /**
   * Cache user data in AsyncStorage
   * @param {object} user - Firebase user object
   * @param {object} profile - ASHA profile from Firestore
   */
  async cacheUserData(user, profile = null) {
    try {
      const userData = {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        lastLogin: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      await AsyncStorage.setItem('session_type', 'asha');
      
      if (profile) {
        await AsyncStorage.setItem('asha_profile', JSON.stringify(profile));
      }
      
      console.log('[AuthService] ASHA user data cached successfully');
    } catch (error) {
      console.error('[AuthService] Error caching user data:', error);
    }
  }

  /**
   * Get cached ASHA profile
   * @returns {Promise<object|null>} Cached profile or null
   */
  async getCachedProfile() {
    try {
      const profileData = await AsyncStorage.getItem('asha_profile');
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('[AuthService] Error getting cached profile:', error);
      return null;
    }
  }

  /**
   * Clear user cache on logout
   */
  async clearUserCache() {
    try {
      await AsyncStorage.multiRemove([
        'user_data',
        'asha_profile',
        'pending_phone',
        'session_type',
      ]);
      
      // Clear global session flags
      global.hasExistingSession = false;
      global.sessionType = null;
      
      console.log('[AuthService] User cache cleared');
    } catch (error) {
      console.error('[AuthService] Error clearing user cache:', error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!auth().currentUser;
  }

  /**
   * Get current Firebase user
   * @returns {object|null}
   */
  getCurrentUser() {
    return auth().currentUser;
  }

  /**
   * Check if session is valid
   * @returns {Promise<boolean>}
   */
  async isSessionValid() {
    try {
      const user = auth().currentUser;
      if (!user) {
        return false;
      }
      
      // Try to get token (will fail if session expired)
      const token = await user.getIdToken(false);
      return !!token;
    } catch (error) {
      console.error('[AuthService] Session validation failed:', error);
      return false;
    }
  }

  /**
   * Get session information
   * @returns {Promise<object>}
   */
  async getSessionInfo() {
    try {
      const user = auth().currentUser;
      if (!user) {
        return { authenticated: false, user: null, profile: null };
      }

      const profile = await this.getCachedProfile();
      const token = await user.getIdToken(false);
      const tokenResult = await user.getIdTokenResult();

      return {
        authenticated: true,
        user: {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          metadata: user.metadata,
        },
        profile,
        token: {
          expirationTime: tokenResult.expirationTime,
          issuedAtTime: tokenResult.issuedAtTime,
          authTime: tokenResult.authTime,
        },
      };
    } catch (error) {
      console.error('[AuthService] Error getting session info:', error);
      return { authenticated: false, error: error.message };
    }
  }

  /**
   * Get auth token
   * @param {boolean} forceRefresh - Force token refresh
   * @returns {Promise<string|null>}
   */
  async getAuthToken(forceRefresh = false) {
    try {
      const user = auth().currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('[AuthService] Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Handle Firebase auth errors
   * @private
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/invalid-phone-number': {
        message: 'Invalid phone number format',
        messageHindi: 'अमान्य फ़ोन नंबर प्रारूप',
      },
      'auth/too-many-requests': {
        message: 'Too many attempts. Please try again later',
        messageHindi: 'बहुत अधिक प्रयास। कृपया बाद में पुन: प्रयास करें',
      },
      'auth/invalid-verification-code': {
        message: 'Invalid OTP. Please check and try again',
        messageHindi: 'अमान्य ओटीपी। कृपया जांचें और पुनः प्रयास करें',
      },
      'auth/code-expired': {
        message: 'OTP expired. Please request a new one',
        messageHindi: 'ओटीपी समाप्त हो गया। कृपया नया अनुरोध करें',
      },
      'auth/session-expired': {
        message: 'Session expired. Please request a new OTP',
        messageHindi: 'सत्र समाप्त हो गया। कृपया नया ओटीपी अनुरोध करें',
      },
      'auth/network-request-failed': {
        message: 'Network error. Please check your internet connection',
        messageHindi: 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें',
      },
    };

    const errorInfo = errorMessages[error.code] || {
      message: 'An error occurred. Please try again',
      messageHindi: 'एक त्रुटि हुई। कृपया पुन: प्रयास करें',
    };

    return {
      success: false,
      ...errorInfo,
      code: error.code,
      error: error.message,
    };
  }
}

// Export singleton instance
export default new AuthService();
