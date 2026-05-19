/**
 * Hooks de React Query para el dominio Mezcla.
 * Patrón espejo de useCalidad (AppCalidad).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mezclaService } from '@services/MezclaService';
import type {
  BoletaMezcla,
  CerrarBoletaMezclaPayload,
  ComponenteFormula,
  CompletarOrdenPayload,
  CumplimientoBrutoNeto,
  CumplimientoMezcla,
  EmpleadoAsignado,
  IncidenciaMezcla,
  MotivoCierreMezcla,
  PreviewBoletaMezcla,
  RegistrarIncidenciaPayload,
  RegistrarSacoPayload,
  RegistrarSacoResponse,
  ResumenOrdenMezcla,
  SacoMezcla,
  TurnoActivoEmpleado,
} from '@/types/mezcla';
import type { SolicitudInsumos } from '@/types/insumos';

// ── Query keys (centralizadas para invalidación) ────────
export const mezclaKeys = {
  all: ['mezcla'] as const,
  ordenesEmpleado: (idEmpleado: number | null | undefined) =>
    ['mezcla', 'ordenes', 'empleado', idEmpleado] as const,
  resumenOrdenes: () => ['mezcla', 'ordenes', 'resumen'] as const,
  detalleFecha: (fecha: string) => ['mezcla', 'ordenes', 'fecha', fecha] as const,
  empleados: (idOrden: number | null | undefined) =>
    ['mezcla', 'orden', idOrden, 'empleados'] as const,
  componentesFormula: (codigoFormula: string | null | undefined) =>
    ['mezcla', 'formula', 'componentes', codigoFormula ?? null] as const,
  saco: (codigoBarra: string | null | undefined) =>
    ['mezcla', 'saco', codigoBarra] as const,
  incidencias: (fechaInicio?: string, fechaFin?: string) =>
    ['mezcla', 'incidencias', fechaInicio ?? null, fechaFin ?? null] as const,
  cumplimientos: (fechaInicio?: string, fechaFin?: string) =>
    ['mezcla', 'cumplimientos', fechaInicio ?? null, fechaFin ?? null] as const,
  cumplimientoBrutoNeto: (idEmpleado?: number, fechaInicio?: string, fechaFin?: string) =>
    ['mezcla', 'cumplimiento-bn', idEmpleado ?? null, fechaInicio ?? null, fechaFin ?? null] as const,
  motivosCierre: () => ['mezcla', 'motivos-cierre'] as const,
  turnosActivos: (idEmpleado: number | null | undefined, fecha?: string) =>
    ['mezcla', 'turnos-activos', idEmpleado ?? null, fecha ?? null] as const,
  boletaPreview: (idTurno: number | null | undefined) =>
    ['mezcla', 'boleta-preview', idTurno ?? null] as const,
  solicitudPorPlanificacion: (idPlanificacion: number | null | undefined) =>
    ['mezcla', 'insumos', 'planificacion', idPlanificacion ?? null] as const,
} as const;

// ═══════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════

/** Órdenes de mezcla asignadas al empleado. */
export function useOrdenesPorEmpleado(idEmpleado: number | null | undefined) {
  return useQuery<ResumenOrdenMezcla[]>({
    queryKey: mezclaKeys.ordenesEmpleado(idEmpleado),
    queryFn: () => mezclaService.obtenerOrdenesPorEmpleado(idEmpleado as number),
    enabled: typeof idEmpleado === 'number' && idEmpleado > 0,
    staleTime: 30_000,
  });
}

/** Resumen general de órdenes activas (no filtrado por empleado). */
export function useResumenOrdenes() {
  return useQuery<ResumenOrdenMezcla[]>({
    queryKey: mezclaKeys.resumenOrdenes(),
    queryFn: () => mezclaService.obtenerResumenOrdenes(),
    staleTime: 30_000,
  });
}

/** Detalle de órdenes de un día (filtra por fecha). */
export function useDetallePorFecha(fechaProduccion: string | null | undefined) {
  return useQuery<ResumenOrdenMezcla[]>({
    queryKey: mezclaKeys.detalleFecha(fechaProduccion ?? ''),
    queryFn: () => mezclaService.obtenerDetallePorFecha(fechaProduccion as string),
    enabled: !!fechaProduccion,
    staleTime: 30_000,
  });
}

/** Componentes de una fórmula SAP por código (F6PRESION, F7PRESION, etc). */
export function useComponentesFormula(codigoFormula: string | null | undefined) {
  return useQuery<ComponenteFormula[]>({
    queryKey: mezclaKeys.componentesFormula(codigoFormula),
    queryFn: () => mezclaService.obtenerComponentesFormula(codigoFormula as string),
    enabled: !!codigoFormula,
    staleTime: 5 * 60_000,
  });
}

/** Empleados asignados a una orden. */
export function useEmpleadosAsignados(idOrdenProduccionMezcla: number | null | undefined) {
  return useQuery<EmpleadoAsignado[]>({
    queryKey: mezclaKeys.empleados(idOrdenProduccionMezcla),
    queryFn: () => mezclaService.obtenerEmpleadosAsignados(idOrdenProduccionMezcla as number),
    enabled: typeof idOrdenProduccionMezcla === 'number' && idOrdenProduccionMezcla > 0,
    staleTime: 60_000,
  });
}

