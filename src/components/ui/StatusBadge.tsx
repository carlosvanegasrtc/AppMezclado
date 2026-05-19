import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, EstadoMezclaKey } from '@constants/colors';
import type { EstadoMezcla } from '@/types/mezcla';
import { ESTADO_MEZCLA_LABEL } from '@/types/mezcla';

const ESTADO_TO_KEY: Record<string, EstadoMezclaKey> = {
  PLANIFICADA: 'planificada',
  AUTORIZADA: 'autorizada',
  EN_PROCESO: 'enProceso',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
  INCOMPLETA: 'incompleta',
};

interface StatusBadgeProps {
  estado?: EstadoMezcla | string | null;
  label?: string;
  style?: ViewStyle;
}

export function StatusBadge({ estado, label, style }: StatusBadgeProps) {
  if (!estado) return null;
  const upper = String(estado).toUpperCase();
  const key = ESTADO_TO_KEY[upper];
  const c = key ? Colors.estados[key] : { color: Colors.muted, bg: Colors.slate[100] };
  return (
    <View style={[styles.base, { backgroundColor: c.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: c.color }]} />
      <Text style={[styles.label, { color: c.color }]}>
        {label ?? ESTADO_MEZCLA_LABEL[upper] ?? upper}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
