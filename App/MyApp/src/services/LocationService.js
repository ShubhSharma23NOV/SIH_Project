/**
 * Centralized Location Service
 * Requests permission once and provides location throughout the app
 */

import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Geolocation;
try {
  Geolocation = require('react-native-geolocation-service').default;
} catch (error) {
  console.warn('Geolocation service not available, using mock');
  // Mock implementation for development
  Geolocation = {
    getCurrentPosition: (success, error, options) => {
      console.log('Using mock location');
      setTimeout(() => {
        success({
          coords: {
            latitude: 26.8467,
            longitude: 80.9462,
            accuracy: 10,
            altitude: 0,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        });
      }, 100);
    },
    watchPosition: (success, error, options) => {
      return setInterval(() => {
        success({
          coords: {
            latitude: 26.8467,
            longitude: 80.9462,
            accuracy: 10,
            altitude: 0,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        });
      }, 10000);
    },
    clearWatch: (watchId) => {
      clearInterval(watchId);
    },
    stopObserving: () => {},
  };
}

const LOCATION_CACHE_KEY = '@location_cache';
const PERMISSION_CACHE_KEY = '@location_permission';

class LocationService {
  currentLocation = null;
  permissionGranted = null;
  listeners = [];

  /**
   * Initialize service - check cached permission and location
   */
  async init() {
    try {
      // Check cached permission
      const cachedPermission = await AsyncStorage.getItem(PERMISSION_CACHE_KEY);
      if (cachedPermission === 'granted') {
        this.permissionGranted = true;
      }

      // Load cached location
      const cachedLocation = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedLocation) {
        this.currentLocation = JSON.parse(cachedLocation);
        console.log('📍 Loaded cached location:', this.currentLocation);
      }
    } catch (error) {
      console.error('Error initializing LocationService:', error);
    }
  }

  /**
   * Request location permission (only once)
   */
  async requestPermission() {
    // Return cached permission if available
    if (this.permissionGranted !== null) {
      return this.permissionGranted;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message: 'ArogyaJal needs access to your location to map water sources and health data in your area.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          }
        );
        
        this.permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        
        // Cache permission result
        await AsyncStorage.setItem(
          PERMISSION_CACHE_KEY, 
          this.permissionGranted ? 'granted' : 'denied'
        );
        
        return this.permissionGranted;
      } catch (err) {
        console.warn('Permission error:', err);
        this.permissionGranted = false;
        return false;
      }
    }
    
    // iOS - assume granted (handle in Info.plist)
    this.permissionGranted = true;
    await AsyncStorage.setItem(PERMISSION_CACHE_KEY, 'granted');
    return true;
  }

  /**
   * Get current GPS location
   * Returns cached location if available and recent (< 5 minutes old)
   * @param {Object} options - { accuracy: 'high'|'low', timeout: number, forceRefresh: boolean }
   */
  async getLocation(options = {}) {
    const { accuracy = 'high', timeout = 15000, forceRefresh = false } = options;
    
    // Return cached location if available and recent
    if (!forceRefresh && this.currentLocation) {
      const age = Date.now() - this.currentLocation.timestamp;
      if (age < 5 * 60 * 1000) { // 5 minutes
        console.log('📍 Using cached location (age:', Math.round(age / 1000), 'seconds)');
        return this.currentLocation;
      }
    }

    // Check permission first
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('⚠️ Location permission denied, using fallback');
      return this.getFallbackLocation();
    }

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
              source: 'gps',
            };
            
            // Cache location
            this.currentLocation = location;
            await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
            
            // Notify listeners
            this.notifyListeners(location);
            
            console.log('📍 Got GPS location:', location.latitude, location.longitude);
            resolve(location);
          } catch (error) {
            console.error('Error processing location:', error);
            resolve(this.getFallbackLocation());
          }
        },
        (error) => {
          console.error('GPS error:', error.message);
          resolve(this.getFallbackLocation());
        },
        {
          enableHighAccuracy: accuracy === 'high',
          timeout: timeout,
          maximumAge: forceRefresh ? 0 : 5 * 60 * 1000, // 5 minutes
        }
      );
    });
  }

  /**
   * Get fallback location (cached or default)
   */
  getFallbackLocation() {
    if (this.currentLocation) {
      return { ...this.currentLocation, source: 'cached' };
    }
    
    return {
      latitude: 26.8467,
      longitude: 80.9462,
      accuracy: null,
      timestamp: Date.now(),
      source: 'fallback',
    };
  }

  /**
   * Get current GPS location (legacy method)
   */
  async getCurrentLocation() {
    return this.getLocation();
  }

  /**
   * Add location change listener
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of location change
   */
  notifyListeners(location) {
    this.listeners.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location listener:', error);
      }
    });
  }

  /**
   * Clear cached location and permission
   */
  async clearCache() {
    try {
      await AsyncStorage.multiRemove([LOCATION_CACHE_KEY, PERMISSION_CACHE_KEY]);
      this.currentLocation = null;
      this.permissionGranted = null;
      console.log('🗑️ Location cache cleared');
    } catch (error) {
      console.error('Error clearing location cache:', error);
    }
  }

  /**
   * Check if location permission is granted
   */
  hasPermission() {
    return this.permissionGranted === true;
  }

  /**
   * Check current permission status without requesting
   */
  async checkPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        this.permissionGranted = granted;
        return granted;
      } catch (error) {
        console.error('Error checking permission:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Force re-request permission (useful if user denied initially)
   */
  async requestPermissionAgain() {
    this.permissionGranted = null;
    await AsyncStorage.removeItem(PERMISSION_CACHE_KEY);
    return await this.requestPermission();
  }

  /**
   * Get cached location without requesting new one
   */
  getCachedLocation() {
    return this.currentLocation;
  }

  /**
   * Watch location changes (continuous tracking)
   * Returns watchId that can be used to clear the watch
   */
  watchLocation(callback, options = {}) {
    const { accuracy = 'high', distanceFilter = 10 } = options;
    
    const watchId = Geolocation.watchPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          source: 'gps',
        };
        
        // Update cached location
        this.currentLocation = location;
        await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
        
        // Notify callback
        callback(location);
        
        // Notify all listeners
        this.notifyListeners(location);
      },
      (error) => {
        console.error('Watch location error:', error.message);
        callback(null, error);
      },
      {
        enableHighAccuracy: accuracy === 'high',
        distanceFilter: distanceFilter,
        interval: 10000, // Update every 10 seconds
        fastestInterval: 5000, // Fastest update: 5 seconds
      }
    );
    
    return watchId;
  }

  /**
   * Stop watching location changes
   */
  clearWatch(watchId) {
    Geolocation.clearWatch(watchId);
  }

  /**
   * Stop all location tracking
   */
  stopLocationUpdates() {
    Geolocation.stopObserving();
  }
}

export default new LocationService();
