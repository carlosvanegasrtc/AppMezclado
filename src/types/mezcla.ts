/**
 * Tipos del dominio Mezcla — espejo del backend `produccion-mezcla`.
 * Mantén estos shapes alineados con `interface/dto/planificacionMezcla.interface.ts`.
 */

// ── Estados de orden ────────────────────────────────────
export type EstadoMezcla =
  | 'PLANIFICADA'
  | 'AUTORIZADA'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'INCOMPLETA';

// ── Resumen de orden de producción del operario ─────────
/** Cabecera devuelta por POST /resumen/empleado y GET /resumen-ordenes-mezcla. */
export interface ResumenOrdenMezcla {
  IdOrdenProduccionMZCL: number;
  IdPlanificacionMezcla: number;
  NumeroOrdenMezcla: string;
  FechaProduccion: string;       // 'YYYY-MM-DD'
  FechaTurno?: string | null;
  IdTurno?: number | null;
  HoraInicioTurno?: string | null;
  HoraFinTurno?: string | null;
  TipoTurno?: string | null;
  CodigoFormula: string;
  DescripcionFormula?: string | null;
  KgPlanificados: number;
  KgProducidos: number;
  PorcentajeCumplimiento: number;
  TotalSacos: number;
  IdEstadoMezcla?: number | null;
  Estado: EstadoMezcla | string;
  IdEmpleado?: number | null;
  NombreEmpleado?: string | null;
  RolEnTurno?: string | null;
  FechaInicioProduccion?: string | null;
  FechaFinProduccion?: string | null;
  KgPorHoraReal?: number | null;
  Observaciones?: string | null;
}

// ── Empleado asignado a una orden ───────────────────────
export interface EmpleadoAsignado {
  IdEmpleado: number;
  CodigoFactorh?: string | null;
  Nombre: string;
  Puesto?: string | null;
  RolEnTurno?: string | null;
  Departamento?: string | null;
}

// ── Saco producido ──────────────────────────────────────
export interface SacoMezcla {
  IdSacoProduccionMZCL: number;
  IdOrdenProduccionMZCL: number;
  CodigoBarra: string;
  PesoKg: number;
  UsuarioRegistro: string;
  FechaRegistro: string;
  IdBodega?: number | null;
  UbicacionFisica?: string | null;
  EstadoBodega?: string | null;
  FechaRecepcionBodega?: string | null;
}

/** Respuesta del endpoint POST /sacos/registrar (camelCase del microservicio) */
export interface RegistrarSacoResponse {
  idSacoProduccionMZCL: number;
  codigoBarra: string;
  codigoBarraAutoGen: boolean;
  pesoKg: number;
  usuarioRegistro: string;
  fechaRegistro: string;
  idOrdenProduccionMZCL: number;
  numeroOrdenMezcla: string;
  idPlanificacionMezcla: number;
  idPlanificacionMezclaDetalle: number;
  cantidadKgPlanificada: number;
  cantidadKgProducida: number;
  cantidadKgPendiente: number;
  codigoFormula: string;
}

// ── Detalle (cabecera + fórmulas + sacos) ───────────────
export interface DetalleOrdenMezcla {
  orden: ResumenOrdenMezcla;
  sacos: SacoMezcla[];
  empleados: EmpleadoAsignado[];
}

// ── Incidencia ──────────────────────────────────────────
export interface IncidenciaMezcla {
  IdIncidencia?: number;
  IdEmpleado: number;
  IdProduccion: number;       // IdOrdenProduccionMZCL
  FechaTurno: string;          // 'YYYY-MM-DD'
  CodigoFormula: string;
  Descripcion: string;
  FechaRegistro?: string;
  NombreEmpleado?: string | null;
  NumeroOrdenMezcla?: string | null;
}

// ── Cumplimiento (rendimiento histórico) ────────────────
export interface CumplimientoMezcla {
  FechaProduccion: string;
  CodigoFormula: string;
  KgPlanificados: number;
  KgProducidos: number;
  PorcentajeCumplimiento: number;
  TotalSacos: number;
  IdOrdenProduccionMZCL?: number;
  EstadoCodigo?: string;
  EstadoDescripcion?: string;
  MotivoCierreCodigo?: string | null;
  MotivoCierreDescripcion?: string | null;
  MotivoJustificado?: boolean | null;
  AfectaCumplimiento?: boolean;
}

// ── Payloads ────────────────────────────────────────────
export interface RegistrarSacoPayload {
  idOrdenProduccionMZCL: number;
  pesoKg: number;
  usuarioRegistro: string;
  idEmpleado?: number;
  nombreEmpleado?: string;
}

export interface CompletarOrdenPayload {
  usuarioCierre: string;
  observaciones?: string;
  horaFin?: string;
  idEmpleado?: number;
  ordenProduccion?: string;
  fechaTurno?: string;
  codigoFormula?: string;
  idMotivoCierre?: number;
}

export interface MotivoCierreMezcla {
  IdMotivoCierre: number;
  Codigo: string;
  Descripcion: string;
  Justificado: boolean;
  Activo: boolean;
}

