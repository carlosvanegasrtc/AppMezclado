import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Save, Printer, ChevronRight, X, CheckCircle2, Circle, AlertTriangle, WifiOff } from 'lucide-react-native';
import { AppBar }    from '@components/ui/AppBar';
import { Card }      from '@components/ui/Card';
import { Screen }    from '@components/ui/Screen';
import { AppButton } from '@components/ui/AppButton';
import { Colors, Radius } from '@constants/index';
import { useAuthStore }     from '@store/authStore';
import { useRegistrarSaco } from '@hooks/useMezcla';
import { useHaptics }       from '@hooks/useHaptics';
import { useTsplPrinter, type PrinterStatus } from '@hooks/useTsplPrinter';
import { normalizeError }   from '@utils/networkError';
import type { AppStackParamList } from '@navigation/types';
import type { BtDevice }          from '@native/TsplPrinter';
import type { RegistrarSacoResponse } from '@/types/mezcla';

type Nav   = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'RegistrarSaco'>;

const STATUS_COLOR: Record<PrinterStatus, string> = {
  none:         Colors.hint,
  connecting:   '#f59e0b',
  connected:    Colors.success,
  disconnected: Colors.muted,
  printing:     '#3b82f6',
};
const STATUS_LABEL: Record<PrinterStatus, string> = {
  none:         'Sin impresora',
  connecting:   'Conectando…',
  connected:    'Conectada',
  disconnected: 'Inactiva — toca para reconectar',
  printing:     'Imprimiendo…',
};

