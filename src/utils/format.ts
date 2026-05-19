/**
 * Helpers de formato (fechas, pesos, porcentajes).
 */

export function formatFecha(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatFechaHora(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatHora(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatPeso(kg: number | null | undefined, digits = 2): string {
  if (kg == null) return '—';
  return `${kg.toFixed(digits)} kg`;
}

export function formatLongitud(mm: number | null | undefined): string {
  if (mm == null) return '—';
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(0)} mm`;
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null) return '—';
  return `${value.toFixed(digits)} %`;
}

export function diffSecondsToHHMMSS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
