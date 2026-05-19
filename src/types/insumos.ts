export interface SolicitudInsumos {
  IdSolicitud: number;
  NumeroOrdenMezcla: string;
  Estado: 'PENDIENTE' | 'DESPACHADO' | 'CONFIRMADO' | 'RECHAZADO';
  FechaProduccion: string;
  NombreResponsable: string | null;
  TotalKgSolicitados: number;
  CantidadComponentes?: number;
  FechaDespacho?: string | null;
  FechaConfirmacion?: string | null;
}

export interface ComponenteInsumo {
  IdDetalle: number;
  CodigoSAP: string;
  NombreComponente: string;
  KgNecesarios: number;
  KgDespachados: number | null;
  Unidad: string;
}

export interface DetalleSolicitudInsumos {
  header: SolicitudInsumos;
  componentes: ComponenteInsumo[];
}
