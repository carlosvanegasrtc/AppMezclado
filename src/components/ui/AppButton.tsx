import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Typography } from '@constants/index';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type AppButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const VARIANT_STYLES: Record<AppButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: Colors.sky[600], fg: Colors.white },
  secondary: { bg: Colors.slate[100], fg: Colors.slate[900], border: Colors.slate[200] },
  ghost: { bg: 'transparent', fg: Colors.sky[700] },
  danger: { bg: Colors.error, fg: Colors.white },
  success: { bg: Colors.success, fg: Colors.white },
};

const SIZE_STYLES: Record<AppButtonSize, { padV: number; padH: number; fs: number; minH: number }> = {
  sm: { padV: 8, padH: 14, fs: 13, minH: 36 },
  md: { padV: 12, padH: 18, fs: 15, minH: 48 },
  lg: { padV: 16, padH: 22, fs: 17, minH: 56 },
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  testID,
}: AppButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    backgroundColor: v.bg,
    borderColor: v.border ?? 'transparent',
    borderWidth: v.border ? 1 : 0,
    paddingVertical: s.padV,
    paddingHorizontal: s.padH,
    minHeight: s.minH,
    borderRadius: Radius.md,
    opacity: isDisabled ? 0.55 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  const textStyle: TextStyle = {
    color: v.fg,
    fontSize: s.fs,
    fontWeight: Typography.button.fontWeight,
    letterSpacing: 0.2,
  };

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
      {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconLeft: { marginRight: 4 },
  iconRight: { marginLeft: 4 },
});
