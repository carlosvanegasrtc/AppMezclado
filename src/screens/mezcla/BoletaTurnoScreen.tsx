/**
 * BoletaTurnoScreen — Cierre de turno con boleta consolidada.
 *
 * Flujo:
 *   1) Si no se pasa `idTurnoPlanificacionMezcla` por params, lista los turnos
 *      activos del empleado del día y deja seleccionar.
 *   2) Una vez con el turno → muestra la pre-vista (kg planificado/producido,
 *      sacos, % cumplimiento, motivo de cierre, incidencias).
 *   3) Botón principal "Cerrar boleta" hace POST /production/mezcla/boleta y
 *      reemplaza la pre-vista por la boleta consolidada (con biométrico).
 *   4) Botón "Imprimir" — placeholder hasta que se conecte la impresora TCP.
 *
 * Patrón visual: idéntico a CompletarOrdenScreen / OrdenDetalleScreen.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CheckCircle2,
  Clock,
  Printer,
  AlertTriangle,
  XCircle,
  ChevronRight,
} from 'lucide-react-native';
import { AppBar } from '@components/ui/AppBar';
import { AppButton } from '@components/ui/AppButton';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { Skeleton } from '@components/ui/Skeleton';
import { Colors, Radius } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import {
  useTurnosActivos,
  useBoletaPreview,
  useCerrarTurnoConBoleta,
} from '@hooks/useMezcla';
import { useHaptics } from '@hooks/useHaptics';
import { normalizeError } from '@utils/networkError';
import { formatFecha, formatFechaHora, formatPct } from '@utils/format';
import type { AppStackParamList } from '@navigation/types';
import type {
  BoletaMezcla,
  PreviewBoletaMezcla,
  TurnoActivoEmpleado,
} from '@/types/mezcla';

type Nav = NativeStackNavigationProp<AppStackParamList, 'BoletaTurno'>;
type Route = RouteProp<AppStackParamList, 'BoletaTurno'>;

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function BoletaTurnoScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const session = useAuthStore((s) => s.session);
  const haptics = useHaptics();

  const idEmpleadoSesion = session?.idEmpleado as number | undefined;
  const idEmpleadoParam = route.params?.idEmpleado;
  const idEmpleado = idEmpleadoParam ?? idEmpleadoSesion;

  const [idTurnoSeleccionado, setIdTurnoSeleccionado] = useState<number | null>(
    route.params?.idTurnoPlanificacionMezcla ?? null,
  );
  const [observaciones, setObservaciones] = useState('');
  const [boletaCerrada, setBoletaCerrada] = useState<BoletaMezcla | null>(null);
  const [errorCierre, setErrorCierre] = useState<string | null>(null);

  // Turnos del día del empleado (para selector cuando no viene en params)
  const {
    data: turnos,
    isLoading: cargandoTurnos,
  } = useTurnosActivos(idEmpleado, todayISO());

  // Pre-vista del turno seleccionado
  const {
    data: preview,
    isLoading: cargandoPreview,
    isFetching: refrescandoPreview,
    refetch: refrescarPreview,
  } = useBoletaPreview(idTurnoSeleccionado);

  const cerrarMutation = useCerrarTurnoConBoleta();

  const turnoElegido: TurnoActivoEmpleado | undefined = useMemo(
    () => turnos?.find((t) => t.idTurnoPlanificacionMezcla === idTurnoSeleccionado),
    [turnos, idTurnoSeleccionado],
  );

  const handleCerrarBoleta = async () => {
    if (!idTurnoSeleccionado || !idEmpleado) return;
    setErrorCierre(null);
    try {
      const boleta = await cerrarMutation.mutateAsync({
        idTurnoPlanificacionMezcla: idTurnoSeleccionado,
        idEmpleado,
        usuario: session?.username ?? session?.nombreEmpleado ?? undefined,
        observaciones: observaciones.trim() || undefined,
      });
      setBoletaCerrada(boleta);
      haptics.success();
    } catch (err) {
      setErrorCierre(normalizeError(err).message);
      haptics.error();
    }
  };

  // ───────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────

  // Estado 1: no hay turno seleccionado → mostrar selector
  if (!idTurnoSeleccionado) {
    return (
      <Screen edges={['top']} bg={Colors.slate[50]}>
        <AppBar title="Cerrar turno" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.body}>
          <Card radius={Radius.lg}>
            <Text style={styles.sectionTitle}>Selecciona el turno a cerrar</Text>
            <Text style={styles.helperText}>
              Mostrando turnos asignados a ti del {formatFecha(new Date())}.
            </Text>

            {cargandoTurnos ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                <Skeleton height={64} style={{ borderRadius: Radius.md }} />
                <Skeleton height={64} style={{ borderRadius: Radius.md }} />
              </View>
            ) : !turnos || turnos.length === 0 ? (
              <View style={styles.emptyBox}>
                <AlertTriangle size={20} color={Colors.amber[700]} strokeWidth={2.4} />
                <Text style={styles.emptyText}>
                  No tienes turnos de mezcla asignados hoy.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 12, gap: 8 }}>
                {turnos.map((t) => (
                  <TurnoRow
                    key={t.idTurnoPlanificacionMezcla}
                    turno={t}
                    onPress={() => setIdTurnoSeleccionado(t.idTurnoPlanificacionMezcla)}
                  />
                ))}
              </View>
            )}
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  // Estado 2: turno seleccionado pero todavía no se cierra la boleta → mostrar preview
  if (!boletaCerrada) {
    return (
      <Screen edges={['top']} bg={Colors.slate[50]}>
        <AppBar
          title="Pre-vista de boleta"
          onBack={() => navigation.goBack()}
        />
        <ScrollView contentContainerStyle={styles.body}>
          <Animated.View entering={FadeInDown.duration(380)}>
            {cargandoPreview ? (
              <Skeleton height={320} style={{ borderRadius: Radius.lg }} />
            ) : !preview ? (
              <Card radius={Radius.lg}>
                <Text style={styles.helperText}>No se pudo cargar el resumen del turno.</Text>
              </Card>
            ) : (
              <>
                <PreviewCard
                  preview={preview}
                  turno={turnoElegido}
                  refreshing={refrescandoPreview}
                  onRefresh={refrescarPreview}
                />

                <Card style={{ marginTop: 12 }} radius={Radius.lg}>
                  <Text style={styles.sectionTitle}>Observaciones (opcional)</Text>
                  <TextInput
                    multiline
                    numberOfLines={3}
                    value={observaciones}
                    onChangeText={setObservaciones}
                    placeholder="Detalles del cierre (incidencias, materia prima, etc.)"
                    placeholderTextColor={Colors.muted}
                    style={styles.input}
                  />
                </Card>

                {errorCierre && (
                  <Card style={{ marginTop: 12, backgroundColor: Colors.errorLight }} radius={Radius.lg}>
                    <View style={styles.rowGap}>
                      <XCircle size={18} color={Colors.error} strokeWidth={2.4} />
                      <Text style={[styles.errorText]} numberOfLines={4}>
                        {errorCierre}
                      </Text>
                    </View>
                  </Card>
                )}

                <View style={{ height: 14 }} />

                <AppButton
                  label="Generar y cerrar boleta"
                  onPress={handleCerrarBoleta}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={cerrarMutation.isPending}
                  disabled={cerrarMutation.isPending}
                  leftIcon={<CheckCircle2 size={18} color={Colors.white} strokeWidth={2.4} />}
                />
              </>
            )}
          </Animated.View>
        </ScrollView>
      </Screen>
    );
  }

  // Estado 3: boleta consolidada — mostrar ticket
  return (
    <Screen edges={['top']} bg={Colors.slate[50]}>
      <AppBar
        title="Boleta de cierre"
        onBack={() => {
          setBoletaCerrada(null);
          navigation.goBack();
        }}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <Animated.View entering={FadeInDown.duration(380)}>
          <BoletaConsolidadaCard boleta={boletaCerrada} />

          <View style={{ height: 14 }} />
          <AppButton
            label="Imprimir boleta"
            onPress={() => {
              haptics.light();
              // Pendiente: integración con impresora Epson TM-T20IV-SP por TCP/9100.
              // Por ahora se deja el placeholder; el siguiente paso conectará el endpoint
              // de impresión backend.
            }}
            variant="secondary"
            size="lg"
            fullWidth
            leftIcon={<Printer size={18} color={Colors.sky[700]} strokeWidth={2.4} />}
          />

          <View style={{ height: 10 }} />
          <AppButton
            label="Volver"
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="md"
            fullWidth
          />
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

// ───────────────────────────────────────────────────────
// Sub-componentes
// ───────────────────────────────────────────────────────

function TurnoRow({
  turno,
  onPress,
}: {
  turno: TurnoActivoEmpleado;
  onPress: () => void;
}) {
  const yaCerrado = turno.yaTieneBoleta;
  return (
    <View
      style={[
        styles.turnoRow,
        yaCerrado && { backgroundColor: Colors.slate[100], opacity: 0.85 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.turnoTitle} numberOfLines={1}>
          {turno.numeroOrdenMezcla ?? '—'}{' '}
          <Text style={styles.turnoBadge}>· Turno {turno.numeroTurno}</Text>
        </Text>
        <Text style={styles.turnoMeta} numberOfLines={1}>
          <Clock size={11} color={Colors.muted} />{' '}
          {turno.horaInicio?.slice(11, 16) ?? '—'}-{turno.horaFin?.slice(11, 16) ?? '—'}
          {turno.tipoTurno ? ` · ${turno.tipoTurno}` : ''}
          {turno.totalProgramadoKg != null
            ? ` · ${Number(turno.totalProgramadoKg).toFixed(0)} kg`
            : ''}
        </Text>
        {turno.rolEnTurno && (
          <Text style={styles.turnoRol} numberOfLines={1}>
            Rol: {turno.rolEnTurno}
          </Text>
        )}
        {yaCerrado && (
          <Text style={styles.turnoCerrado}>Boleta ya generada (puedes re-generar para refrescar)</Text>
        )}
      </View>
      <AppButton
        label={yaCerrado ? 'Ver' : 'Abrir'}
        onPress={onPress}
        variant="primary"
        size="sm"
        rightIcon={<ChevronRight size={14} color={Colors.white} strokeWidth={2.4} />}
      />
    </View>
  );
}

function PreviewCard({
  preview,
  turno,
  refreshing,
  onRefresh,
}: {
  preview: PreviewBoletaMezcla;
  turno?: TurnoActivoEmpleado;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const cumpl = Math.round(Number(preview.porcentajeCumplimiento) || 0);
  const accent =
    cumpl >= 100 ? Colors.success : cumpl >= 80 ? Colors.amber[600] : Colors.error;
  return (
    <Card style={styles.previewCard} radius={Radius.lg}>
      <View style={styles.previewHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {preview.numeroOrdenMezcla ?? 'Orden de mezcla'}
          </Text>
          <Text style={styles.previewMeta} numberOfLines={1}>
            Turno {preview.numeroTurno}
            {preview.tipoTurno ? ` · ${preview.tipoTurno}` : ''} ·{' '}
            {formatFecha(preview.fechaTurno)}
          </Text>
        </View>
        <AppButton
          label="Refrescar"
          onPress={onRefresh}
          variant="ghost"
          size="sm"
          loading={refreshing}
          disabled={refreshing}
        />
      </View>

      <View style={styles.kpiGrid}>
        <Kpi label="Planificado" value={`${(preview.kgPlanificados ?? 0).toFixed(0)} kg`} />
        <Kpi
          label="Producido"
          value={`${(preview.kgProducidos ?? 0).toFixed(0)} kg`}
          accent={Colors.sky[700]}
        />
        <Kpi label="Sacos" value={String(preview.sacosProducidos ?? 0)} />
        <Kpi label="Cumplimiento" value={`${cumpl}%`} accent={accent} />
        <Kpi label="Desviación" value={`${(preview.desviacionKg ?? 0).toFixed(0)} kg`} />
        <Kpi label="Sacos en bodega" value={String(preview.sacosRecibidosBodega ?? 0)} />
      </View>

      {preview.estadoOrdenCodigo && (
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text style={[styles.infoValue, badgeColor(preview.estadoOrdenCodigo)]}>
            {preview.estadoOrdenCodigo}
          </Text>
        </View>
      )}
      {preview.motivoCierreCodigo && (
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>Motivo:</Text>
          <Text style={styles.infoValue}>
            {preview.motivoCierreCodigo}{' '}
            {preview.motivoJustificado != null && (
              <Text
                style={[
                  styles.justifTag,
                  preview.motivoJustificado
                    ? { color: Colors.success }
                    : { color: Colors.error },
                ]}
              >
                ({preview.motivoJustificado ? 'justificado' : 'no justificado'})
              </Text>
            )}
          </Text>
        </View>
      )}
      {preview.numIncidencias > 0 && (
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>Incidencias:</Text>
          <Text style={styles.infoValue}>
            {preview.numIncidencias} ·{' '}
            {(preview.kgNoProducidosIncidencias ?? 0).toFixed(0)} kg justificados
          </Text>
        </View>
      )}

      {turno?.horaInicio && turno?.horaFin && (
        <Text style={styles.previewFoot}>
          Ventana del turno: {turno.horaInicio.slice(11, 16)} – {turno.horaFin.slice(11, 16)}
        </Text>
      )}
    </Card>
  );
}

function BoletaConsolidadaCard({ boleta }: { boleta: BoletaMezcla }) {
  const cumpl = Math.round(Number(boleta.PorcentajeCumplimiento) || 0);
  const inconclusa = boleta.Estado === 'INCONCLUSA';
  const minutos = boleta.MinutosTrabajados ?? 0;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  const tiempoLaborado = minutos > 0 ? `${horas}h ${mins}min` : '—';

  return (
    <Card style={styles.boletaCard} radius={Radius.lg}>
      <View style={styles.boletaHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.boletaTitle}>BOLETA DE CIERRE — MEZCLA</Text>
          <Text style={styles.boletaMeta}>#{boleta.IdCierre} · {formatFechaHora(boleta.FechaCierre)}</Text>
        </View>
        <View
          style={[
            styles.estadoBadge,
            inconclusa ? styles.estadoInconclusa : styles.estadoCerrado,
          ]}
        >
          <Text style={styles.estadoBadgeText}>{boleta.Estado}</Text>
        </View>
      </View>

      {inconclusa && (
        <View style={styles.bannerInconclusa}>
          <AlertTriangle size={18} color={Colors.amber[700]} strokeWidth={2.4} />
          <Text style={styles.bannerInconclusaText}>
            Boleta INCONCLUSA: no se registró marcaje de salida en el biométrico.
          </Text>
        </View>
      )}

      {/* Datos del empleado y turno */}
      <Section title="Empleado y turno">
        <Row label="Empleado" value={boleta.NombreEmpleado ?? '—'} />
        <Row label="ID" value={String(boleta.IdEmpleado ?? '—')} />
        {boleta.CodigoEmpleadoBio != null && (
          <Row label="Código bio" value={String(boleta.CodigoEmpleadoBio)} />
        )}
        <Row label="Orden" value={boleta.NumeroOrdenMezcla ?? '—'} />
        <Row
          label="Turno"
          value={`N° ${boleta.NumeroTurno}${boleta.TipoTurno ? ` · ${boleta.TipoTurno}` : ''}`}
        />
        <Row label="Fecha" value={formatFecha(boleta.FechaTurno)} />
        <Row
          label="Horario planificado"
          value={`${boleta.HoraInicioPlan?.slice(11, 16) ?? '—'} – ${boleta.HoraFinPlan?.slice(11, 16) ?? '—'}`}
        />
      </Section>

      {/* Producción: sacos y kilos de fórmula */}
      <Section title="Producción">
        <Row label="Kg planificados" value={`${Number(boleta.KgPlanificados ?? 0).toFixed(0)} kg`} />
        <Row
          label="Kg producidos"
          value={`${Number(boleta.KgProducidos ?? 0).toFixed(0)} kg`}
          accent={Colors.sky[700]}
        />
        <Row
          label="Cumplimiento"
          value={`${cumpl}%`}
          accent={cumpl >= 100 ? Colors.success : Colors.warning}
        />
        <Row label="Sacos producidos" value={String(boleta.SacosProducidos)} />
        <Row label="Sacos recibidos bodega" value={String(boleta.SacosRecibidosBodega)} />
        {boleta.IdMotivoCierre != null && (
          <Row
            label="Motivo cierre"
            value={`${boleta.MotivoCierreCodigo ?? '—'}${
              boleta.MotivoJustificado != null
                ? ` (${boleta.MotivoJustificado ? 'justificado' : 'no justificado'})`
                : ''
            }`}
          />
        )}
        {boleta.NumIncidencias > 0 && (
          <Row
            label="Incidencias"
            value={`${boleta.NumIncidencias} registradas · ${Number(boleta.KgNoProducidosIncidencias ?? 0).toFixed(0)} kg justif.`}
          />
        )}
      </Section>

      {/* Tiempo laborado */}
      <Section title="Tiempo laborado">
        <Row
          label="Entrada"
          value={boleta.HoraEntradaBio ? formatFechaHora(boleta.HoraEntradaBio) : '— sin marcaje —'}
        />
        <Row
          label="Salida"
          value={boleta.HoraSalidaBio ? formatFechaHora(boleta.HoraSalidaBio) : '— sin marcaje —'}
        />
        <Row label="Tiempo trabajado" value={tiempoLaborado} accent={Colors.sky[700]} />
        {boleta.ObservacionesBio ? (
          <Row label="Observación" value={boleta.ObservacionesBio} />
        ) : null}
      </Section>

      {boleta.Observaciones ? (
        <Section title="Observaciones">
          <Text style={styles.observ}>{boleta.Observaciones}</Text>
        </Section>
      ) : null}

      <Text style={styles.boletaFooter}>
        Generada por {boleta.UsuarioCierre ?? 'sistema'} · {formatFechaHora(boleta.FechaCierre)}
      </Text>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && { color: accent }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={[styles.kpiVal, accent && { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLbl}>{label}</Text>
    </View>
  );
}