// ╔══════════════════════════════════════════════════════════════╗
// ║  RegistrarSacoScreen                                        ║
// ╚══════════════════════════════════════════════════════════════╝
export function RegistrarSacoScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { idOrdenProduccionMZCL } = route.params;

  const session   = useAuthStore((s) => s.session);
  const haptics   = useHaptics();
  const registrar = useRegistrarSaco();
  const printer   = useTsplPrinter();

  const [pesoStr,      setPesoStr]      = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);

  const printerReady       = printer.status !== 'none';
  const printerDisconnected = printer.status === 'disconnected';
  const peso               = parseFloat(pesoStr.replace(',', '.'));
  const canSubmit          = printerReady && !Number.isNaN(peso) && peso > 0 && !registrar.isPending;

  // ── Abrir sheet de selección ───────────────────────────────────────
  const openSheet = async () => {
    setSheetVisible(true);
    try {
      await printer.loadPairedDevices();
    } catch (err) {
      setSheetVisible(false);
      Alert.alert('Sin acceso Bluetooth', normalizeError(err).message);
    }
  };

  // ── Guardar saco e imprimir automáticamente ───────────────────────
  const onSubmit = async () => {
    if (!session) { Alert.alert('Sesión inválida'); return; }
    try {
      const result = await registrar.mutateAsync({
        idOrdenProduccionMZCL,
        pesoKg:          peso,
        usuarioRegistro: session.nombreCompleto ?? session.nombreEmpleado,
        idEmpleado:      session.idEmpleado,
        nombreEmpleado:  session.nombreEmpleado,
      });
      haptics.success();
      const res = result as unknown as RegistrarSacoResponse;
      setPesoStr('');
      doprint(res);
    } catch (err) {
      haptics.error();
      Alert.alert('Error', normalizeError(err).message);
    }
  };

  // ── Imprimir (conecta si es necesario) ────────────────────────────
  const doprint = async (saco: RegistrarSacoResponse) => {
    try {
      await printer.print({
        codigo:  saco.codigoBarra,
        formula: saco.codigoFormula,
        pesoKg:  saco.pesoKg,
      });
      haptics.success();
    } catch (err) {
      haptics.error();
      Alert.alert('Error de impresión', normalizeError(err).message);
    }
  };

  // ── Seleccionar dispositivo desde el sheet ─────────────────────────
  const onSelectDevice = async (device: BtDevice) => {
    setSheetVisible(false);
    try {
      await printer.selectPrinter(device);
    } catch (err) {
      Alert.alert('Error BT', normalizeError(err).message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <Screen edges={['top']} bg={Colors.slate[50]}>
      <AppBar title="Registrar saco" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          {/* ─ 1. Estado de la impresora (SIEMPRE VISIBLE, ARRIBA) ─ */}
          <PrinterStatusBar
            device={printer.savedDevice}
            status={printer.status}
            onPress={openSheet}
          />

          {/* ─ 2. Banner bloqueante si no hay impresora configurada ─ */}
          {!printerReady && (
            <View style={styles.noPrinterBanner}>
              <AlertTriangle size={18} color="#92400e" strokeWidth={2} />
              <Text style={styles.noPrinterText}>
                Vincula una impresora para poder registrar sacos.
                Toca el indicador de arriba para seleccionarla.
              </Text>
            </View>
          )}

          {/* ─ 2b. Aviso no bloqueante si la impresora se desconectó ─ */}
          {printerDisconnected && (
            <View style={styles.disconnectedBanner}>
              <WifiOff size={15} color="#b45309" strokeWidth={2} />
              <Text style={styles.disconnectedText}>
                Impresora inactiva — al guardar se intentará reconectar automáticamente.
              </Text>
            </View>
          )}

          {/* ─ 3. Formulario (deshabilitado si no hay impresora) ─── */}
          <View style={[styles.formWrap, !printerReady && styles.formDisabled]}>
            <Card radius={Radius.lg}>
              <Text style={styles.label}>Peso del saco (kg)</Text>
              <TextInput
                value={pesoStr}
                onChangeText={(v) => setPesoStr(v.replace(/[^\d.,]/g, ''))}
                placeholder="0.00"
                placeholderTextColor={Colors.hint}
                keyboardType="decimal-pad"
                style={styles.pesoInput}
                editable={printerReady}
                autoFocus={printerReady}
              />
              <View style={{ height: 18 }} />
              <AppButton
                label={printerDisconnected ? 'Guardar y reconectar' : 'Guardar saco'}
                onPress={onSubmit}
                disabled={!canSubmit}
                loading={registrar.isPending}
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={
                  printerDisconnected
                    ? <WifiOff size={18} color={Colors.white} strokeWidth={2.4} />
                    : <Save    size={18} color={Colors.white} strokeWidth={2.4} />
                }
              />
            </Card>
          </View>

          <Text style={styles.hint}>
            Pesa el saco completo antes de registrar. El peso se suma
            automáticamente a la producción de la orden.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─ Sheet de selección de dispositivo ─ */}
      <PrinterSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        devices={printer.pairedDevices}
        loading={printer.loadingDevices}
        currentMac={printer.savedDevice?.mac}
        onSelect={onSelectDevice}
      />
    </Screen>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  PrinterStatusBar                                           ║
// ╚══════════════════════════════════════════════════════════════╝
function PrinterStatusBar({
  device, status, onPress,
}: { device: BtDevice | null; status: PrinterStatus; onPress: () => void }) {
  const color  = STATUS_COLOR[status];
  const isBusy = status === 'connecting' || status === 'printing';

  return (
    <TouchableOpacity style={styles.printerBar} onPress={onPress} activeOpacity={0.75}>
      <Printer size={18} color={color} strokeWidth={2.2} />

      <View style={styles.printerInfo}>
        <Text style={[styles.printerName, !device && { color: Colors.hint }]} numberOfLines={1}>
          {device ? device.name : 'Sin impresora — toca para vincular'}
        </Text>
        <Text style={[styles.printerStatusText, { color }]}>
          {STATUS_LABEL[status]}
        </Text>
      </View>

      {isBusy
        ? <ActivityIndicator size="small" color={color} />
        : <View style={[styles.dot, { backgroundColor: color }]} />}

      <ChevronRight size={14} color={Colors.hint} strokeWidth={2} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  PrinterSheet                                               ║
// ╚══════════════════════════════════════════════════════════════╝
function PrinterSheet({
  visible, onClose, devices, loading, currentMac, onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  devices: BtDevice[];
  loading: boolean;
  currentMac?: string;
  onSelect: (d: BtDevice) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Impresora Bluetooth</Text>
            <TouchableOpacity onPress={onClose} hitSlop={14}>
              <X size={20} color={Colors.slate[500]} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetSub}>Dispositivos vinculados en este Android</Text>

          {/* Lista */}
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.slate[400]} />
              <Text style={styles.loadingText}>Buscando dispositivos…</Text>
            </View>
          ) : devices.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay dispositivos Bluetooth vinculados.{'\n'}
              Ve a Ajustes → Bluetooth en Android para vincular la impresora primero.
            </Text>
          ) : (
            devices.map((d) => {
              const sel = d.mac.toUpperCase() === currentMac?.toUpperCase();
              return (
                <TouchableOpacity
                  key={d.mac}
                  style={[styles.deviceRow, sel && styles.deviceRowSel]}
                  onPress={() => onSelect(d)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deviceName, sel && { color: '#15803d' }]}>{d.name}</Text>
                    <Text style={styles.deviceMac}>{d.mac}</Text>
                  </View>
                  {sel
                    ? <CheckCircle2 size={18} color={Colors.success} strokeWidth={2.2} />
                    : <Circle       size={18} color={Colors.hint}    strokeWidth={1.8} />}
                </TouchableOpacity>
              );
            })
          )}

          <Text style={styles.sheetHint}>
            Si no ves tu impresora, vincúlala primero en Ajustes → Bluetooth de Android.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },

  // ── Printer bar ──
  printerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.slate[100],
    gap: 10,
  },
  printerInfo:       { flex: 1 },
  printerName:       { fontSize: 14, fontWeight: '600', color: Colors.slate[800] },
  printerStatusText: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  // ── No-printer banner ──
  noPrinterBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fef3c7',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 12,
  },
  noPrinterText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },

  // ── Disconnected banner ──
  disconnectedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#fcd34d',
    padding: 10,
  },
  disconnectedText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 17,
  },

  // ── Form ──
  formWrap:     {},
  formDisabled: { opacity: 0.45 },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[700],
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pesoInput: {
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate[200],
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '900',
    color: Colors.foreground,
    textAlign: 'center',
    letterSpacing: 1,
  },
  hint: { fontSize: 12, color: Colors.muted, lineHeight: 18, paddingHorizontal: 4 },

  // ── Sheet ──
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle:  { fontSize: 17, fontWeight: '700', color: Colors.slate[900] },
  sheetSub:    { fontSize: 12, color: Colors.muted, marginBottom: 12 },
  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  loadingText: { fontSize: 14, color: Colors.muted },
  emptyText:   { fontSize: 13, color: Colors.muted, lineHeight: 20, paddingVertical: 12 },

  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginBottom: 4,
    backgroundColor: Colors.slate[50],
  },
  deviceRowSel: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  deviceName: { fontSize: 14, fontWeight: '600', color: Colors.slate[800] },
  deviceMac:  { fontSize: 11, color: Colors.muted, marginTop: 1 },
  sheetHint:  { fontSize: 11, color: Colors.hint, lineHeight: 16, marginTop: 8 },
});