/** Consulta de un saco por código de barras. */
export function useSacoPorCodigo(codigoBarra: string | null | undefined) {
  return useQuery<SacoMezcla | null>({
    queryKey: mezclaKeys.saco(codigoBarra),
    queryFn: () => mezclaService.consultarSaco(codigoBarra as string),
    enabled: !!codigoBarra && codigoBarra.length > 3,
    staleTime: 10_000,
  });
}

/** Historial de incidencias filtrado por fechas. */
export function useIncidencias(fechaInicio?: string, fechaFin?: string) {
  return useQuery<IncidenciaMezcla[]>({
    queryKey: mezclaKeys.incidencias(fechaInicio, fechaFin),
    queryFn: () => mezclaService.obtenerIncidencias({ fechaInicio, fechaFin }),
    staleTime: 60_000,
  });
}

/** Rendimiento histórico (kg producidos vs planificados). */
export function useCumplimientos(fechaInicio?: string, fechaFin?: string) {
  return useQuery<CumplimientoMezcla[]>({
    queryKey: mezclaKeys.cumplimientos(fechaInicio, fechaFin),
    queryFn: () => mezclaService.obtenerCumplimientos({ fechaInicio, fechaFin }),
    staleTime: 60_000,
  });
}

/** Cumplimiento BRUTO vs NETO (KPIs agregados + top motivos). */
export function useCumplimientoBrutoNeto(
  filtros: { idEmpleado?: number; fechaInicio?: string; fechaFin?: string } = {},
) {
  return useQuery<CumplimientoBrutoNeto>({
    queryKey: mezclaKeys.cumplimientoBrutoNeto(filtros.idEmpleado, filtros.fechaInicio, filtros.fechaFin),
    queryFn: () => mezclaService.obtenerCumplimientoBrutoNeto(filtros),
    staleTime: 60_000,
  });
}

/** Catálogo de motivos de cierre de orden de mezcla. */
export function useMotivosCierre() {
  return useQuery<MotivoCierreMezcla[]>({
    queryKey: mezclaKeys.motivosCierre(),
    queryFn: () => mezclaService.obtenerMotivosCierre(),
    staleTime: 5 * 60_000,
  });
}

/** Solicitud de insumos asociada a una planificación (null si no existe). */
export function useSolicitudPorPlanificacion(idPlanificacion: number | null | undefined) {
  return useQuery<SolicitudInsumos | null>({
    queryKey: mezclaKeys.solicitudPorPlanificacion(idPlanificacion),
    queryFn: async () => {
      try {
        const data = await mezclaService.getSolicitudInsumosPorPlanificacion(idPlanificacion as number);
        return (data as SolicitudInsumos) ?? null;
      } catch {
        return null;
      }
    },
    enabled: typeof idPlanificacion === 'number' && idPlanificacion > 0,
    staleTime: 30_000,
    retry: false,
  });
}

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

export function useRegistrarSaco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegistrarSacoPayload) => mezclaService.registrarSaco(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mezclaKeys.all });
    },
  });
}

export function useCompletarOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { idOrdenProduccionMZCL: number; payload: CompletarOrdenPayload }) =>
      mezclaService.completarOrden(vars.idOrdenProduccionMZCL, vars.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mezclaKeys.all });
    },
  });
}

export function useRegistrarIncidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegistrarIncidenciaPayload) => mezclaService.registrarIncidencia(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mezclaKeys.incidencias() });
    },
  });
}

// ═══════════════════════════════════════════════════════
// BOLETA DE CIERRE DE TURNO
// ═══════════════════════════════════════════════════════

/** Turnos asignados al empleado (filtrable por fecha). */
export function useTurnosActivos(idEmpleado: number | null | undefined, fecha?: string) {
  return useQuery<TurnoActivoEmpleado[]>({
    queryKey: mezclaKeys.turnosActivos(idEmpleado, fecha),
    queryFn: () => mezclaService.obtenerTurnosActivosEmpleado(idEmpleado as number, fecha),
    enabled: typeof idEmpleado === 'number' && idEmpleado > 0,
    staleTime: 30_000,
  });
}

/** Pre-vista de la boleta (sin escribir). */
export function useBoletaPreview(idTurnoPlanificacionMezcla: number | null | undefined) {
  return useQuery<PreviewBoletaMezcla>({
    queryKey: mezclaKeys.boletaPreview(idTurnoPlanificacionMezcla),
    queryFn: () => mezclaService.previsualizarBoleta(idTurnoPlanificacionMezcla as number),
    enabled: typeof idTurnoPlanificacionMezcla === 'number' && idTurnoPlanificacionMezcla > 0,
    staleTime: 10_000,
  });
}

/** Cierra el turno con boleta (mutation). */
export function useCerrarTurnoConBoleta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CerrarBoletaMezclaPayload) =>
      mezclaService.cerrarTurnoConBoleta(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mezclaKeys.all });
    },
  });
}
