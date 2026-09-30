/**
 * EscanerScreen — escáner full-screen para códigos de barras de super sacos.
 *
 * Usa CameraView.launchScanner() (Google ML Kit nativo) en lugar de renderizar
 * un CameraView, evitando el bug de pantalla negra en Android con New Architecture.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Keyboard as KeyboardIcon, ScanLine, X } from 'lucide-react-native';
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
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const handledRef = useRef(false);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  const deliverCode = useCallback((rawCode: string) => {
    const code = rawCode.trim();
    if (!code || handledRef.current) return;
    handledRef.current = true;
    haptics.success();
    if (typeof idOrdenProduccionMZCL === 'number') {
      navigation.replace('RegistrarSaco', { idOrdenProduccionMZCL });
    } else {
      navigation.goBack();
    }
  }, [idOrdenProduccionMZCL, haptics, navigation]);

  const launchNativeScanner = useCallback(async () => {
    if (handledRef.current || scanning) return;
    setScanning(true);

    subscriptionRef.current?.remove();
    subscriptionRef.current = CameraView.onModernBarcodeScanned((result) => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      deliverCode(result.data);
    });

    try {
      await CameraView.launchScanner({
        barcodeTypes: ['itf14', 'code128', 'ean13', 'ean8', 'code39', 'qr'],
      });
    } catch {
      // Scanner dismissed without scanning
    } finally {
      setScanning(false);
    }
  }, [scanning, deliverCode]);

  // Lanzar el escáner automáticamente al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      handledRef.current = false;
      launchNativeScanner();
      return () => {
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
        CameraView.dismissScanner();
      };
    }, [])
  );

  // Solicitar permiso si aún no fue otorgado
  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  return (
    <View style={styles.root}>
      {/* Fondo oscuro con indicador */}
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          {scanning
            ? <ActivityIndicator color={Colors.sky[400]} size="large" />
            : <ScanLine size={56} color={Colors.sky[400]} strokeWidth={1.8} />}
        </View>
        <Text style={styles.title}>Escanear super saco</Text>
        <Text style={styles.subtitle}>
          {scanning
            ? 'Escáner abierto — apunta al código de barras'
            : 'Toca "Abrir escáner" para iniciar'}
        </Text>

        {!scanning && (
          <AppButton
            label="Abrir escáner"
            onPress={launchNativeScanner}
            variant="primary"
            size="lg"
            style={{ marginTop: 24 }}
            leftIcon={<ScanLine size={18} color={Colors.white} strokeWidth={2.2} />}
          />
        )}

        <Pressable
          onPress={() => setManualOpen(true)}
          android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
          style={styles.manualBtn}
        >
          <KeyboardIcon size={18} color={Colors.white} strokeWidth={2.2} />
          <Text style={styles.manualText}>Ingresar código manual</Text>
        </Pressable>
      </View>

      {/* Botón cerrar */}
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.closeBtn}>
        <X size={22} color={Colors.white} strokeWidth={2.4} />
      </Pressable>

      {/* Modal entrada manual */}
      <Modal
        visible={manualOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setManualOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ingresar código</Text>
            <Text style={styles.modalDesc}>Escribe el código de barras del super saco.</Text>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Código del super saco"
              placeholderTextColor={Colors.hint}
              style={styles.modalInput}
              autoFocus
              autoCapitalize="characters"
            />
            <View style={styles.modalRow}>
              <AppButton
                label="Cancelar"
                onPress={() => { setManualOpen(false); setManualCode(''); }}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.sky[900] },
  closeBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    marginTop: 8,
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
