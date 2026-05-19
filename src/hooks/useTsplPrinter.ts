import { useState, useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TsplPrinter, type BtDevice, type TsplLabelData } from '@native/TsplPrinter';

const MAC_KEY  = 'tspl_printer_mac';
const NAME_KEY = 'tspl_printer_name';

export type PrinterStatus = 'none' | 'connecting' | 'connected' | 'disconnected' | 'printing';

// Solicita BLUETOOTH_CONNECT en Android 12+ (API 31+). Retorna true si se puede continuar.
async function ensureBluetoothPermission(): Promise<{ granted: boolean; message?: string }> {
  if (Platform.OS !== 'android') return { granted: true };
  if (Platform.Version < 31)    return { granted: true }; // < Android 12: no necesita runtime perm

  const perm = 'android.permission.BLUETOOTH_CONNECT' as const;
  const current = await PermissionsAndroid.check(perm);
  if (current) return { granted: true };

  const result = await PermissionsAndroid.request(perm, {
    title:         'Permiso Bluetooth requerido',
    message:       'La app necesita acceso Bluetooth para conectar la impresora de etiquetas.',
    buttonPositive: 'Permitir',
    buttonNegative: 'Cancelar',
  });

  if (result === PermissionsAndroid.RESULTS.GRANTED) return { granted: true };
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return {
      granted: false,
      message: 'Permiso Bluetooth denegado permanentemente.\nVe a Ajustes → Apps → Mezcla → Permisos → Bluetooth y actívalo manualmente.',
    };
  }
  return { granted: false, message: 'Permiso Bluetooth no otorgado.' };
}

export function useTsplPrinter() {
  const [savedDevice,    setSavedDevice]    = useState<BtDevice | null>(null);
  const [status,         setStatus]         = useState<PrinterStatus>('none');
  const [pairedDevices,  setPairedDevices]  = useState<BtDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Carga la impresora guardada al montar y verifica si la conexión sigue activa
  const loadSaved = useCallback(async () => {
    const mac  = await SecureStore.getItemAsync(MAC_KEY);
    const name = await SecureStore.getItemAsync(NAME_KEY);
    if (!mac) { setSavedDevice(null); setStatus('none'); return; }

    const device: BtDevice = { mac, name: name ?? mac };
    setSavedDevice(device);

    try {
      const connected  = await TsplPrinter.isConnected();
      const currentMac = await TsplPrinter.getConnectedMac();
      setStatus(connected && currentMac === mac.toUpperCase() ? 'connected' : 'disconnected');
    } catch {
      setStatus('disconnected');
    }
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  // Lista todos los dispositivos Bluetooth emparejados en el sistema Android
  const loadPairedDevices = useCallback(async () => {
    const perm = await ensureBluetoothPermission();
    if (!perm.granted) {
      setPairedDevices([]);
      throw new Error(perm.message ?? 'Sin permiso Bluetooth');
    }

    setLoadingDevices(true);
    try {
      const devices = await TsplPrinter.getPairedDevices();
      setPairedDevices(devices);
    } catch (e: any) {
      setPairedDevices([]);
      throw e;
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  // Guarda el dispositivo elegido y establece la conexión SPP
  const selectPrinter = useCallback(async (device: BtDevice) => {
    await SecureStore.setItemAsync(MAC_KEY,  device.mac);
    await SecureStore.setItemAsync(NAME_KEY, device.name);
    setSavedDevice(device);
    setStatus('connecting');
    try {
      await TsplPrinter.connectPrinter(device.mac);
      setStatus('connected');
    } catch (e: any) {
      setStatus('disconnected');
      throw new Error(`No se pudo conectar con ${device.name}: ${e?.message ?? e}`);
    }
  }, []);

  // Reconecta si la conexión cayó
  const ensureConnected = useCallback(async (mac: string) => {
    const connected  = await TsplPrinter.isConnected();
    const currentMac = await TsplPrinter.getConnectedMac();
    if (connected && currentMac === mac.toUpperCase()) return;
    setStatus('connecting');
    await TsplPrinter.connectPrinter(mac);
    setStatus('connected');
  }, []);

  // Conecta (si es necesario) e imprime la etiqueta
  const print = useCallback(async (data: TsplLabelData) => {
    const mac = savedDevice?.mac ?? (await SecureStore.getItemAsync(MAC_KEY));
    if (!mac) throw new Error('Sin impresora configurada. Toca el indicador de impresora para vincular una.');

    await ensureConnected(mac);
    setStatus('printing');
    try {
      await TsplPrinter.printSacoLabel(data);
      setStatus('connected');
    } catch (e) {
      setStatus('disconnected');
      throw e;
    }
  }, [savedDevice, ensureConnected]);

  const disconnect = useCallback(async () => {
    await TsplPrinter.disconnectPrinter();
    setStatus(savedDevice ? 'disconnected' : 'none');
  }, [savedDevice]);

  return {
    savedDevice,
    status,
    pairedDevices,
    loadingDevices,
    loadPairedDevices,
    selectPrinter,
    print,
    disconnect,
    reload: loadSaved,
  };
}
