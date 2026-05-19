import { NativeModules, Platform } from 'react-native';

export interface TsplLabelData {
  codigo: string;
  formula: string;
  pesoKg: number;
}

export interface BtDevice {
  name: string;
  mac: string;
}

interface TsplPrinterNative {
  connectPrinter(macAddress: string): Promise<boolean>;
  printSacoLabel(data: TsplLabelData): Promise<boolean>;
  disconnectPrinter(): Promise<boolean>;
  isConnected(): Promise<boolean>;
  getConnectedMac(): Promise<string | null>;
  getPairedDevices(): Promise<BtDevice[]>;
}

const native = NativeModules.TsplPrinter as TsplPrinterNative | undefined;

if (__DEV__) {
  console.log('[TsplPrinter] module available:', !!native, '| platform:', Platform.OS);
}

const notAvailable = () =>
  Promise.reject(new Error('Módulo TsplPrinter no disponible. Verifica que la app fue compilada con el módulo nativo.'));

export const TsplPrinter: TsplPrinterNative =
  Platform.OS === 'android' && native
    ? native
    : {
        connectPrinter: notAvailable,
        printSacoLabel: notAvailable,
        disconnectPrinter: notAvailable,
        isConnected: () => Promise.resolve(false),
        getConnectedMac: () => Promise.resolve(null),
        getPairedDevices: () => Promise.resolve([]),
      };
