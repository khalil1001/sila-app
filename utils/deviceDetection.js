/**
 * Utility functions for device detection (web platform)
 */

/**
 * Détecte si l'utilisateur est sur un appareil mobile
 * @returns {boolean} true si mobile, false si desktop
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;

  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  // Check both user agent and screen width
  return mobileRegex.test(userAgent) || window.innerWidth < 768;
};

/**
 * Détecte si l'app PWA est déjà installée
 * @returns {boolean} true si installée, false sinon
 */
export const isPWAInstalled = () => {
  if (typeof window === 'undefined') return false;

  // Check if running in standalone mode (installed PWA)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true || // iOS Safari
    document.referrer.includes('android-app://') // Android TWA
  );
};

/**
 * Détecte si le navigateur supporte les PWAs
 * @returns {boolean} true si supporté
 */
export const isPWASupported = () => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator;
};

/**
 * Obtient le type d'appareil détaillé
 * @returns {string} 'desktop', 'tablet', 'mobile'
 */
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  const userAgent = navigator.userAgent || '';

  if (/iPad|Android(?!.*Mobile)/i.test(userAgent) || (width >= 768 && width < 1024)) {
    return 'tablet';
  }

  if (isMobileDevice()) {
    return 'mobile';
  }

  return 'desktop';
};
