import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Filter state interface
export interface GlobalFilterState {
  state: string | null;
  district: string | null;
  city: string | null;
  village: string | null;
  deviceId: string | null;
  source: 'USER' | 'ROLE_LOCK';
  lastUpdated: number;
}

// User role types
export type UserRole = 'SUPER_ADMIN' | 'STATE_OFFICER' | 'DISTRICT_OFFICER' | 'CITY_OFFICER' | 'VILLAGE_WORKER';

// Role metadata interface
export interface RoleMetadata {
  role: UserRole;
  lockedState?: string;
  lockedDistrict?: string;
  lockedCity?: string;
  lockedVillage?: string;
}

// Context interface
interface GlobalFilterContextType {
  filter: GlobalFilterState;
  roleMetadata: RoleMetadata | null;
  updateFilter: (level: keyof GlobalFilterState, value: string | null) => void;
  resetFilter: () => void;
  getActiveFilterQuery: () => string;
  isFieldLocked: (field: 'state' | 'district' | 'city' | 'village') => boolean;
  setRoleMetadata: (metadata: RoleMetadata) => void;
  getBreadcrumb: () => string[];
}

// Default filter state
const defaultFilter: GlobalFilterState = {
  state: null,
  district: null,
  city: null,
  village: null,
  deviceId: null,
  source: 'USER',
  lastUpdated: Date.now(),
};

// Storage key
const STORAGE_KEY = 'arogyajal_global_filter';
const ROLE_STORAGE_KEY = 'arogyajal_role_metadata';

// Create context
const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

// Provider component
export const GlobalFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filter, setFilter] = useState<GlobalFilterState>(defaultFilter);
  const [roleMetadata, setRoleMetadataState] = useState<RoleMetadata | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedFilter = localStorage.getItem(STORAGE_KEY);
      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);

      if (savedRole) {
        const role: RoleMetadata = JSON.parse(savedRole);
        setRoleMetadataState(role);

        // Apply role-based filter lock
        if (role.role !== 'SUPER_ADMIN') {
          const lockedFilter: GlobalFilterState = {
            state: role.lockedState || null,
            district: role.lockedDistrict || null,
            city: role.lockedCity || null,
            village: role.lockedVillage || null,
            deviceId: null,
            source: 'ROLE_LOCK',
            lastUpdated: Date.now(),
          };
          setFilter(lockedFilter);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lockedFilter));
          return;
        }
      }

      if (savedFilter) {
        const parsed: GlobalFilterState = JSON.parse(savedFilter);
        setFilter(parsed);
      }
    } catch (error) {
      console.error('Error loading filter from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever filter changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
    } catch (error) {
      console.error('Error saving filter to localStorage:', error);
    }
  }, [filter]);

  // Update filter
  const updateFilter = (level: keyof GlobalFilterState, value: string | null) => {
    // Check if field is locked
    if (filter.source === 'ROLE_LOCK') {
      const lockedFields = ['state', 'district', 'city', 'village'];
      if (lockedFields.includes(level)) {
        console.warn(`Cannot update ${level}: field is locked by role`);
        return;
      }
    }

    setFilter((prev) => {
      const newFilter = { ...prev, [level]: value, lastUpdated: Date.now() };

      // Clear dependent fields when parent changes
      if (level === 'state') {
        newFilter.district = null;
        newFilter.city = null;
        newFilter.village = null;
        newFilter.deviceId = null;
      } else if (level === 'district') {
        newFilter.city = null;
        newFilter.village = null;
        newFilter.deviceId = null;
      } else if (level === 'city') {
        newFilter.village = null;
        newFilter.deviceId = null;
      } else if (level === 'village') {
        newFilter.deviceId = null;
      }

      return newFilter;
    });
  };

  // Reset filter (only if not role-locked)
  const resetFilter = () => {
    if (filter.source === 'ROLE_LOCK') {
      console.warn('Cannot reset filter: locked by role');
      return;
    }

    setFilter({
      ...defaultFilter,
      lastUpdated: Date.now(),
    });
  };

  // Get active filter query string
  const getActiveFilterQuery = (): string => {
    const params = new URLSearchParams();

    if (filter.state) params.append('state', filter.state);
    if (filter.district) params.append('district', filter.district);
    if (filter.city) params.append('city', filter.city);
    if (filter.village) params.append('village', filter.village);
    if (filter.deviceId) params.append('deviceId', filter.deviceId);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  // Check if field is locked
  const isFieldLocked = (field: 'state' | 'district' | 'city' | 'village'): boolean => {
    if (!roleMetadata || roleMetadata.role === 'SUPER_ADMIN') {
      return false;
    }

    switch (field) {
      case 'state':
        return !!roleMetadata.lockedState;
      case 'district':
        return !!roleMetadata.lockedDistrict;
      case 'city':
        return !!roleMetadata.lockedCity;
      case 'village':
        return !!roleMetadata.lockedVillage;
      default:
        return false;
    }
  };

  // Set role metadata
  const setRoleMetadata = (metadata: RoleMetadata) => {
    setRoleMetadataState(metadata);
    localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(metadata));

    // Apply role-based filter lock
    if (metadata.role !== 'SUPER_ADMIN') {
      const lockedFilter: GlobalFilterState = {
        state: metadata.lockedState || null,
        district: metadata.lockedDistrict || null,
        city: metadata.lockedCity || null,
        village: metadata.lockedVillage || null,
        deviceId: null,
        source: 'ROLE_LOCK',
        lastUpdated: Date.now(),
      };
      setFilter(lockedFilter);
    }
  };

  // Get breadcrumb array
  const getBreadcrumb = (): string[] => {
    const breadcrumb: string[] = [];
    if (filter.state) breadcrumb.push(filter.state);
    if (filter.district) breadcrumb.push(filter.district);
    if (filter.city) breadcrumb.push(filter.city);
    if (filter.village) breadcrumb.push(filter.village);
    if (filter.deviceId) breadcrumb.push(filter.deviceId);
    return breadcrumb;
  };

  const value: GlobalFilterContextType = {
    filter,
    roleMetadata,
    updateFilter,
    resetFilter,
    getActiveFilterQuery,
    isFieldLocked,
    setRoleMetadata,
    getBreadcrumb,
  };

  return (
    <GlobalFilterContext.Provider value={value}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

// Custom hook to use the context
export const useGlobalFilter = (): GlobalFilterContextType => {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error('useGlobalFilter must be used within GlobalFilterProvider');
  }
  return context;
};

// Utility function to simulate role login (for testing)
export const simulateRoleLogin = (role: UserRole, location?: Partial<RoleMetadata>) => {
  const metadata: RoleMetadata = {
    role,
    lockedState: location?.lockedState,
    lockedDistrict: location?.lockedDistrict,
    lockedCity: location?.lockedCity,
    lockedVillage: location?.lockedVillage,
  };

  localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(metadata));
  window.location.reload(); // Reload to apply role
};

// Utility function to clear role (logout)
export const clearRole = () => {
  localStorage.removeItem(ROLE_STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};
