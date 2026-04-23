/**
 * ArogyaJal Design System - Complete Theme
 * Government of India Official Design Standards
 * Version: 2.0.0
 */

// Primary Colors
export const COLORS = {
  // Primary Colors
  primary: '#0B4F93',      // Deep Navy Blue - Authority, Trust, Government
  secondary: '#3AAED8',    // Sky Blue - Water, Health, Clarity
  accent: '#14b8a6',       // Teal - Modern, Fresh, Healthcare
  
  // Status Colors
  success: '#10B981',      // Green - Completed, Healthy, Positive
  warning: '#F59E0B',      // Amber - Caution, Pending, Attention
  danger: '#EF4444',       // Red - Critical, Error, Emergency
  info: '#3B82F6',         // Blue - Information, Neutral alerts
  
  // Government Colors (Tricolor)
  saffron: '#FF9933',      // Saffron - Courage, Sacrifice
  white: '#FFFFFF',        // White - Peace, Truth
  green: '#138808',        // Green - Growth, Prosperity
  navy: '#001F3F',         // Navy - Official government documents
  
  // Neutral Colors
  black: '#000000',        // Pure black - Rarely used
  background: '#F8F9FA',   // Light gray - App background
  backgroundDark: '#E5E7EB', // Medium gray - Disabled states
  surface: '#FFFFFF',      // Pure white - Cards, surfaces
  
  // Text Colors
  text: '#1A1A1A',         // Almost black - Primary text
  textDark: '#111827',     // Darker - Headings
  textMedium: '#4B5563',   // Medium gray - Secondary text
  textLight: '#6C757D',    // Light gray - Tertiary text, hints
  
  // Border Colors
  border: '#DEE2E6',       // Light border - Default borders
  borderLight: '#E5E7EB',  // Lighter border - Subtle dividers
  borderDark: '#D1D5DB',   // Darker border - Emphasis
  
  // Gray Scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

// Spacing Scale (4px base unit)
export const SPACING = {
  xs: 4,        // Tight spacing, icon padding
  sm: 8,        // Small gaps, compact layouts
  base: 12,     // Default spacing
  md: 16,       // Standard padding, margins
  lg: 20,       // Section spacing
  xl: 24,       // Large gaps, screen padding
  xxl: 32,      // Extra large spacing, major sections
};

// Border Radius
export const RADIUS = {
  xs: 4,        // Subtle rounding
  sm: 6,        // Small elements
  base: 8,      // Default (buttons, inputs)
  md: 12,       // Cards, containers
  lg: 16,       // Large cards
  xl: 20,       // Hero elements
  round: 999,   // Fully rounded (pills, avatars)
  button: 8,    // Standard button radius
};

// Typography System
export const TYPOGRAPHY = {
  // Font Sizes
  fontSize: {
    xs: 10,      // Tiny labels, legal text
    sm: 12,      // Small labels, captions, hints
    base: 14,    // Body text, default size
    md: 16,      // Subheadings, important text
    lg: 18,      // Section headers
    xl: 20,      // Page titles
    xxl: 24,     // Large titles
    xxxl: 32,    // Hero text, splash screens
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',    // Body text
    medium: '500',     // Emphasized text
    semibold: '600',   // Subheadings
    bold: '700',       // Headings, buttons
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,        // Headings, compact text
    normal: 1.5,       // Body text (default)
    relaxed: 1.75,     // Readable paragraphs
  },
  
  // Preset Styles
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  bodyMedium: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  hint: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
  },
};

// Shadow/Elevation
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Animation Durations
export const ANIMATION = {
  fast: 100,
  normal: 300,
  slow: 600,
};

// Export default theme object
export default {
  COLORS,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  SHADOWS,
  ANIMATION,
};
