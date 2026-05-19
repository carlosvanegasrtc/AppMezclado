import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ClipboardList,
  History,
  LogOut,
  Menu,
  Package,
  ScanLine,
} from 'lucide-react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { GradientHeader } from '@components/ui/GradientHeader';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { Colors, Radius } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import { useOrdenesPorEmpleado } from '@hooks/useMezcla';
import type { AppStackParamList, DrawerParamList } from '@navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconDefaults } from '@config/icons';

type DrawerNav = DrawerNavigationProp<DrawerParamList>;
type StackNav = NativeStackNavigationProp<AppStackParamList>;

export function HomeScreen() {
  const drawerNav = useNavigation<DrawerNav>();
  const stackNav = drawerNav.getParent<StackNav>();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);

  const { data: ordenes } = useOrdenesPorEmpleado(session?.idEmpleado);

  const ordenesActivas = (ordenes ?? []).filter((o) =>
    ['AUTORIZADA', 'EN_PROCESO'].includes(String(o.Estado).toUpperCase())
  );
  const sacosTotales = (ordenes ?? []).reduce((acc, o) => acc + (Number(o.TotalSacos) || 0), 0);

  return (
    <Screen edges={[]} bg={Colors.slate[50]}>
      <GradientHeader bottomRadius={24}>
        <View style={styles.heroRow}>
          <Pressable
            onPress={() => drawerNav.openDrawer()}
            hitSlop={10}
            android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: true }}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú"
            style={styles.menuBtn}
          >
            <Menu size={22} color={Colors.white} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.name} numberOfLines={1}>
              {session?.nombreCompleto ?? 'Mezclador'}
            </Text>
          </View>
          <Pressable
            onPress={logout}
            hitSlop={10}
            android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: true }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={styles.menuBtn}
          >
            <LogOut size={18} color={Colors.white} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{ordenesActivas.length}</Text>
            <Text style={styles.statLabel}>Órdenes activas</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{sacosTotales}</Text>
            <Text style={styles.statLabel}>Sacos hoy</Text>
          </View>
        </View>
      </GradientHeader>

      <View style={styles.body}>
        <Animated.View entering={FadeInDown.delay(40).duration(380)}>
          <ActionCard
            title="Mis órdenes"
            description="Ver órdenes asignadas a este turno"
            icon={<ClipboardList size={IconDefaults.size.lg} color={Colors.sky[700]} strokeWidth={2.2} />}
            onPress={() => drawerNav.navigate('Ordenes')}
            highlight
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(380)}>
          <ActionCard
            title="Escanear saco"
            description="Lee un código de barras para registrar peso"
            icon={<ScanLine size={IconDefaults.size.lg} color={Colors.sky[700]} strokeWidth={2.2} />}
            onPress={() => stackNav?.navigate('Escaner', { mode: 'BARCODE_GENERIC' })}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(380)}>
          <ActionCard
            title="Sacos producidos"
            description="Resumen de tus sacos del turno"
            icon={<Package size={IconDefaults.size.lg} color={Colors.amber[600]} strokeWidth={2.2} />}
            onPress={() => drawerNav.navigate('Ordenes')}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(380)}>
          <ActionCard
            title="Historial e incidencias"
            description="Cumplimiento y eventos reportados"
            icon={<History size={IconDefaults.size.lg} color={Colors.slate[600]} strokeWidth={2.2} />}
            onPress={() => drawerNav.navigate('Historial')}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress?: () => void;
  highlight?: boolean;
}

function ActionCard({ title, description, icon, onPress, highlight }: ActionCardProps) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.05)' }}>
      <Card
        style={[styles.actionCard, highlight && styles.actionCardHighlight]}
        radius={Radius.lg}
      >
        <View style={[styles.actionIconWrap, highlight && styles.actionIconWrapHighlight]}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, highlight && { color: Colors.sky[800] }]}>
            {title}
          </Text>
          <Text style={styles.actionDesc}>{description}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.overlay.light,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  name: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  statsRow: {
    marginTop: 20,
    flexDirection: 'row',
    backgroundColor: Colors.overlay.light,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  divider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.18)' },
  body: { padding: 16, gap: 12, marginTop: -8 },
  actionCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  actionCardHighlight: {
    backgroundColor: Colors.sky[50],
    borderWidth: 1,
    borderColor: Colors.sky[200],
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapHighlight: {
    backgroundColor: Colors.sky[100],
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.foreground,
  },
  actionDesc: { fontSize: 12, color: Colors.muted, marginTop: 2, lineHeight: 16 },
});
