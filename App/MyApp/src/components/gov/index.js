/**
 * Government UI Components Library
 * ArogyaJal Design System v2.0.0
 * Official Government of India Design Standards
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';
import Icon from '../Icon';

/**
 * GovHeader - Standard government-style header
 * @param {string} title - Main heading
 * @param {string} subtitle - Optional subtitle (usually Hindi)
 * @param {boolean} showBack - Show back button
 * @param {function} onBackPress - Back button handler (deprecated: use onBack)
 * @param {function} onBack - Back button handler
 * @param {component} children - Right-side content
 */
export const GovHeader = ({ title, subtitle, showBack, onBackPress, onBack, children }) => {
  const backHandler = onBack || onBackPress;
  
  return (
    <View style={styles.header}>
      {(showBack || backHandler) && (
        <TouchableOpacity onPress={backHandler} style={styles.backButton}>
          <Icon name="back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {children && <View style={styles.headerRight}>{children}</View>}
    </View>
  );
};

/**
 * GovCard - Container for content sections
 * @param {component} children - Card content
 * @param {object} style - Additional styles
 * @param {string} variant - 'default' | 'bordered' | 'elevated'
 */
export const GovCard = ({ children, style, variant = 'default' }) => {
  const cardStyle = [
    styles.card,
    variant === 'bordered' && styles.cardBordered,
    variant === 'elevated' && styles.cardElevated,
    style,
  ];
  
  return <View style={cardStyle}>{children}</View>;
};

/**
 * GovButton - Primary action buttons
 * @param {string} title - Button text
 * @param {string} subtitle - Optional subtitle text
 * @param {function} onPress - Click handler
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'text'
 * @param {boolean} disabled - Disabled state
 * @param {boolean} loading - Loading state
 * @param {boolean} fullWidth - Full width button
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {string} icon - Optional icon name
 */
export const GovButton = ({ 
  title, 
  subtitle,
  onPress, 
  variant = 'primary', 
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'medium',
  icon,
  style 
}) => {
  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'danger' && styles.buttonDanger,
    variant === 'text' && styles.buttonText,
    size === 'small' && styles.buttonSmall,
    size === 'large' && styles.buttonLarge,
    fullWidth && styles.buttonFullWidth,
    disabled && styles.buttonDisabled,
    icon && styles.buttonWithIcon,
    style,
  ];
  
  const textStyle = [
    styles.buttonTextStyle,
    variant === 'primary' && styles.buttonTextPrimary,
    variant === 'secondary' && styles.buttonTextSecondary,
    variant === 'danger' && styles.buttonTextDanger,
    variant === 'text' && styles.buttonTextText,
    size === 'small' && styles.buttonTextSmall,
  ];

  const subtitleStyle = [
    styles.buttonSubtitle,
    variant === 'text' && styles.buttonSubtitleText,
  ];

  const iconColor = variant === 'secondary' || variant === 'text' ? COLORS.primary : COLORS.white;
  
  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'text' ? COLORS.primary : COLORS.white} />
      ) : (
        <View style={[styles.buttonContent, variant === 'text' && styles.buttonTextContainer]}>
          {icon && <Icon name={icon} size={20} color={iconColor} style={styles.buttonIcon} />}
          <View>
            <Text style={textStyle}>{title}</Text>
            {subtitle && <Text style={subtitleStyle}>{subtitle}</Text>}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * GovStatusBadge - Display status indicators
 * @param {string} status - 'active' | 'success' | 'inactive' | 'error'
 * @param {string} label - Badge text
 * @param {string} size - 'small' | 'medium'
 */
export const GovStatusBadge = ({ status = 'active', label, size = 'medium' }) => {
  const badgeStyle = [
    styles.badge,
    status === 'active' && styles.badgeActive,
    status === 'success' && styles.badgeSuccess,
    status === 'inactive' && styles.badgeInactive,
    status === 'error' && styles.badgeError,
    size === 'small' && styles.badgeSmall,
  ];
  
  return (
    <View style={badgeStyle}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
};

/**
 * GovAlertBanner - Display important messages
 * @param {string} type - 'success' | 'warning' | 'error' | 'info'
 * @param {string} message - Alert text
 * @param {function} onClose - Optional close handler
 */
export const GovAlertBanner = ({ type = 'info', message, onClose }) => {
  const alertStyle = [
    styles.alert,
    type === 'success' && styles.alertSuccess,
    type === 'warning' && styles.alertWarning,
    type === 'error' && styles.alertError,
    type === 'info' && styles.alertInfo,
  ];

  const getIconName = () => {
    switch (type) {
      case 'success': return 'checkCircle';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.danger;
      case 'info': return COLORS.info;
      default: return COLORS.info;
    }
  };
  
  return (
    <View style={alertStyle}>
      <Icon name={getIconName()} size={20} color={getIconColor()} style={styles.alertIconStyle} />
      <Text style={styles.alertText}>{message}</Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.alertClose}>
          <Icon name="close" size={16} color={COLORS.textDark} />
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * GovSectionHeader - Section dividers with titles
 * @param {string} title - Section title
 * @param {string} subtitle - Optional subtitle
 * @param {component} rightComponent - Optional right element
 */
export const GovSectionHeader = ({ title, subtitle, rightComponent }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderContent}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent && <View>{rightComponent}</View>}
  </View>
);

/**
 * GovInputField - Read-only input field display
 * @param {string} label - Field label
 * @param {string} value - Field value
 * @param {object} style - Additional styles
 */
export const GovInputField = ({ label, value, style }) => (
  <View style={[styles.inputContainer, style]}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputField}>
      <Text style={styles.inputValue}>{value || 'Not set'}</Text>
    </View>
  </View>
);

