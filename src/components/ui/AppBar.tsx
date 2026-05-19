import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Menu } from 'lucide-react-native';
import { Colors, Typography } from '@constants/index';
import { IconDefaults } from '@config/icons';

interface AppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
}

export function AppBar({ title, subtitle, onBack, onMenu, right, transparent }: AppBarProps) {
  const insets = useSafeAreaInsets();
  const bg = transparent ? 'transparent' : Colors.surface;
  const fg = transparent ? Colors.white : Colors.foreground;
  const subFg = transparent ? 'rgba(255,255,255,0.85)' : Colors.muted;

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: bg, paddingTop: insets.top + 8 },
      ]}
    >
      <View style={styles.left}>
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={styles.iconBtn}
            android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}
          >
            <ArrowLeft size={IconDefaults.size.lg} color={fg} strokeWidth={IconDefaults.strokeWidth} />
          </Pressable>
        )}
        {onMenu && !onBack && (
          <Pressable
            onPress={onMenu}
            hitSlop={10}
            style={styles.iconBtn}
            android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}
          >
            <Menu size={IconDefaults.size.lg} color={fg} strokeWidth={IconDefaults.strokeWidth} />
          </Pressable>
        )}
      </View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: fg }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: subFg }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  left: { width: 40, alignItems: 'flex-start' },
  right: { width: 40, alignItems: 'flex-end' },
  iconBtn: { padding: 8, borderRadius: 12 },
  center: { flex: 1, alignItems: 'center' },
  title: {
    ...Typography.heading,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
});
