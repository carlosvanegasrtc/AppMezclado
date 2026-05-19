/**
 * HistorialScreen — incidencias y cumplimiento histórico.
 * Drawer screen.
 */
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { AlertCircle, History, Menu } from 'lucide-react-native';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { GradientHeader } from '@components/ui/GradientHeader';
import { EmptyState } from '@components/ui/EmptyState';
import { Skeleton } from '@components/ui/Skeleton';
import { Colors, Radius } from '@constants/index';
import {
  useCumplimientoBrutoNeto,
  useCumplimientos,
  useIncidencias,
} from '@hooks/useMezcla';
import { useAuthStore } from '@store/authStore';
import type { DrawerParamList } from '@navigation/types';

type DrawerNav = DrawerNavigationProp<DrawerParamList>;

type Tab = 'INCIDENCIAS' | 'CUMPLIMIENTO';

function lastNDays(n: number): { fechaInicio: string; fechaFin: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - n);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { fechaInicio: fmt(start), fechaFin: fmt(end) };
}

export function HistorialScreen() {
  const drawerNav = useNavigation<DrawerNav>();
  const [tab, setTab] = useState<Tab>('INCIDENCIAS');
  const range = useMemo(() => lastNDays(15), []);

  const session = useAuthStore((s) => s.session);
  const incidencias = useIncidencias(range.fechaInicio, range.fechaFin);
  const cumpl = useCumplimientos(range.fechaInicio, range.fechaFin);
  const brutoNeto = useCumplimientoBrutoNeto({
    idEmpleado: session?.idEmpleado,
    fechaInicio: range.fechaInicio,
    fechaFin: range.fechaFin,
  });

  const isLoading = tab === 'INCIDENCIAS' ? incidencias.isLoading : cumpl.isLoading;
  const isRefetching =
    tab === 'INCIDENCIAS' ? incidencias.isRefetching : cumpl.isRefetching;
  const refetch = tab === 'INCIDENCIAS' ? incidencias.refetch : cumpl.refetch;

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
            <Text style={styles.title}>Historial</Text>
            <Text style={styles.subtitle}>Últimos 15 días</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TabBtn
            label="Incidencias"
            active={tab === 'INCIDENCIAS'}
            onPress={() => setTab('INCIDENCIAS')}
          />
          <TabBtn
            label="Cumplimiento"
            active={tab === 'CUMPLIMIENTO'}
            onPress={() => setTab('CUMPLIMIENTO')}
          />
        </View>
      </GradientHeader>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={Colors.sky[600]}
            colors={[Colors.sky[600]]}
          />
        }
      >
        {isLoading ? (
          <>
            <Skeleton height={70} style={{ borderRadius: Radius.lg }} />
            <Skeleton height={70} style={{ borderRadius: Radius.lg, marginTop: 12 }} />
          </>
        ) : tab === 'INCIDENCIAS' ? (
          (incidencias.data ?? []).length === 0 ? (
            <EmptyState
              title="Sin incidencias"
              description="No hay incidencias registradas en los últimos 15 días."
              icon={<AlertCircle size={36} color={Colors.muted} strokeWidth={2} />}
            />
          ) : (
            (incidencias.data ?? []).map((it, i) => (
              <Card key={i} style={styles.itemCard} radius={Radius.lg}>
                <Text style={styles.itemHeader}>
                  {it.NumeroOrdenMezcla ?? `Orden ${it.IdProduccion}`}
                  {it.FechaTurno ? `   ·   ${it.FechaTurno}` : ''}
                </Text>
                <Text style={styles.itemBody}>{it.Descripcion}</Text>
                {!!it.NombreEmpleado && (
                  <Text style={styles.itemMeta}>Reportado por {it.NombreEmpleado}</Text>
                )}
              </Card>
            ))
          )
        ) : (
          <>
            {brutoNeto.data?.kpis ? (
              <Card style={styles.itemCard} radius={Radius.lg}>
                <Text style={styles.kpiTitle}>Cumplimiento del período</Text>
                <View style={styles.kpiGrid}>
                  <KpiCell
                    label="Bruto"
                    value={`${(Number(brutoNeto.data.kpis.PorcentajeCumplimientoBruto) || 0).toFixed(1)}%`}
                    sub={`${Number(brutoNeto.data.kpis.KgProducidoBruto).toFixed(0)} / ${Number(brutoNeto.data.kpis.KgPlanificadoBruto).toFixed(0)} kg`}
                  />
                  <KpiCell
                    label="Neto"
                    value={`${(Number(brutoNeto.data.kpis.PorcentajeCumplimientoNeto) || 0).toFixed(1)}%`}
                    sub={`${Number(brutoNeto.data.kpis.KgProducidoNeto).toFixed(0)} / ${Number(brutoNeto.data.kpis.KgPlanificadoNeto).toFixed(0)} kg`}
                    accent={Colors.sky[700]}
                  />
                </View>
                <View style={styles.kpiPills}>
                  <Pill
                    label={`${brutoNeto.data.kpis.OrdenesCompletadas ?? 0} completadas`}
                    color={Colors.success}
                  />
                  <Pill
                    label={`${brutoNeto.data.kpis.OrdenesIncompletas ?? 0} incompletas`}
                    color={Colors.error}
                  />
                  <Pill
                    label={`${brutoNeto.data.kpis.OrdenesJustificadas ?? 0} justificadas`}
                    color={Colors.warning}
                  />
                </View>
                <Text style={styles.kpiHint}>
                  Bruto incluye todas las órdenes. Neto excluye INCOMPLETA con motivo justificado.
                </Text>
              </Card>
            ) : null}

            {(cumpl.data ?? []).length === 0 ? (
              <EmptyState
                title="Sin datos"
                description="No hay registros de cumplimiento en los últimos 15 días."
                icon={<History size={36} color={Colors.muted} strokeWidth={2} />}
              />
            ) : (
              (cumpl.data ?? []).map((it, i) => {
                const pct = Math.round(Number(it.PorcentajeCumplimiento) || 0);
                const isIncompleta = it.EstadoCodigo === 'INCOMPLETA';
                return (
                  <Card key={i} style={styles.itemCard} radius={Radius.lg}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.itemHeader} numberOfLines={1}>
                        {it.CodigoFormula}   ·   {it.FechaProduccion}
                      </Text>
                      {isIncompleta ? (
                        <View
                          style={[
                            styles.estadoBadge,
                            {
                              backgroundColor: Colors.estados.incompleta.bg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.estadoBadgeTxt,
                              { color: Colors.estados.incompleta.color },
                            ]}
                          >
                            INCOMPLETA
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.cumplRow}>
                      <Text style={styles.itemBody}>
                        {Number(it.KgProducidos).toFixed(0)} / {Number(it.KgPlanificados).toFixed(0)} kg
                        {' '}· {it.TotalSacos ?? 0} sacos
                      </Text>
                      <Text
                        style={[
                          styles.cumplPct,
                          { color: pct >= 100 ? Colors.success : Colors.warning },
                        ]}
                      >
                        {pct}%
                      </Text>
                    </View>
                    {it.MotivoCierreDescripcion ? (
                      <Text style={styles.motivoLine}>
                        Motivo: {it.MotivoCierreDescripcion}
                        {it.MotivoJustificado === false ? ' · afecta cumplimiento' : ''}
                      </Text>
                    ) : null}
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
      <Text style={[styles.tabLbl, active && styles.tabLblActive]}>{label}</Text>
    </Pressable>
  );
}

function KpiCell({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <View style={styles.kpiCell}>
      <Text style={styles.kpiCellLbl}>{label}</Text>
      <Text style={[styles.kpiCellVal, accent ? { color: accent } : null]}>{value}</Text>
      {sub ? <Text style={styles.kpiCellSub}>{sub}</Text> : null}
    </View>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillTxt, { color }]}>{label}</Text>
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
  tabs: {
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: Colors.overlay.light,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 999,
  },
  tabBtnActive: { backgroundColor: Colors.white },
  tabLbl: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 },
  tabLblActive: { color: Colors.sky[800] },
  body: { padding: 16, gap: 12, marginTop: -8, paddingBottom: 32 },
  itemCard: { gap: 4 },
  itemHeader: { fontSize: 12, fontWeight: '800', color: Colors.foreground, letterSpacing: 0.3 },
  itemBody: { fontSize: 13, color: Colors.foreground, lineHeight: 18 },
  itemMeta: { fontSize: 11, color: Colors.muted, marginTop: 4 },
  cumplRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cumplPct: { fontSize: 18, fontWeight: '900' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  estadoBadgeTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  motivoLine: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCell: {
    flex: 1,
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
    padding: 12,
  },
  kpiCellLbl: { fontSize: 10, fontWeight: '800', color: Colors.muted, letterSpacing: 0.6 },
  kpiCellVal: { fontSize: 22, fontWeight: '900', color: Colors.foreground, marginTop: 2 },
  kpiCellSub: { fontSize: 10, color: Colors.muted, marginTop: 2 },
  kpiPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  kpiHint: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 8,
    lineHeight: 14,
    fontStyle: 'italic',
  },
});