export interface CumplimientoKpis {
  IdEmpleado: number | null;
  FechaInicio: string;
  FechaFin: string;
  TotalOrdenes: number;
  OrdenesCompletadas: number;
  OrdenesIncompletas: number;
  OrdenesJustificadas: number;
  KgPlanificadoBruto: number;
  KgProducidoBruto: number;
  PorcentajeCumplimientoBruto: number;
  KgPlanificadoNeto: number;
  KgProducidoNeto: number;
  PorcentajeCumplimientoNeto: number;
}

export interface MotivoTopRow {
  MotivoCodigo: string;
  MotivoDescripcion: string;
  Justificado: boolean;
  Veces: number;
  KgNoProducidos: number;
}

export interface CumplimientoBrutoNeto {
  kpis: CumplimientoKpis | null;
  motivos: MotivoTopRow[];
}

export interface RegistrarIncidenciaPayload {
  idEmpleado: number;
  idProduccion: number;
  fechaTurno: string;          // 'YYYY-MM-DD'
  codigoFormula: string;
  descripcion: string;
}

// ── Boleta de cierre de turno (Mezcla) ─────────────────────────

export interface TurnoActivoEmpleado {
  idTurnoPlanificacionMezcla: number;
  idPlanificacionMezcla: number;
  numeroOrdenMezcla: string | null;
  numeroTurno: number;
  tipoTurno: string | null;
  fechaTurno: string;
  horaInicio: string | null;
  horaFin: string | null;
  totalProgramadoKg: number | null;
  estadoOrdenCodigo: string | null;
  rolEnTurno: string | null;
  yaTieneBoleta: boolean;
}

export interface PreviewBoletaMezcla {
  turnoEncontrado: boolean;
  idTurnoPlanificacionMezcla: number;
  idPlanificacionMezcla: number;
  numeroOrdenMezcla: string | null;
  numeroTurno: number;
  tipoTurno: string | null;
  fechaTurno: string;
  numOrdenesProduccion: number;
  numFormulasPlanificadas: number;
  numFormulasProducidas: number;
  kgPlanificados: number;
  kgProducidos: number;
  porcentajeCumplimiento: number;
  desviacionKg: number;
  sacosProducidos: number;
  sacosRecibidosBodega: number;
  pesoPromedioSacoKg: number | null;
  estadoOrdenCodigo: string | null;
  idMotivoCierre: number | null;
  motivoCierreCodigo: string | null;
  motivoJustificado: boolean | null;
  numIncidencias: number;
  kgNoProducidosIncidencias: number;
  mensaje?: string;
}

export interface BoletaMezcla {
  IdCierre: number;
  IdTurnoPlanificacionMezcla: number;
  IdPlanificacionMezcla: number;
  NumeroOrdenMezcla: string | null;
  IdEmpleado: number;
  CodigoEmpleadoBio: number | null;
  NombreEmpleado: string | null;
  NumeroTurno: number;
  TipoTurno: string | null;
  FechaTurno: string;
  HoraInicioPlan: string;
  HoraFinPlan: string;
  NumOrdenesProduccion: number;
  NumFormulasPlanificadas: number;
  NumFormulasProducidas: number;
  KgPlanificados: number;
  KgProducidos: number;
  PorcentajeCumplimiento: number;
  DesviacionKg: number;
  SacosProducidos: number;
  SacosRecibidosBodega: number;
  PesoPromedioSacoKg: number | null;
  EstadoOrdenCodigo: string | null;
  IdMotivoCierre: number | null;
  MotivoCierreCodigo: string | null;
  MotivoJustificado: boolean | null;
  NumIncidencias: number;
  KgNoProducidosIncidencias: number;
  HoraEntradaBio: string | null;
  HoraSalidaBio: string | null;
  TieneEntrada: boolean;
  TieneSalida: boolean;
  MinutosTarde: number | null;
  MinutosTardePenalizables: number | null;
  MinutosSalidaTemprana: number | null;
  MinutosSalidaTempranaPenalizables: number | null;
  RetiroTemprano: boolean;
  MinutosTrabajados: number | null;
  PagaExtras: boolean;
  ObservacionesBio: string | null;
  Estado: 'CERRADO' | 'INCONCLUSA' | 'ANULADO';
  UsuarioCierre: string | null;
  FechaCierre: string;
  Observaciones: string | null;
  exitoso?: boolean;
}

export interface CerrarBoletaMezclaPayload {
  idTurnoPlanificacionMezcla: number;
  idEmpleado: number;
  usuario?: string;
  observaciones?: string;
}

// ── Componente de fórmula SAP ───────────────────────────
export interface ComponenteFormula {
  code: string;
  itemName: string;
  quantity: number;
  marca?: string | null;
}

export interface FormulaConComponentes {
  formula: string;
  componentes: ComponenteFormula[];
}

// ── Helpers de UI ───────────────────────────────────────
export const ESTADO_MEZCLA_LABEL: Record<string, string> = {
  PLANIFICADA: 'Planificada',
  AUTORIZADA: 'Autorizada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  INCOMPLETA: 'Incompleta',
};
