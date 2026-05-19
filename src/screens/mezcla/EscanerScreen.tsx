/**
 * EscanerScreen — escáner full-screen para códigos de barras de sacos de mezcla.
 *
 * Si fue invocado con `idOrdenProduccionMZCL` en params, navega a RegistrarSaco
 * con el código detectado. Si no, vuelve atrás con el código en params.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Flashlight, Keyboard as KeyboardIcon, X } from 'lucide-react-native';
import { Colors, Radius } from '@constants/index';
import { AppButton } from '@components/ui/AppButton';
import { useHaptics } from '@hooks/useHaptics';
import type { AppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'Escaner'>;

export function EscanerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { idOrdenProduccionMZCL } = route.params ?? {};
  const haptics = useHaptics();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const lastScanRef = useRef<{ code: string; ts: number } | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  const deliverCode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || handledRef.current) return;
    handledRef.current = true;
    haptics.success();
    if (typeof idOrdenProduccionMZCL === 'number') {
      navigation.replace('RegistrarSaco', { idOrdenProduccionMZCL });
    } else {
      navigation.goBack();
    }
  };

  const onScan = (codeRaw: string) => {
    const code = codeRaw.trim();
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.code === code && now - lastScanRef.current.ts < 2000) {
      return;
    }
    lastScanRef.current = { code, ts: now };
    haptics.selection();
    deliverCode(code);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.white} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>Cámara requerida</Text>
        <Text style={styles.permDesc}>
          Para escanear los códigos de los sacos necesitamos acceso a la cámara.
        </Text>
        <AppButton
          label="Permitir cámara"
          onPress={requestPermission}
          variant="primary"
          size="lg"
          style={{ marginTop: 16 }}
        />
        <AppButton
          label="Cancelar"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="md"
          style={{ marginTop: 8 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['itf14', 'code128', 'ean13', 'ean8', 'code39', 'qr'],
        }}
        onBarcodeScanned={(r) => onScan(r.data)}
      />

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.dimRow} />
        <View style={styles.midRow}>
          <View style={styles.dimSide} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimRow} />
      </View>

      <View style={styles.header} pointerEvents="box-none">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <X size={22} color={Colors.white} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>Escanear saco</Text>
        <Pressable onPress={() => setTorch((t) => !t)} hitSlop={12} style={styles.iconBtn}>
          <Flashlight size={22} color={torch ? Colors.amber[400] : Colors.white} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.footer} pointerEvents="box-none">
        <Text style={styles.hint}>
          Centra el código en el marco. Detección automática.
        </Text>
        <Pressable
          onPress={() => setManualOpen(true)}
          android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
          style={styles.manualBtn}
        >
          <KeyboardIcon size={18} color={Colors.white} strokeWidth={2.2} />
          <Text style={styles.manualText}>Ingresar código manual</Text>
        </Pressable>
      </View>

      <Modal
        visible={manualOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setManualOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ingresar código</Text>
            <Text style={styles.modalDesc}>Escribe el código de barras del saco.</Text>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Código del saco"
              placeholderTextColor={Colors.hint}
              style={styles.modalInput}
              autoFocus
              autoCapitalize="characters"
            />
            <View style={styles.modalRow}>
              <AppButton
                label="Cancelar"
                onPress={() => {
                  setManualOpen(false);
                  setManualCode('');
                }}
                variant="ghost"
                size="md"
                style={{ flex: 1 }}
              />
              <AppButton
                label="Usar"
                onPress={() => {
                  setManualOpen(false);
                  deliverCode(manualCode);
                  setManualCode('');
                }}
                variant="primary"
                size="md"
                disabled={manualCode.trim().length < 3}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FRAME_W = 280;
const FRAME_H = 140;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: Colors.sky[900],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  permDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center' },
  dimRow: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  midRow: { flexDirection: 'row', height: FRAME_H },
  dimSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  frame: { width: FRAME_W, height: FRAME_H, borderRadius: Radius.md },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: Colors.sky[400],
    borderWidth: 4,
  },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  footer: { position: 'absolute', bottom: 40, left: 16, right: 16, alignItems: 'center', gap: 14 },
  hint: { color: 'rgba(255,255,255,0.92)', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.lg,
  },
  manualText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    backgroundColor: Colors.surface,
    padding: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.foreground },
  modalDesc: { fontSize: 13, color: Colors.muted },
  modalInput: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.slate[100],
    borderRadius: Radius.md,
    color: Colors.foreground,
  },
  modalRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
