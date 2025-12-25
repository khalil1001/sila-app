import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive breakpoints - multiple for better granularity
const isWeb = Platform.OS === 'web';
const isXSmallScreen = SCREEN_WIDTH < 375; // Very small phones (iPhone SE 1st gen, etc.)
const isSmallScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 480; // Standard phones
const isMediumScreen = SCREEN_WIDTH >= 480 && SCREEN_WIDTH < 768; // Large phones / small tablets
const isLargeScreen = SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024; // Tablets
const isXLargeScreen = SCREEN_WIDTH >= 1024; // Large tablets / desktops

// Helper function to get responsive value based on screen size
const getResponsiveValue = (xsmall, small, medium, large, xlarge) => {
  if (isXSmallScreen) return xsmall;
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  if (isLargeScreen) return large;
  return xlarge;
};

// Export breakpoints
export {
  isLargeScreen,
  isWeb,
  isXSmallScreen,
  isSmallScreen,
  isMediumScreen,
  isXLargeScreen,
  getResponsiveValue,
  SCREEN_WIDTH,
  SCREEN_HEIGHT
};

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

// Typography with graduated responsive scaling
const TYPOGRAPHY = {
  // Font weights
  LIGHT: '300',
  REGULAR: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700',
  EXTRABOLD: '800',
  BLACK: '900',

  // Font sizes (responsive with 5 breakpoints)
  TITLE_LARGE: getResponsiveValue(28, 32, 36, 40, 44),
  TITLE_MEDIUM: getResponsiveValue(20, 22, 26, 30, 32),
  TITLE_SMALL: getResponsiveValue(18, 22, 24, 28, 30),
  HEADING_LARGE: getResponsiveValue(16, 18, 20, 22, 24),
  HEADING_MEDIUM: getResponsiveValue(14, 16, 17, 18, 20),
  BODY_LARGE: getResponsiveValue(13, 14, 15, 16, 17),
  BODY_MEDIUM: getResponsiveValue(12, 13, 13, 14, 15),
  BODY_SMALL: getResponsiveValue(11, 12, 12, 13, 14),
  CAPTION: getResponsiveValue(10, 11, 11, 12, 13),
};

// Spacing (responsive with better gradation)
const SPACING = {
  XXS: 4,
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
  XXXL: 40,
  SCREEN_PADDING: getResponsiveValue(16, 20, 24, 32, 40),
  CARD_PADDING: getResponsiveValue(12, 16, 18, 20, 24),
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

// Common button styles with responsive sizing
const BUTTON_STYLES = {
  primary: {
    borderRadius: RADIUS.LG,
    paddingVertical: getResponsiveValue(14, 16, 18, 20, 22),
    paddingHorizontal: getResponsiveValue(20, 24, 28, 30, 32),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Minimum touch target
    ...SHADOWS.LARGE,
  },
  secondary: {
    borderRadius: RADIUS.LG,
    paddingVertical: getResponsiveValue(10, 12, 14, 16, 18),
    paddingHorizontal: getResponsiveValue(16, 20, 22, 24, 26),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target
    ...SHADOWS.MEDIUM,
  },
};

// Common input styles with responsive sizing
const INPUT_STYLES = {
  container: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    paddingVertical: getResponsiveValue(10, 12, 14, 16, 16),
    paddingHorizontal: getResponsiveValue(12, 14, 16, 18, 20),
    fontSize: TYPOGRAPHY.BODY_LARGE,
    minHeight: 48, // Minimum touch target
  },
};

// Modal/Container responsive max widths
const CONTAINER_WIDTHS = {
  FORM_MAX: getResponsiveValue(
    SCREEN_WIDTH * 0.95, // XSmall: 95% width
    SCREEN_WIDTH * 0.9,  // Small: 90% width
    500,                 // Medium: fixed 500px
    600,                 // Large: fixed 600px
    700                  // XLarge: fixed 700px
  ),
  MODAL_MAX: getResponsiveValue(
    SCREEN_WIDTH * 0.95, // XSmall: 95% width
    SCREEN_WIDTH * 0.9,  // Small: 90% width
    SCREEN_WIDTH * 0.85, // Medium: 85% width
    800,                 // Large: fixed 800px
    900                  // XLarge: fixed 900px
  ),
  CONTENT_MAX: 1200, // Maximum content width for large screens
};

// Export all constants
export {
  BRAND_COLORS,
  BUTTON_STYLES,
  INPUT_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  CONTAINER_WIDTHS
};
