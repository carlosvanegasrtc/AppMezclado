/**
 * LoginScreen — Login del operario mezclador (modo kiosco).
 *
 * Único campo: ID de empleado.
 * Backend: POST /auth/user/login   body: { loginType: 'PIN', pin: <idEmpleado> }
 */
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Beaker,
  Check,
  Delete,
  Hash,
} from 'lucide-react-native';
import { Colors, Radius, Typography } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import { authService } from '@services/AuthService';
import { useHaptics } from '@hooks/useHaptics';
import { normalizeError } from '@utils/networkError';
import { APP_NAME } from '@constants/app';

const MAX_LEN = 6;

export function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [buf, setBuf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onKey = (k: string) => {
    if (loading) return;
    if (buf.length >= MAX_LEN) return;
    setError(null);
    haptics.selection();
    setBuf(buf + k);
  };

  const onDelete = () => {
    if (loading) return;
    if (!buf) return;
    haptics.selection();
    setError(null);
    setBuf(buf.slice(0, -1));
  };

  const onSubmit = async () => {
    const id = parseInt(buf, 10);
    if (!Number.isFinite(id) || id <= 0) {
      setError('Ingresa tu código de empleado');
      haptics.error();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { payload } = await authService.loginByEmpleadoId(id);
      haptics.success();
      setSession(payload);
    } catch (err) {
      const e = normalizeError(err);
      setError(e.message);
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = buf.length > 0 && !loading;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LinearGradient
        colors={Colors.gradients.header as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 18 }]}
      >
        <Animated.View entering={FadeIn.duration(450)} style={styles.brandWrap}>
          <View style={styles.logoCircle}>
            <Beaker size={32} color={Colors.white} strokeWidth={2.4} />
          </View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.tagline}>Producción de mezclas PVC</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View entering={FadeInDown.duration(450)} style={styles.card}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIcon}>
            <Hash size={20} color={Colors.sky[700]} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>Código de empleado</Text>
            <Text style={styles.stepDesc}>Ingresa tu ID para continuar</Text>
          </View>
        </View>

        <View style={styles.codeBox}>
          <Text style={[styles.codeText, !buf && styles.codeTextEmpty]}>
            {buf || '—'}
          </Text>
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : loading ? (
          <Text style={styles.loadingText}>Validando…</Text>
        ) : (
          <View style={styles.spacer} />
        )}

        <NumPad
          onKey={onKey}
          onDelete={onDelete}
          onConfirm={onSubmit}
          confirmEnabled={canSubmit}
          disabled={loading}
        />

        <Text style={styles.footer}>Rototec S.A. · Mezclado PVC</Text>
      </Animated.View>
    </View>
  );
}

function NumPad({
  onKey,
  onDelete,
  onConfirm,
  confirmEnabled,
  disabled,
}: {
  onKey: (k: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  confirmEnabled: boolean;
  disabled?: boolean;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <View style={styles.numpad}>
      {keys.map((k) => (
        <NumKey key={k} label={k} onPress={() => onKey(k)} disabled={disabled} />
      ))}
      <NumKey
        icon={<Delete size={24} color={Colors.slate[700]} strokeWidth={2.4} />}
        onPress={onDelete}
        disabled={disabled}
      />
      <NumKey label="0" onPress={() => onKey('0')} disabled={disabled} />
      <NumKey
        icon={<Check size={26} color={Colors.white} strokeWidth={2.8} />}
        onPress={onConfirm}
        disabled={!confirmEnabled}
        accent
      />
    </View>
  );
}

function NumKey({
  label,
  icon,
  onPress,
  disabled,
  accent,
}: {
  label?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: accent ? 'rgba(255,255,255,0.18)' : 'rgba(2,132,199,0.15)' }}
      style={({ pressed }) => [
        styles.numKey,
        accent && styles.numKeyAccent,
        pressed && !disabled && (accent ? styles.numKeyAccentPressed : styles.numKeyPressed),
        disabled && styles.numKeyDisabled,
      ]}
    >
      {label !== undefined ? (
        <Text style={[styles.numKeyText, accent && styles.numKeyTextAccent]}>{label}</Text>
      ) : (
        icon
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrap: { alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...Typography.title, color: Colors.white, letterSpacing: 0.4 },
  tagline: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  card: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: -22,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
  },

  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sky[100],
  },
  stepTitle: { fontSize: 17, fontWeight: '800', color: Colors.foreground },
  stepDesc: { fontSize: 12, color: Colors.muted, marginTop: 2 },

  codeBox: {
    backgroundColor: Colors.sky[50],
    borderRadius: Radius.lg,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.sky[100],
    marginTop: 14,
  },
  codeText: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.sky[800],
    letterSpacing: 6,
  },
  codeTextEmpty: { color: Colors.hint, letterSpacing: 0 },

  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 6,
  },
  numKey: {
    width: '31%',
    height: 60,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyAccent: {
    backgroundColor: Colors.sky[600],
    borderColor: Colors.sky[600],
  },
  numKeyPressed: {
    backgroundColor: Colors.sky[50],
    borderColor: Colors.sky[200],
  },
  numKeyAccentPressed: { backgroundColor: Colors.sky[700] },
  numKeyDisabled: { opacity: 0.45 },
  numKeyText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: 0.5,
  },
  numKeyTextAccent: { color: Colors.white },

  spacer: { height: 18 },
  error: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  footer: {
    textAlign: 'center',
    color: Colors.hint,
    fontSize: 11,
    marginTop: 14,
  },
});
