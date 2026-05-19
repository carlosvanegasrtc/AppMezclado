import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  ClipboardList,
  History,
  Home as HomeIcon,
  LogOut,
  Settings as SettingsIcon,
  Beaker,
} from 'lucide-react-native';
import { Colors, Radius, APP_NAME, APP_VERSION } from '@constants/index';
import { useAuthStore } from '@store/authStore';

type IconCmp = (props: { size: number; color: string; strokeWidth?: number }) => React.ReactElement;

interface MenuItem {
  key: string;
  label: string;
  icon: IconCmp;
}

const MENU: MenuItem[] = [
  {
    key: 'Home',
    label: 'Inicio',
    icon: ({ size, color, strokeWidth }) => (
      <HomeIcon size={size} color={color} strokeWidth={strokeWidth} />
    ),
  },
  {
    key: 'Ordenes',
    label: 'Mis órdenes',
    icon: ({ size, color, strokeWidth }) => (
      <ClipboardList size={size} color={color} strokeWidth={strokeWidth} />
    ),
  },
  {
    key: 'Historial',
    label: 'Historial',
    icon: ({ size, color, strokeWidth }) => (
      <History size={size} color={color} strokeWidth={strokeWidth} />
    ),
  },
  {
    key: 'Settings',
    label: 'Configuración',
    icon: ({ size, color, strokeWidth }) => (
      <SettingsIcon size={size} color={color} strokeWidth={strokeWidth} />
    ),
  },
];

function getInitials(name?: string | null): string {
  if (!name) return 'OM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'OM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { state, navigation } = props;
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const activeRoute = state.routeNames[state.index];

  const initials = useMemo(() => getInitials(session?.nombreCompleto), [session]);

  const handleLogout = () => {
    navigation.closeDrawer();
    logout();
  };

  return (
    <View style={styles.root}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={Colors.gradients.header as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Beaker size={18} color={Colors.white} strokeWidth={2.4} />
            </View>
            <Text style={styles.brandText}>{APP_NAME}</Text>
          </View>

          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {session?.nombreCompleto ?? 'Inspector'}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>
                {session?.posicion ?? 'Operario mezclador'}
              </Text>
              {session?.ubicacion?.nombre && (
                <View style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {session.ubicacion.nombre}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menú</Text>
          {MENU.map((item) => {
            const active = activeRoute === item.key;
            const color = active ? Colors.sky[700] : Colors.slate[600];
            return (
              <Pressable
                key={item.key}
                onPress={() => navigation.navigate(item.key as never)}
                android_ripple={{ color: 'rgba(2, 132, 199, 0.08)' }}
                style={[styles.itemRow, active && styles.itemRowActive]}
              >
                {active && <View style={styles.activeBar} />}
                <View
                  style={[
                    styles.itemIconWrap,
                    active && styles.itemIconWrapActive,
                  ]}
                >
                  <item.icon size={18} color={color} strokeWidth={2.2} />
                </View>
                <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                  {item.label}
                </Text>
                {active && (
                  <ChevronRight size={16} color={Colors.sky[600]} strokeWidth={2.4} />
                )}
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleLogout}
          android_ripple={{ color: 'rgba(220, 38, 38, 0.1)' }}
          style={styles.logoutBtn}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <LogOut size={18} color={Colors.error} strokeWidth={2.2} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
        <Text style={styles.version}>v{APP_VERSION}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingTop: 0, paddingBottom: 24 },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 18,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: Colors.sky[700],
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  userName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  userRole: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: Colors.overlay.light,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  section: { paddingHorizontal: 12, paddingTop: 18 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate[400],
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 12,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginVertical: 2,
    position: 'relative',
  },
  itemRowActive: {
    backgroundColor: Colors.sky[50],
  },
  activeBar: {
    position: 'absolute',
    left: -12,
    top: 8,
    bottom: 8,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: Colors.sky[600],
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconWrapActive: {
    backgroundColor: Colors.sky[100],
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate[700],
  },
  itemLabelActive: {
    color: Colors.sky[800],
    fontWeight: '800',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.errorLight,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  version: {
    textAlign: 'center',
    color: Colors.hint,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
