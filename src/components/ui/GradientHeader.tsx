import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@constants/index';

interface GradientHeaderProps {
  children: React.ReactNode;
  /** Tupla de mínimo 2 colores (Expo lo exige) */
  colors?: readonly [string, string, ...string[]];
  /** Bottom-rounded card sheet effect (default 24) */
  bottomRadius?: number;
  /** Padding inferior extra para "elevar" el contenido sobre el sheet */
  bottomPadding?: number;
  style?: ViewStyle;
}

export function GradientHeader({
  children,
  colors = Colors.gradients.header,
  bottomRadius = 0,
  bottomPadding = 0,
  style,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={colors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradient,
        {
          paddingTop: insets.top + 12,
          paddingBottom: 16 + bottomPadding,
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius,
        },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
  },
});
