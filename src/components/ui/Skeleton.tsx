import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius: radius },
        animStyle,
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  rows?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ rows = 3, style }: SkeletonCardProps) {
  return (
    <Animated.View style={[styles.card, style]}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="100%" height={10} style={{ marginTop: 10 }} />
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <Skeleton key={i} width={`${85 - i * 10}%`} height={10} style={{ marginTop: 8 }} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.slate[200],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
  },
});
