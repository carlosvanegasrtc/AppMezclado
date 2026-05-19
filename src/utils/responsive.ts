import { useEffect, useState } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

export const CONTENT_MAX_WIDTH = 1280;
export const SIDEBAR_WIDTH = 280;

export interface ResponsiveInfo {
  width: number;
  height: number;
  isWeb: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Padding horizontal recomendado por breakpoint */
  hPad: number;
}

export function getResponsiveInfo(dim?: ScaledSize): ResponsiveInfo {
  const { width, height } = dim ?? Dimensions.get('window');
  const isWeb = Platform.OS === 'web';

  // En nativo siempre mobile, sin importar ancho
  const isTablet = isWeb && width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = isWeb && width >= BREAKPOINTS.desktop;

  const hPad = isDesktop
    ? Math.max(24, width * 0.035)
    : isTablet
    ? 20
    : 16;

  return { width, height, isWeb, isTablet, isDesktop, hPad };
}

export function useResponsive(): ResponsiveInfo {
  const [info, setInfo] = useState<ResponsiveInfo>(() => getResponsiveInfo());

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setInfo(getResponsiveInfo(window));
    });
    return () => sub.remove();
  }, []);

  return info;
}
