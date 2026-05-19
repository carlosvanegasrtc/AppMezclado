/**
 * OrdenesScreen — lista de órdenes de mezcla asignadas al operario.
 * Drawer screen; pull-to-refresh.
 */
import React, { useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight, ClipboardList, Menu } from 'lucide-react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { GradientHeader } from '@components/ui/GradientHeader';
import { EmptyState } from '@components/ui/EmptyState';
import { StatusBadge } from '@components/ui/StatusBadge';
import { Skeleton } from '@components/ui/Skeleton';
import { Colors, Radius } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import { useOrdenesPorEmpleado } from '@hooks/useMezcla';
import type { AppStackParamList, DrawerParamList } from '@navigation/types';
import type { ResumenOrdenMezcla } from '@/types/mezcla';

type DrawerNav = DrawerNavigationProp<DrawerParamList>;
type StackNav = NativeStackNavigationProp<AppStackParamList>;

export function OrdenesScreen() {
  const drawerNav = useNavigation<DrawerNav>();
  const stackNav = drawerNav.getParent<StackNav>();
  const session = useAuthStore((s) => s.session);
  const { data, isLoading, isRefetching, refetch } = useOrdenesPorEmpleado(session?.idEmpleado);

  const onRefresh = useCallback(() => refetch(), [refetch]);

  return (
    <Screen edges={[]} bg={Colors.slate[50]}>
      <GradientHeader bottomRadius={20}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => drawerNav.openDrawer()}
            hitSlop={10}
            android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: true }}
            style={styles.menuBtn}
          >
            <Menu size={22} color={Colors.white} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mis órdenes</Text>
            <Text style={styles.subtitle}>
              {data ? `${data.length} ordenes asignadas` : 'Cargando…'}
            </Text>
          </View>
        </View>
      </GradientHeader>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.sky[600]}
            colors={[Colors.sky[600]]}
          />
        }
      >
        {isLoading && !data ? (
          <>
            <Skeleton height={92} style={{ borderRadius: Radius.lg }} />
            <Skeleton height={92} style={{ borderRadius: Radius.lg, marginTop: 12 }} />
            <Skeleton height={92} style={{ borderRadius: Radius.lg, marginTop: 12 }} />
          </>
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Sin órdenes asignadas"
            description="No tienes órdenes de mezcla activas para este turno. Vuelve a intentar más tarde."
            icon={<ClipboardList size={36} color={Colors.muted} strokeWidth={2} />}
          />
        ) : (
          data.map((o, i) => (
            <Animated.View
              key={o.IdOrdenProduccionMZCL}
              entering={FadeInDown.delay(60 * i).duration(380)}
            >
              <OrdenItem
                orden={o}
                onPress={() =>
                  stackNav?.navigate('OrdenDetalle', {
                    idOrdenProduccionMZCL: o.IdOrdenProduccionMZCL,
                  })
                }
              />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function OrdenItem({ orden, onPress }: { orden: ResumenOrdenMezcla; onPress: () => void }) {
  const cumpl = Math.round(Number(orden.PorcentajeCumplimiento) || 0);
  return (
    <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.05)' }}>
      <Card style={styles.itemCard} radius={Radius.lg}>
        <View style={{ flex: 1 }}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemNumero} numberOfLines={1}>
              {orden.NumeroOrdenMezcla}
            </Text>
            <StatusBadge estado={orden.Estado as any} />
          </View>
          <Text style={styles.itemFormula} numberOfLines={1}>
            {orden.CodigoFormula}
            {orden.DescripcionFormula ? ` · ${orden.DescripcionFormula}` : ''}
          </Text>
          <View style={styles.metricsRow}>
            <Metric label="Plan" value={`${(Number(orden.KgPlanificados) || 0).toFixed(0)} kg`} />
            <Metric label="Producido" value={`${(Number(orden.KgProducidos) || 0).toFixed(0)} kg`} />
            <Metric label="Sacos" value={String(orden.TotalSacos ?? 0)} />
            <Metric
              label="Cumpl."
              value={`${cumpl}%`}
              accent={cumpl >= 100 ? Colors.success : Colors.warning}
            />
          </View>
        </View>
        <ChevronRight size={20} color={Colors.muted} strokeWidth={2.2} />
      </Card>
    </Pressable>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricVal, accent && { color: accent }]}>{value}</Text>
      <Text style={styles.metricLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  title: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  body: { padding: 16, gap: 12, marginTop: -8, paddingBottom: 32 },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemNumero: { fontSize: 14, fontWeight: '900', color: Colors.foreground, letterSpacing: 0.4 },
  itemFormula: { fontSize: 12, color: Colors.muted, marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: 18, marginTop: 10 },
  metric: { alignItems: 'flex-start' },
  metricVal: { fontSize: 14, fontWeight: '800', color: Colors.foreground },
  metricLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