function badgeColor(estado: string) {
  const e = estado.toUpperCase();
  if (e === 'COMPLETADA') return { color: Colors.success };
  if (e === 'INCOMPLETA') return { color: Colors.error };
  if (e === 'EN_PROCESO') return { color: Colors.sky[700] };
  return { color: Colors.muted };
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate[700],
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  helperText: { fontSize: 12, color: Colors.muted, marginTop: 4 },

  // Selector de turnos
  emptyBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: Colors.amber[50],
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { color: Colors.amber[800], fontSize: 12, flex: 1 },
  turnoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
  },
  turnoTitle: { fontSize: 14, fontWeight: '800', color: Colors.foreground },
  turnoBadge: { fontWeight: '600', color: Colors.muted, fontSize: 12 },
  turnoMeta: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  turnoRol: { fontSize: 11, color: Colors.sky[700], fontWeight: '700', marginTop: 2 },
  turnoCerrado: { fontSize: 10, color: Colors.amber[800], marginTop: 4 },

  // Preview
  previewCard: {},
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewTitle: { fontSize: 16, fontWeight: '900', color: Colors.foreground, letterSpacing: 0.4 },
  previewMeta: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  previewFoot: { fontSize: 10, color: Colors.muted, marginTop: 8 },
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
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  infoLabel: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  infoValue: { fontSize: 12, color: Colors.foreground, fontWeight: '700' },
  justifTag: { fontSize: 10, fontWeight: '700' },

  // Boleta consolidada
  boletaCard: {},
  boletaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.slate[200],
  },
  boletaTitle: { fontSize: 14, fontWeight: '900', color: Colors.foreground, letterSpacing: 0.4 },
  boletaMeta: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  estadoCerrado: { backgroundColor: Colors.successLight },
  estadoInconclusa: { backgroundColor: Colors.amber[100] },
  estadoBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  bannerInconclusa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: Colors.amber[50],
    borderRadius: Radius.md,
  },
  bannerInconclusaText: { fontSize: 11, color: Colors.amber[800], flex: 1, lineHeight: 15 },
  section: { marginTop: 12 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.sky[800],
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 12,
  },
  rowLabel: { fontSize: 11, color: Colors.muted, flexShrink: 0 },
  rowValue: { fontSize: 12, fontWeight: '700', color: Colors.foreground, flex: 1, textAlign: 'right' },
  observ: { fontSize: 12, color: Colors.foreground, fontStyle: 'italic' },
  boletaFooter: { fontSize: 10, color: Colors.muted, marginTop: 14, textAlign: 'center' },

  // misc
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: Colors.error, fontSize: 12, flex: 1 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.slate[300],
    borderRadius: Radius.md,
    padding: 10,
    fontSize: 13,
    color: Colors.foreground,
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
