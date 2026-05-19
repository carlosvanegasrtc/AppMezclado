/**
 * MezclaService — Singleton.
 * Cubre los endpoints del microservicio `produccion-mezcla` (Fastify, puerto 4004
 * directo o vía Gateway en /api/v2/production/mezcla).
 *
 * Las URLs aquí son relativas al baseURL definido en api.config.ts;
 * `urlFor()` inyecta el prefijo de Mezcla automáticamente.
 *
 * Convención del backend:
 *   - Endpoints "modernos" devuelven { ok, message, data }       → usar `requestOk`
 *   - Algunos endpoints viejos devuelven el resultado crudo      → usar `request`
 */
import { request, requestOk, apiClient } from './api';
import { ApiConfig } from '@config/api.config';
import type {
  BoletaMezcla,
  CerrarBoletaMezclaPayload,
  ComponenteFormula,
  CompletarOrdenPayload,
  CumplimientoBrutoNeto,
  CumplimientoMezcla,
  EmpleadoAsignado,
  FormulaConComponentes,
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
import type { ApiResponse } from '@/types/api';

class MezclaService {
  private static instance: MezclaService;

  private constructor() {}

  static getInstance(): MezclaService {
    if (!MezclaService.instance) {
      MezclaService.instance = new MezclaService();
    }
    return MezclaService.instance;
  }

  // ───────────────────────────────────────────────────────
  // Helper de URL: prepende el prefix de Mezcla
  // ───────────────────────────────────────────────────────
  private urlFor(path: string): string {
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return `/${ApiConfig.mezclaPrefix}/${clean}`;
  }

  // ═══════════════════════════════════════════════════════
  // ÓRDENES — operario
  // ═══════════════════════════════════════════════════════

  /** POST /resumen/empleado — órdenes asignadas a un empleado. */
  async obtenerOrdenesPorEmpleado(idEmpleado: number): Promise<ResumenOrdenMezcla[]> {
    const res = await requestOk<ResumenOrdenMezcla[]>({
      method: 'POST',
      url: this.urlFor('resumen/empleado'),
      data: { idEmpleado },
    });
    return ((res as any).data as ResumenOrdenMezcla[]) ?? [];
  }

  /** GET /resumen-ordenes-mezcla — resumen general (dashboard). */
  async obtenerResumenOrdenes(): Promise<ResumenOrdenMezcla[]> {
    const res = await requestOk<ResumenOrdenMezcla[]>({
      method: 'GET',
      url: this.urlFor('resumen-ordenes-mezcla'),
    });
    return ((res as any).data as ResumenOrdenMezcla[]) ?? [];
  }

  /** POST /detalle-ordenes-mezcla — órdenes + fórmulas + empleados de un día. */
  async obtenerDetallePorFecha(fechaProduccion: string): Promise<ResumenOrdenMezcla[]> {
    const res = await requestOk<ResumenOrdenMezcla[]>({
      method: 'POST',
      url: this.urlFor('detalle-ordenes-mezcla'),
      data: { fechaProduccion },
    });
    return ((res as any).data as ResumenOrdenMezcla[]) ?? [];
  }

  /** GET /obtener-empleados-asignados/:idOrdenProduccionMezcla. */
  async obtenerEmpleadosAsignados(idOrdenProduccionMezcla: number): Promise<EmpleadoAsignado[]> {
    return await request<EmpleadoAsignado[]>({
      method: 'GET',
      url: this.urlFor(`obtener-empleados-asignados/${idOrdenProduccionMezcla}`),
    });
  }

  /** POST /ordenes/:id/completar. */
  async completarOrden(
    idOrdenProduccionMZCL: number,
    payload: CompletarOrdenPayload
  ): Promise<any> {
    const res = await requestOk<any>({
      method: 'POST',
      url: this.urlFor(`ordenes/${idOrdenProduccionMZCL}/completar`),
      data: payload,
    });
    return (res as any).data ?? res;
  }

  // ═══════════════════════════════════════════════════════
  // FÓRMULAS SAP
  // ═══════════════════════════════════════════════════════

  private get v1BaseUrl(): string {
    const { protocol, domain, port } = ApiConfig;
    return `${protocol}://${domain}${port ? `:${port}` : ''}/api/v1`;
  }

  /** GET /api/v1/sap-formulas — devuelve los componentes de la fórmula indicada. */
  async obtenerComponentesFormula(codigoFormula: string): Promise<ComponenteFormula[]> {
    const res = await apiClient.get<{ code: number; data: FormulaConComponentes[] }>(
      `${this.v1BaseUrl}/sap-formulas`
    );
    const formulas: FormulaConComponentes[] = res.data?.data ?? [];
    const match = formulas.find(f => f.formula === codigoFormula);
    return match?.componentes ?? [];
  }

  // ═══════════════════════════════════════════════════════
  // SACOS
  // ═══════════════════════════════════════════════════════

  /** POST /sacos/registrar — registra un saco con peso. Barcode se auto-genera en backend. */
  async registrarSaco(payload: RegistrarSacoPayload): Promise<RegistrarSacoResponse> {
    const res = await requestOk<RegistrarSacoResponse>({
      method: 'POST',
      url: this.urlFor('sacos/registrar'),
      data: payload,
    });
    return (res as any).data as RegistrarSacoResponse;
  }

  /** GET /sacos/consultar?codigoBarra=... */
  async consultarSaco(codigoBarra: string): Promise<SacoMezcla | null> {
    try {
      const res = await requestOk<SacoMezcla>({
        method: 'GET',
        url: this.urlFor('sacos/consultar'),
        params: { codigoBarra },
      });
      return ((res as any).data as SacoMezcla) ?? null;
    } catch (err: any) {
      // 404 → no encontrado: devolver null en vez de propagar
      if (/no se encontró|not found/i.test(err?.message ?? '')) return null;
      throw err;
    }
  }

  // ═══════════════════════════════════════════════════════
  // INCIDENCIAS
  // ═══════════════════════════════════════════════════════

  /** POST /registrar-incidencia. */
  async registrarIncidencia(payload: RegistrarIncidenciaPayload): Promise<void> {
    await requestOk<void>({
      method: 'POST',
      url: this.urlFor('registrar-incidencia'),
      data: payload,
    });
  }

  /** GET /obtener-incidencias?fechaInicio=&fechaFin= — devuelve resultado crudo. */
  async obtenerIncidencias(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<IncidenciaMezcla[]> {
    const data = await request<IncidenciaMezcla[] | { recordset?: IncidenciaMezcla[] }>({
      method: 'GET',
      url: this.urlFor('obtener-incidencias'),
      params: this.cleanParams(filtros),
    });
    if (Array.isArray(data)) return data;
    return (data as any)?.recordset ?? [];
  }

  // ═══════════════════════════════════════════════════════
  // CUMPLIMIENTO
  // ═══════════════════════════════════════════════════════

  /** GET /obtener-cumplimientos?fechaInicio=&fechaFin= */
  async obtenerCumplimientos(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<CumplimientoMezcla[]> {
    const data = await request<CumplimientoMezcla[] | { recordset?: CumplimientoMezcla[] }>({
      method: 'GET',
      url: this.urlFor('obtener-cumplimientos'),
      params: this.cleanParams(filtros),
    });
    if (Array.isArray(data)) return data;
    return (data as any)?.recordset ?? [];
  }

  /** GET /cumplimiento-bruto-neto?idEmpleado=&fechaInicio=&fechaFin= */
  async obtenerCumplimientoBrutoNeto(filtros: {
    idEmpleado?: number;
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Promise<CumplimientoBrutoNeto> {
    const res = await requestOk<CumplimientoBrutoNeto>({
      method: 'GET',
      url: this.urlFor('cumplimiento-bruto-neto'),
      params: this.cleanParams(filtros),
    });
    return ((res as any).data ?? { kpis: null, motivos: [] }) as CumplimientoBrutoNeto;
  }

  /** GET /motivos-cierre */
  async obtenerMotivosCierre(): Promise<MotivoCierreMezcla[]> {
    const res = await requestOk<MotivoCierreMezcla[]>({
      method: 'GET',
      url: this.urlFor('motivos-cierre'),
    });
    return ((res as any).data ?? []) as MotivoCierreMezcla[];
  }

  // ═══════════════════════════════════════════════════════
  // BOLETA DE CIERRE DE TURNO
  // ═══════════════════════════════════════════════════════

  /** GET /turnos-activos?idEmpleado=&fecha= */
  async obtenerTurnosActivosEmpleado(
    idEmpleado: number,
    fecha?: string
  ): Promise<TurnoActivoEmpleado[]> {
    const res = await requestOk<TurnoActivoEmpleado[]>({
      method: 'GET',
      url: this.urlFor('turnos-activos'),
      params: this.cleanParams({ idEmpleado, fecha }),
    });
    return ((res as any).data ?? []) as TurnoActivoEmpleado[];
  }

  /** GET /boleta/preview/:idTurnoPlanificacionMezcla — sin escribir. */
  async previsualizarBoleta(idTurnoPlanificacionMezcla: number): Promise<PreviewBoletaMezcla> {
    const res = await requestOk<PreviewBoletaMezcla>({
      method: 'GET',
      url: this.urlFor(`boleta/preview/${idTurnoPlanificacionMezcla}`),
    });
    return (res as any).data as PreviewBoletaMezcla;
  }

  /** POST /boleta — cierra el turno y devuelve la boleta consolidada. */
  async cerrarTurnoConBoleta(payload: CerrarBoletaMezclaPayload): Promise<BoletaMezcla> {
    const res = await requestOk<BoletaMezcla>({
      method: 'POST',
      url: this.urlFor('boleta'),
      data: payload,
    });
    return (res as any).data as BoletaMezcla;
  }

  // ═══════════════════════════════════════════════════════
  // Solicitudes de Insumos (Bodega → Mezcla)
  // ═══════════════════════════════════════════════════════

  async getSolicitudInsumosPorPlanificacion(idPlanificacion: number): Promise<any> {
    const res = await requestOk<any>({
      method: 'GET',
      url: this.urlFor(`insumos/solicitudes/planificacion/${idPlanificacion}`),
    });
    return (res as any).data;
  }

  async getDetalleSolicitudInsumos(idSolicitud: number): Promise<import('../types/insumos').DetalleSolicitudInsumos> {
    const res = await requestOk<import('../types/insumos').DetalleSolicitudInsumos>({
      method: 'GET',
      url: this.urlFor(`insumos/solicitudes/${idSolicitud}`),
    });
    return (res as any).data;
  }

  async confirmarRecepcionInsumos(
    idSolicitud: number,
    payload: { idEmpleado: number; codigoEmpleado: number; nombreEmpleado: string; observaciones?: string }
  ): Promise<void> {
    await requestOk<void>({
      method: 'POST',
      url: this.urlFor(`insumos/solicitudes/${idSolicitud}/confirmar`),
      data: payload,
    });
  }

  async rechazarInsumos(idSolicitud: number, motivo: string): Promise<void> {
    await requestOk<void>({
      method: 'POST',
      url: this.urlFor(`insumos/solicitudes/${idSolicitud}/rechazar`),
      data: { motivo },
    });
  }

  // ═══════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════
  private cleanParams<T extends Record<string, any>>(params: T): Partial<T> {
    const cleaned: Partial<T> = {};
    (Object.keys(params) as (keyof T)[]).forEach((k) => {
      const v = params[k];
      if (v !== undefined && v !== null && v !== '') {
        cleaned[k] = v;
      }
    });
    return cleaned;
  }
}

export const mezclaService = MezclaService.getInstance();
