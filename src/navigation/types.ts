import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  DrawerMain: NavigatorScreenParams<DrawerParamList>;
  OrdenDetalle: { idOrdenProduccionMZCL: number };
  RegistrarSaco: { idOrdenProduccionMZCL: number };
  Escaner: { idOrdenProduccionMZCL?: number; mode?: 'BARCODE_GENERIC' };
  Incidencia: { idOrdenProduccionMZCL: number; codigoFormula?: string };
  CompletarOrden: { idOrdenProduccionMZCL: number };
  BoletaTurno: { idTurnoPlanificacionMezcla?: number; idEmpleado?: number } | undefined;
  Insumos: { idSolicitud: number };
};

export type DrawerParamList = {
  Home: undefined;
  Ordenes: undefined;
  Historial: undefined;
  Settings: undefined;
};