// Styles
const styles = StyleSheet.create({
  // GovHeader Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  backText: {
    fontSize: 20,
    color: COLORS.primary,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginTop: 2,
  },
  headerRight: {
    marginLeft: SPACING.base,
  },
  
  // GovCard Styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardBordered: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cardElevated: {
    ...SHADOWS.lg,
  },
  
  // GovButton Styles
  button: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xs,
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonDanger: {
    backgroundColor: COLORS.danger,
  },
  buttonText: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
    alignItems: 'flex-start',
  },
  buttonSmall: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
  },
  buttonLarge: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    minHeight: 56,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonWithIcon: {
    flexDirection: 'row',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  buttonTextContainer: {
    alignItems: 'flex-start',
  },
  buttonTextStyle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  buttonTextPrimary: {
    color: COLORS.white,
  },
  buttonTextSecondary: {
    color: COLORS.primary,
  },
  buttonTextDanger: {
    color: COLORS.white,
  },
  buttonTextText: {
    color: COLORS.textDark,
  },
  buttonTextSmall: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  buttonSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
    marginTop: 2,
  },
  buttonSubtitleText: {
    color: COLORS.textLight,
  },
  
  // GovStatusBadge Styles
  badge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.round,
    alignSelf: 'flex-start',
  },
  badgeActive: {
    backgroundColor: '#D1FAE5',
  },
  badgeSuccess: {
    backgroundColor: COLORS.success + '20',
  },
  badgeInactive: {
    backgroundColor: '#FEF3C7',
  },
  badgeError: {
    backgroundColor: '#FEE2E2',
  },
  badgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  
  // GovAlertBanner Styles
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADIUS.base,
    marginBottom: SPACING.md,
  },
  alertSuccess: {
    backgroundColor: '#D1FAE5',
  },
  alertWarning: {
    backgroundColor: '#FEF3C7',
  },
  alertError: {
    backgroundColor: '#FEE2E2',
  },
  alertInfo: {
    backgroundColor: '#DBEAFE',
  },
  alertIconStyle: {
    marginRight: SPACING.base,
  },
  alertText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
  },
  alertClose: {
    padding: SPACING.xs,
  },
  alertCloseText: {
    fontSize: 18,
    color: COLORS.textMedium,
  },
  
  // GovSectionHeader Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginTop: 2,
  },
  
  // GovInputField Styles
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  inputField: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.base,
  },
  inputValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
});
