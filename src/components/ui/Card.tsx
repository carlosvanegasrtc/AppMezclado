import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { Colors, Radius } from '@constants/index';

export type CardElevation = 'none' | 'soft' | 'medium' | 'hard';

interface CardProps extends ViewProps {
  elevation?: CardElevation;
  radius?: number;
  padded?: boolean;
}

export function Card({
  children,
  elevation = 'soft',
  radius = Radius.lg,
  padded = true,
  style,
  ...rest
}: CardProps) {
  const shadowStyle = SHADOW_STYLES[elevation];
  return (
    <View
      style={[
        styles.base,
        { borderRadius: radius, padding: padded ? 16 : 0 },
        shadowStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
  },
});

const SHADOW_STYLES: Record<CardElevation, ViewStyle> = {
  none: {},
  soft: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
    default: {},
  })!,
  hard: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
    },
    android: { elevation: 10 },
    default: {},
  })!,
};
