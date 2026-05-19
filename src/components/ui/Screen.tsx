/**
 * Wrapper estándar de pantalla.
 * - SafeArea
 * - background consistente
 * - opcional ScrollView interno
 */
import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@constants/colors';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  /** Si quieres un padding horizontal por defecto */
  padded?: boolean;
  bg?: string;
  edges?: ('top' | 'bottom')[];
  style?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  padded = false,
  bg = Colors.slate[50],
  edges = ['bottom'],
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const safeStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
  };

  if (scroll) {
    return (
      <View style={[styles.root, { backgroundColor: bg }, safeStyle, style]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            padded && styles.padded,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: bg },
        safeStyle,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  padded: {
    paddingHorizontal: 16,
  },
});
