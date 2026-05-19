/**
 * InsumosScreen — Confirmar recepción de insumos de mezcla.
 *
 * Lo ve el "Responsable recepción de insumos" al entrar desde OrdenDetalleScreen.
 * Muestra la lista de componentes y, si está DESPACHADO, permite confirmar con PIN.
 */
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2, Clock, Package, RefreshCcw } from 'lucide-react-native';
import { AppBar } from '@components/ui/AppBar';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { Skeleton } from '@components/ui/Skeleton';
import { Colors, Radius } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import { mezclaService } from '@services/MezclaService';
import type { AppStackParamList } from '@navigation/types';
import type { DetalleSolicitudInsumos } from '@/types/insumos';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'Insumos'>;

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return iso.substring(0, 10);
  } catch {
    return iso;
  }
}

export function InsumosScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { idSolicitud } = route.params;
  const session = useAuthStore((s) => s.session);

  const [detalle, setDetalle] = useState<DetalleSolicitudInsumos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const cargarDetalle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mezclaService.getDetalleSolicitudInsumos(idSolicitud);
      setDetalle(data);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar detalle de insumos');
    } finally {
      setLoading(false);
    }
  }, [idSolicitud]);

  React.useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const confirmarRecepcion = useCallback(async () => {
    if (!session) return;
    Alert.alert(
      'Confirmar recepción',
      `¿Confirmas la recepción de insumos como ${session.nombreEmpleado}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setConfirmando(true);
            try {
              await mezclaService.confirmarRecepcionInsumos(idSolicitud, {
                idEmpleado: session.idEmpleado,
                codigoEmpleado: session.idEmpleado,
                nombreEmpleado: session.nombreEmpleado,
                observaciones: observaciones.trim() || undefined,
              });
              await cargarDetalle();
              Alert.alert('Éxito', 'Recepción confirmada correctamente');
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo confirmar la recepción');
            } finally {
              setConfirmando(false);
            }
          },
        },
      ]
    );
  }, [idSolicitud, session, observaciones, cargarDetalle]);

  const estado = detalle?.header?.Estado;

  return (
    <Screen edges={['top']} bg={Colors.slate[50]}>
      <AppBar
        title="Insumos de Mezcla"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={cargarDetalle} hitSlop={10} style={{ padding: 4 }}>
            <RefreshCcw size={18} color={Colors.sky[600]} strokeWidth={2.2} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.body}>
          <Skeleton height={140} style={{ borderRadius: Radius.lg, marginBottom: 12 }} />
          <Skeleton height={220} style={{ borderRadius: Radius.lg }} />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={cargarDetalle} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : detalle ? (
        <ScrollView contentContainerStyle={styles.body}>

          {/* ── Header ── */}
          <Card style={styles.headerCard} radius={Radius.lg}>
            <View style={styles.row}>
              <Text style={styles.ordenText}>{detalle.header.NumeroOrdenMezcla}</Text>
              <View style={[styles.badge, estadoBadgeColor(estado)]}>
                <Text style={styles.badgeText}>{estado ?? '—'}</Text>
              </View>
            </View>
            <Text style={styles.metaText}>
              Producción: {formatFecha(detalle.header.FechaProduccion)}
            </Text>
            {detalle.header.NombreResponsable ? (
              <Text style={styles.metaText}>
                Responsable: {detalle.header.NombreResponsable}
              </Text>
            ) : null}
            <Text style={styles.kgText}>
              Total: {Number(detalle.header.TotalKgSolicitados ?? 0).toFixed(1)} kg
            </Text>
          </Card>

          {/* ── Estado informativo ── */}
          {estado === 'PENDIENTE' && (
            <View style={styles.statusBox}>
              <Clock size={20} color={Colors.warning} />
              <Text style={[styles.statusText, { color: Colors.warning }]}>
                Esperando despacho de bodega
              </Text>
            </View>
          )}

          {estado === 'CONFIRMADO' && (
            <View style={styles.statusBox}>
              <CheckCircle2 size={20} color={Colors.success} />
              <Text style={[styles.statusText, { color: Colors.success }]}>
                Recepción confirmada
                {detalle.header.FechaConfirmacion
                  ? ` · ${formatFecha(detalle.header.FechaConfirmacion)}`
                  : ''}
              </Text>
            </View>
          )}

          {/* ── Componentes ── */}
          <Card style={styles.compCard} radius={Radius.lg}>
            <View style={styles.secHeader}>
              <Package size={16} color={Colors.sky[600]} strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>Componentes ({detalle.componentes.length})</Text>
            </View>

            {detalle.componentes.length === 0 ? (
              <Text style={styles.emptyText}>Sin componentes registrados</Text>
            ) : (
              detalle.componentes.map((comp, i) => (
                <View
                  key={comp.IdDetalle ?? i}
                  style={[styles.compRow, i > 0 && styles.compRowBorder]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compCodigo}>{comp.CodigoSAP}</Text>
                    <Text style={styles.compNombre} numberOfLines={2}>
                      {comp.NombreComponente}
                    </Text>
                  </View>
                  <Text style={styles.compKg}>
                    {Number(comp.KgNecesarios ?? 0).toFixed(3)} {comp.Unidad ?? 'KG'}
                  </Text>
                </View>
              ))
            )}
          </Card>

          {/* ── Formulario de confirmación (solo si DESPACHADO) ── */}
          {estado === 'DESPACHADO' && (
            <Card style={styles.confirmCard} radius={Radius.lg}>
              <Text style={styles.confirmTitle}>Confirmar recepción</Text>
              <Text style={styles.confirmSubtitle}>
                Se registrará como firma de: <Text style={{ fontWeight: '700' }}>{session?.nombreEmpleado}</Text>
              </Text>

              <TextInput
                style={styles.observInput}
                placeholder="Observaciones (opcional)"
                placeholderTextColor={Colors.slate[400]}
                multiline
                numberOfLines={3}
                value={observaciones}
                onChangeText={setObservaciones}
              />

              <TouchableOpacity
                style={[styles.confirmBtn, confirmando && styles.confirmBtnDisabled]}
                onPress={confirmarRecepcion}
                disabled={confirmando}
              >
                {confirmando ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>CONFIRMAR RECEPCIÓN</Text>
                )}
              </TouchableOpacity>
            </Card>
          )}

        </ScrollView>
      ) : null}
    </Screen>
  );
}

function estadoBadgeColor(estado?: string) {
  switch (estado) {
    case 'DESPACHADO': return { backgroundColor: '#2980B9' };
    case 'CONFIRMADO': return { backgroundColor: Colors.success };
    case 'RECHAZADO': return { backgroundColor: Colors.error };
    default: return { backgroundColor: Colors.warning }; // PENDIENTE
  }
}

const styles = StyleSheet.create({
  body: {
    padding: 16,
    gap: 12,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.error,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: Colors.sky[600],
    borderRadius: Radius.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  headerCard: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ordenText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
  },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 13,
    color: Colors.slate[600],
    marginBottom: 2,
  },
  kgText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
    marginTop: 4,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  compCard: {
    padding: 16,
  },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate[500],
    fontStyle: 'italic',
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  compRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate[100],
  },
  compCodigo: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sky[700],
  },
  compNombre: {
    fontSize: 13,
    color: Colors.black,
    marginTop: 1,
  },
  compKg: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.black,
    marginLeft: 8,
  },
  confirmCard: {
    padding: 16,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: Colors.slate[600],
    marginBottom: 12,
  },
  observInput: {
    borderWidth: 1,
    borderColor: Colors.slate[200],
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.black,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  confirmBtn: {
    backgroundColor: Colors.sky[600],
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
