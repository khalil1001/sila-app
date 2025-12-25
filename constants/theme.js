import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive breakpoints
const isWeb = Platform.OS === 'web';
const isLargeScreen = SCREEN_WIDTH > 768;

// Export breakpoints
export { isLargeScreen, isWeb };

// Brand Colors
const BRAND_COLORS = {
  // Primary brand colors
  PRIMARY_BLUE: '#1e3a8a',
  PRIMARY_RED: '#dc2626',

  // Gradient colors for backgrounds
  GRADIENT_START: '#2d4f8eff',
  GRADIENT_END: '#fcd2d8ff',

  // Background colors
  FEATURE_BG: '#ffffff',
  FEATURE_ICON_BG: '#d9f0ff',
  BACKGROUND_LIGHT: '#f8f9fa',

  // Text colors
  TEXT_DARK: '#1a1a2e',
  TEXT_SECONDARY: '#6c757d',
  TEXT_WHITE: '#ffffff',

  // Border colors
  BORDER_LIGHT: '#e0e0e0',
  BORDER_MEDIUM: '#dee2e6',

  // Status colors
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#dc2626',
  INFO: '#3b82f6',
};

// Typography
const TYPOGRAPHY = {
  // Font weights
  LIGHT: '300',
  REGULAR: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700',
  EXTRABOLD: '800',
  BLACK: '900',

  // Font sizes (responsive)
  TITLE_LARGE: isLargeScreen ? 40 : 32,
  TITLE_MEDIUM: isLargeScreen ? 30 : 22,
  TITLE_SMALL: isLargeScreen ? 28 : 22,
  HEADING_LARGE: isLargeScreen ? 22 : 18,
  HEADING_MEDIUM: isLargeScreen ? 18 : 16,
  BODY_LARGE: isLargeScreen ? 16 : 14,
  BODY_MEDIUM: isLargeScreen ? 14 : 13,
  BODY_SMALL: isLargeScreen ? 13 : 12,
  CAPTION: isLargeScreen ? 12 : 11,
};

// Spacing (responsive)
const SPACING = {
  XXS: 4,
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
  XXXL: 40,
  SCREEN_PADDING: isLargeScreen ? 40 : 20,
};

// Border Radius
const RADIUS = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  ROUND: 9999,
};

// Shadows
const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Common button styles
const BUTTON_STYLES = {
  primary: {
    borderRadius: RADIUS.LG,
    padding: isLargeScreen ? 30 : 24,
    alignItems: 'center',
    ...SHADOWS.LARGE,
  },
  secondary: {
    borderRadius: RADIUS.LG,
    padding: isLargeScreen ? 16 : 12,
    alignItems: 'center',
    ...SHADOWS.MEDIUM,
  },
};

// Common input styles
const INPUT_STYLES = {
  container: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    padding: isLargeScreen ? 16 : 12,
    fontSize: TYPOGRAPHY.BODY_LARGE,
  },
};

// Export all constants
export { BRAND_COLORS, BUTTON_STYLES, INPUT_STYLES, RADIUS, SHADOWS, SPACING, TYPOGRAPHY };

