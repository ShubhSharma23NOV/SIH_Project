/**
 * Icon Component
 * Unified icon system using MaterialCommunityIcons
 * ArogyaJal Design System v2.0.0
 */

import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme';
import { ICONS, ICON_SIZES, ICON_COLORS } from '../constants/icons';

// Merge design system colors with icon colors
const MERGED_ICON_COLORS = {
  ...ICON_COLORS,
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  accent: COLORS.accent,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.danger,
  info: COLORS.info,
  neutral: COLORS.textMedium,
  white: COLORS.white,
};

/**
 * Icon Component
 * @param {string} name - Icon name (semantic or actual MaterialCommunityIcons name)
 * @param {number|string} size - Icon size (number or preset: xs, sm, md, lg, xl, xxl)
 * @param {string} color - Icon color (hex or preset: primary, secondary, success, etc.)
 * @param {object} style - Additional styles
 * 
 * @example
 * // Using semantic name with preset size and color
 * <Icon name="waterSafe" size="lg" color="success" />
 * 
 * @example
 * // Using custom size and hex color
 * <Icon name="emergency" size={32} color="#EF4444" />
 * 
 * @example
 * // Using MaterialCommunityIcons name directly
 * <Icon name="water-check" size="md" color="primary" />
 */
const Icon = ({ name, size = 'md', color = 'neutral', style, ...props }) => {
  // Get icon name from semantic mapping or use as-is
  const iconName = ICONS[name] || name;
  
  // Get size from preset or use as number
  const iconSize = typeof size === 'string' ? ICON_SIZES[size] : size;
  
  // Get color from preset or use as-is
  const iconColor = MERGED_ICON_COLORS[color] || color;
  
  return (
    <MaterialCommunityIcons
      name={iconName}
      size={iconSize}
      color={iconColor}
      style={style}
      {...props}
    />
  );
};

export default Icon;
