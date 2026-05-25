import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LogOut, Wifi, WifiOff } from 'lucide-react-native';
import { GradientHeader } from '@components/ui/GradientHeader';
import { AppBar } from '@components/ui/AppBar';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { Colors, APP_NAME, APP_VERSION } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

export function SettingsScreen() {
  const navigation = useNavigation();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const net = useNetworkStatus();

  return (
    <Screen edges={[]} bg={Colors.slate[50]}>
      <GradientHeader bottomRadius={24}>
        <AppBar
          title="Configuración"
          transparent
          onMenu={() => (navigation as any).openDrawer?.()}
        />
      </GradientHeader>

      <View style={styles.body}>
        <Card>
          <Text style={styles.label}>Sesión</Text>
          <Text style={styles.value}>{session?.nombreCompleto ?? '—'}</Text>
          <Text style={styles.sub}>{session?.posicion ?? `Posición #${session?.idPosicion ?? '—'}`}</Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            {net.isConnected ? (
              <Wifi size={18} color={Colors.success} strokeWidth={2.2} />
            ) : (
              <WifiOff size={18} color={Colors.error} strokeWidth={2.2} />
            )}
            <Text style={styles.label}>Conexión</Text>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    net.isConnected === null
                      ? Colors.hint
                      : net.isConnected
                      ? Colors.success
                      : Colors.error,
                },
              ]}
            />
          </View>
          <Text style={styles.value}>
            {net.isConnected === null
              ? 'Detectando…'
              : net.isConnected
              ? `Conectado (${net.type ?? 'desconocido'})`
              : 'Sin conexión'}
          </Text>
        </Card>

        <Pressable onPress={logout} style={styles.logoutBtn}>
          <LogOut size={18} color={Colors.error} strokeWidth={2.2} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>

        <Text style={styles.versionText}>
          {APP_NAME} · v{APP_VERSION}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, flex: 1 },
  card: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  label: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flex: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  value: { fontSize: 14, color: Colors.foreground, fontWeight: '700' },
  sub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.errorLight,
    marginTop: 8,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.hint,
    fontSize: 11,
    marginTop: 'auto',
    paddingTop: 16,
  },
});
