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
import { ArrowLeft, ChevronRight, ClipboardList, FlaskConical, RotateCcw } from 'lucide-react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { GradientHeader } from '@components/ui/GradientHeader';
import { EmptyState } from '@components/ui/EmptyState';
import { StatusBadge } from '@components/ui/StatusBadge';
import { Skeleton } from '@components/ui/Skeleton';
import { AppButton } from '@components/ui/AppButton';
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
            onPress={() => drawerNav.navigate('Home')}
            hitSlop={10}
            android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: true }}
            style={styles.backBtn}
          >
            <ArrowLeft size={22} color={Colors.white} strokeWidth={2.4} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mis órdenes</Text>
            <Text style={styles.subtitle}>
              {isRefetching
                ? 'Actualizando…'
                : data
                ? `${data.length} orden${data.length !== 1 ? 'es' : ''} asignada${data.length !== 1 ? 's' : ''}`
                : 'Cargando…'}
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
            <Skeleton height={110} style={{ borderRadius: Radius.lg }} />
            <Skeleton height={110} style={{ borderRadius: Radius.lg, marginTop: 12 }} />
            <Skeleton height={110} style={{ borderRadius: Radius.lg, marginTop: 12 }} />
          </>
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Sin órdenes asignadas"
            description="No tienes órdenes de mezcla activas para este turno."
            icon={<ClipboardList size={36} color={Colors.muted} strokeWidth={2} />}
            action={
              <AppButton
                label="Actualizar"
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw size={15} color={Colors.slate[700]} strokeWidth={2.2} />}
                onPress={onRefresh}
                loading={isRefetching}
              />
            }
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
  const cumplColor = cumpl >= 100 ? Colors.success : cumpl >= 60 ? Colors.warning : Colors.error;
  const kgPlan = (Number(orden.KgPlanificados) || 0).toFixed(1);
  const kgProd = (Number(orden.KgProducidos) || 0).toFixed(1);

  return (
    <Pressable onPress={onPress} android_ripple={{ color: 'rgba(2,132,199,0.07)' }}>
      <Card style={styles.itemCard} radius={Radius.lg}>

        {/* ── Encabezado: fórmula protagonista ── */}
        <View style={styles.formulaHeader}>
          <View style={styles.formulaIconWrap}>
            <FlaskConical size={20} color={Colors.sky[600]} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.formulaCodigo} numberOfLines={1}>
              {orden.CodigoFormula}
            </Text>
            {!!orden.DescripcionFormula && (
              <Text style={styles.formulaDesc} numberOfLines={1}>
                {orden.DescripcionFormula}
              </Text>
            )}
          </View>
          <ChevronRight size={18} color={Colors.muted} strokeWidth={2.2} />
        </View>

        {/* ── Orden + estado (secundario) ── */}
        <View style={styles.ordenRow}>
          <Text style={styles.ordenNumero}>{orden.NumeroOrdenMezcla}</Text>
          <StatusBadge estado={orden.Estado as any} />
        </View>

        {/* ── Kg planificados — dato principal ── */}
        <View style={styles.planBox}>
          <View style={styles.planMain}>
            <Text style={styles.planVal}>{kgPlan}</Text>
            <Text style={styles.planUnit}>kg</Text>
          </View>
          <Text style={styles.planLbl}>PLANIFICADOS</Text>
        </View>

        {/* ── Métricas secundarias ── */}
        <View style={styles.metricsRow}>
          <Metric label="Producido" value={`${kgProd} kg`} accent={Colors.sky[700]} />
          <View style={styles.metricDivider} />
          <Metric label="S. Sacos" value={String(orden.TotalSacos ?? 0)} />
          <View style={styles.metricDivider} />
          <Metric label="Cumpl." value={`${cumpl}%`} accent={cumplColor} />
        </View>

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
  backBtn: {
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
  body: { padding: 16, gap: 12, marginTop: -8, paddingBottom: 100 },

  // Card contenedor
  itemCard: { gap: 10 },

  // Encabezado fórmula
  formulaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  formulaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.sky[50],
    borderWidth: 1,
    borderColor: Colors.sky[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaCodigo: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.sky[700],
    letterSpacing: 0.3,
  },
  formulaDesc: {
    fontSize: 11,
    color: Colors.slate[500],
    fontWeight: '500',
    marginTop: 1,
  },

  // Orden secundaria
  ordenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 2,
  },
  ordenNumero: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 0.2,
  },

  // Kg planificados — protagonista numérico
  planBox: {
    backgroundColor: Colors.sky[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.sky[100],
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  planMain: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  planVal: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.sky[800],
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  planUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.sky[600],
    marginBottom: 2,
  },
  planLbl: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.sky[500],
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Métricas secundarias
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.slate[200],
    marginHorizontal: 14,
  },
  metric: { alignItems: 'flex-start' },
  metricVal: { fontSize: 13, fontWeight: '800', color: Colors.foreground },
  metricLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
