/**
 * OrdenDetalleScreen — detalle de una orden de mezcla con KPIs, componentes SAP y acciones.
 */
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
  Package,
  Receipt,
  RefreshCcw,
  Truck,
} from 'lucide-react-native';
import { AppBar } from '@components/ui/AppBar';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { StatusBadge } from '@components/ui/StatusBadge';
import { AppButton } from '@components/ui/AppButton';
import { Skeleton } from '@components/ui/Skeleton';
import { Colors, Radius } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import {
  useOrdenesPorEmpleado,
  useEmpleadosAsignados,
  useComponentesFormula,
  useSolicitudPorPlanificacion,
} from '@hooks/useMezcla';
import type { AppStackParamList } from '@navigation/types';
import { ESTADO_MEZCLA_LABEL } from '@/types/mezcla';
import type { ComponenteFormula } from '@/types/mezcla';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'OrdenDetalle'>;

// ── Helpers de formato ──────────────────────────────────
function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const dia = d.getUTCDate().toString().padStart(2, '0');
    const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const anio = d.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  } catch {
    return iso;
  }
}

function formatHora(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const hh = d.getUTCHours().toString().padStart(2, '0');
    const mm = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return iso;
  }
}

// ── Componente principal ────────────────────────────────
export function OrdenDetalleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { idOrdenProduccionMZCL } = route.params;
  const session = useAuthStore((s) => s.session);

  const { data: ordenes, isLoading, refetch, isRefetching } = useOrdenesPorEmpleado(session?.idEmpleado);
  const orden = ordenes?.find((o) => o.IdOrdenProduccionMZCL === idOrdenProduccionMZCL);
  const { data: empleados } = useEmpleadosAsignados(idOrdenProduccionMZCL);
  const { data: componentes, isLoading: loadingComps } = useComponentesFormula(orden?.CodigoFormula);
  const { data: solicitud } = useSolicitudPorPlanificacion(orden?.IdPlanificacionMezcla);

  const estado = String(orden?.Estado ?? '').toUpperCase();
  const finalizada = ['COMPLETADA', 'CANCELADA', 'INCOMPLETA'].includes(estado);
  const cumpl = Math.round(Number(orden?.PorcentajeCumplimiento) || 0);

  // Bloquear producción si bodega aún no despachó los insumos
  const esperandoInsumos = !!solicitud && solicitud.Estado === 'PENDIENTE';

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const refreshBtn = (
    <Pressable
      onPress={onRefresh}
      hitSlop={10}
      style={styles.refreshBtn}
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
    >
      {isRefetching
        ? <ActivityIndicator size={16} color={Colors.sky[600]} />
        : <RefreshCcw size={18} color={Colors.sky[600]} strokeWidth={2.2} />
      }
    </Pressable>
  );

  return (
    <Screen edges={['top']} bg={Colors.slate[50]}>
      <AppBar
        title="Orden de mezcla"
        onBack={() => navigation.goBack()}
        right={refreshBtn}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading || !orden ? (
          <Skeleton height={220} style={{ borderRadius: Radius.lg }} />
        ) : (
          <Animated.View entering={FadeInDown.duration(380)}>

            {/* ── Hero card ── */}
            <Card style={styles.heroCard} radius={Radius.lg}>
              <View style={styles.heroRow}>
                <Text style={styles.heroNumero}>{orden.NumeroOrdenMezcla}</Text>
                <StatusBadge estado={orden.Estado as any} />
              </View>
              <Text style={styles.heroFormula} numberOfLines={2}>
                {orden.CodigoFormula}
                {orden.DescripcionFormula ? ` · ${orden.DescripcionFormula}` : ''}
              </Text>
              {!!orden.FechaProduccion && (
                <Text style={styles.heroMeta}>
                  {formatFecha(orden.FechaProduccion)}
                  {orden.HoraInicioTurno && orden.HoraFinTurno
                    ? `   ·   Turno ${formatHora(orden.HoraInicioTurno)} – ${formatHora(orden.HoraFinTurno)}`
                    : ''}
                </Text>
              )}

              <View style={styles.kpiGrid}>
                <Kpi label="Planificado" value={`${(orden.KgPlanificados ?? 0).toFixed(0)} kg`} />
                <Kpi
                  label="Producido"
                  value={`${(orden.KgProducidos ?? 0).toFixed(0)} kg`}
                  accent={Colors.sky[700]}
                />
                <Kpi label="Sacos" value={String(orden.TotalSacos ?? 0)} />
                <Kpi
                  label="Cumplimiento"
                  value={`${cumpl}%`}
                  accent={cumpl >= 100 ? Colors.success : Colors.warning}
                />
              </View>
            </Card>

            {/* ── Componentes de la fórmula ── */}
            <Card style={{ marginTop: 12 }} radius={Radius.lg}>
              <View style={styles.secHeader}>
                <FlaskConical size={16} color={Colors.sky[600]} strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>Componentes de fórmula</Text>
              </View>

              {loadingComps ? (
                <ActivityIndicator size="small" color={Colors.sky[600]} style={{ marginTop: 8 }} />
              ) : !componentes || componentes.length === 0 ? (
                <Text style={styles.placeholder}>Sin componentes registrados.</Text>
              ) : (
                <ComponentesTable componentes={componentes} />
              )}
            </Card>

            {/* ── Empleados del turno ── */}
            {!!empleados?.length && (
              <Card style={{ marginTop: 12 }} radius={Radius.lg}>
                <Text style={styles.sectionTitle}>Empleados del turno</Text>
                {empleados.map((e) => (
                  <View key={e.IdEmpleado} style={styles.empRow}>
                    <View style={styles.empAvatar}>
                      <Text style={styles.empAvatarText}>
                        {(e.Nombre || '?').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.empName} numberOfLines={1}>{e.Nombre}</Text>
                      <Text style={styles.empMeta} numberOfLines={1}>
                        {[e.RolEnTurno, e.Puesto, e.CodigoFactorh].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* ── Banner: esperando insumos de bodega ── */}
            {esperandoInsumos && (
              <View style={styles.bannerEspera}>
                <Clock size={18} color={Colors.amber[700]} strokeWidth={2.4} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bannerTitulo}>Esperando despacho de bodega</Text>
                  <Text style={styles.bannerSub}>
                    Bodega debe despachar los insumos antes de iniciar la producción.
                  </Text>
                </View>
              </View>
            )}

            {/* ── Acciones ── */}
            <View style={styles.actions}>
              <AppButton
                label="Registrar saco"
                onPress={() =>
                  navigation.navigate('RegistrarSaco', { idOrdenProduccionMZCL: orden.IdOrdenProduccionMZCL })
                }
                variant="primary"
                size="lg"
                fullWidth
                disabled={finalizada || esperandoInsumos}
                leftIcon={<Package size={18} color={Colors.white} strokeWidth={2.4} />}
              />
              <View style={{ height: 10 }} />
              <AppButton
                label="Reportar incidencia"
                onPress={() =>
                  navigation.navigate('Incidencia', {
                    idOrdenProduccionMZCL: orden.IdOrdenProduccionMZCL,
                    codigoFormula: orden.CodigoFormula,
                  })
                }
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<AlertTriangle size={18} color={Colors.amber[700]} strokeWidth={2.4} />}
              />
              <View style={{ height: 10 }} />
              <AppButton
                label={finalizada ? `Orden ${ESTADO_MEZCLA_LABEL[estado] ?? estado}` : 'Completar orden'}
                onPress={() =>
                  navigation.navigate('CompletarOrden', { idOrdenProduccionMZCL: orden.IdOrdenProduccionMZCL })
                }
                variant="success"
                size="md"
                fullWidth
                disabled={finalizada || esperandoInsumos}
                leftIcon={<CheckCircle2 size={18} color={Colors.white} strokeWidth={2.4} />}
              />
              {!!solicitud && (
                <>
                  <View style={{ height: 10 }} />
                  <AppButton
                    label={
                      solicitud.Estado === 'DESPACHADO'
                        ? 'Confirmar recepción de insumos'
                        : 'Ver insumos de materia prima'
                    }
                    onPress={() =>
                      navigation.navigate('Insumos', { idSolicitud: solicitud.IdSolicitud })
                    }
                    variant={solicitud.Estado === 'DESPACHADO' ? 'primary' : 'secondary'}
                    size="md"
                    fullWidth
                    leftIcon={
                      <Truck
                        size={18}
                        color={solicitud.Estado === 'DESPACHADO' ? Colors.white : Colors.sky[700]}
                        strokeWidth={2.4}
                      />
                    }
                  />
                </>
              )}
            </View>

            {/* ── Cierre de turno ── */}
            <Card style={{ marginTop: 12 }} radius={Radius.lg}>
              <View style={styles.secHeader}>
                <Receipt size={18} color={Colors.muted} strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>Cierre de turno</Text>
              </View>
              <Text style={styles.placeholder}>
                Genera la boleta consolidada del turno: producción real, sacos, biométrico y motivo de cierre.
              </Text>
              <View style={{ height: 10 }} />
              <AppButton
                label="Cerrar turno con boleta"
                onPress={() => navigation.navigate('BoletaTurno', { idEmpleado: session?.idEmpleado })}
                variant="primary"
                size="md"
                fullWidth
                leftIcon={<Receipt size={18} color={Colors.white} strokeWidth={2.4} />}
              />
            </Card>

            {/* ── Sacos ── */}
            <Card style={{ marginTop: 12 }} radius={Radius.lg}>
              <View style={styles.secHeader}>
                <Package size={18} color={Colors.muted} strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>Sacos del turno</Text>
              </View>
              <Text style={styles.placeholder}>
                Próximamente: lista de sacos registrados, peso individual y trazabilidad a bodega.
              </Text>
            </Card>

          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}

// ── Tabla de componentes ────────────────────────────────
function ComponentesTable({ componentes }: { componentes: ComponenteFormula[] }) {
  const maxQty = Math.max(...componentes.map((c) => c.quantity ?? 0), 0);
  const getPHR = (qty: number) => (maxQty > 0 ? (qty / maxQty) * 100 : 0);
  const totalKg = componentes.reduce((s, c) => s + (c.quantity ?? 0), 0);
  const totalPHR = componentes.reduce((s, c) => s + getPHR(c.quantity ?? 0), 0);

  const sorted = [...componentes].sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));

  return (
    <View style={comp.container}>
      {/* Header */}
      <View style={[comp.row, comp.header]}>
        <Text style={[comp.cell, comp.flex3, comp.headerTxt]}>MATERIAL</Text>
        <Text style={[comp.cell, comp.flex1, comp.headerTxt, comp.right]}>PHR</Text>
        <Text style={[comp.cell, comp.flex1, comp.headerTxt, comp.right]}>KG BATCH</Text>
      </View>

      {sorted.map((c, i) => {
        const phr = getPHR(c.quantity ?? 0);
        const isBase = (c.quantity ?? 0) === maxQty;
        return (
          <View
            key={c.code}
            style={[
              comp.row,
              isBase && comp.rowBase,
              i % 2 !== 0 && !isBase && comp.rowAlt,
            ]}
          >
            <View style={[comp.cell, comp.flex3]}>
              <Text style={[comp.matName, isBase && comp.baseText]} numberOfLines={2}>
                {c.itemName}
              </Text>
              <Text style={comp.matCode}>{c.code}</Text>
            </View>
            <Text style={[comp.cell, comp.flex1, comp.numVal, comp.right, isBase && comp.baseText]}>
              {phr.toFixed(1)}
            </Text>
            <Text style={[comp.cell, comp.flex1, comp.numVal, comp.right, isBase && comp.baseText]}>
              {(c.quantity ?? 0).toFixed(2)}
            </Text>
          </View>
        );
      })}

      {/* Footer totales */}
      <View style={[comp.row, comp.footer]}>
        <Text style={[comp.cell, comp.flex3, comp.footerTxt]}>TOTAL</Text>
        <Text style={[comp.cell, comp.flex1, comp.footerTxt, comp.right]}>
          {totalPHR.toFixed(1)}
        </Text>
        <Text style={[comp.cell, comp.flex1, comp.footerTxt, comp.right]}>
          {totalKg.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

// ── KPI helper ──────────────────────────────────────────
function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={[styles.kpiVal, accent && { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLbl}>{label}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
  heroCard: { gap: 6 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroNumero: { fontSize: 18, fontWeight: '900', color: Colors.foreground, letterSpacing: 0.4 },
  heroFormula: { fontSize: 13, color: Colors.foreground, marginTop: 2, fontWeight: '600' },
  heroMeta: { fontSize: 11, color: Colors.muted, marginTop: 4 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
    padding: 12,
    gap: 12,
  },
  kpi: { width: '46%' },
  kpiVal: { fontSize: 18, fontWeight: '900', color: Colors.foreground },
  kpiLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate[700],
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  empAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.sky[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarText: { color: Colors.sky[800], fontWeight: '900' },
  empName: { fontSize: 13, fontWeight: '700', color: Colors.foreground },
  empMeta: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  actions: { marginTop: 14 },
  placeholder: { fontSize: 12, color: Colors.muted, marginTop: 4, lineHeight: 18 },
  bannerEspera: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.amber[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.amber[200],
    padding: 14,
    marginTop: 14,
  },
  bannerTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.amber[800],
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.amber[700],
    lineHeight: 16,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const comp = StyleSheet.create({
  container: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.slate[200],
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  rowAlt: { backgroundColor: Colors.slate[50] },
  rowBase: { backgroundColor: Colors.sky[50] },
  header: { backgroundColor: Colors.slate[700] },
  footer: { backgroundColor: Colors.slate[800] },
  cell: { paddingHorizontal: 2 },
  flex1: { flex: 1 },
  flex3: { flex: 3 },
  right: { textAlign: 'right' },
  headerTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  footerTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  matName: { fontSize: 11, fontWeight: '600', color: Colors.foreground, lineHeight: 15 },
  matCode: { fontSize: 9, color: Colors.muted, marginTop: 1 },
  baseText: { color: Colors.sky[700] },
  numVal: { fontSize: 12, fontWeight: '700', color: Colors.foreground },
});
