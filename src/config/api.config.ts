/**
 * Configuración base de la API.
 * Todos los valores se pueden sobrescribir con variables EXPO_PUBLIC_*.
 *
 * baseURL = `${protocol}://${domain}:${port}/${basePath}/${version}`
 *
 * Para Mezcla, los endpoints viven bajo:
 * `${baseURL}/${mezclaPrefix}/...`
 */

export type ApiProtocol = 'http' | 'https';
export type ApiVersion = 'v1' | 'v2' | 'v3' | (string & {});

export interface ApiSettings {
  protocol: ApiProtocol;
  domain: string;
  port: number | null;
  basePath: string;
  version: ApiVersion;
  mezclaPrefix: string;
}

const defaults: ApiSettings = {
  protocol: 'http',
  domain: 'api.rototec.com.gt',
  port: 3001,
  basePath: 'api',
  version: 'v2',
  mezclaPrefix: 'production/mezcla',
};

export const ApiConfig: Readonly<ApiSettings> = {
  protocol: (process.env.EXPO_PUBLIC_API_PROTOCOL as ApiProtocol) ?? defaults.protocol,
  domain: process.env.EXPO_PUBLIC_API_DOMAIN ?? defaults.domain,
  port: process.env.EXPO_PUBLIC_API_PORT
    ? Number(process.env.EXPO_PUBLIC_API_PORT)
    : defaults.port,
  basePath: process.env.EXPO_PUBLIC_API_BASE_PATH ?? defaults.basePath,
  version: process.env.EXPO_PUBLIC_API_VERSION ?? defaults.version,
  mezclaPrefix: process.env.EXPO_PUBLIC_MEZCLA_PREFIX ?? defaults.mezclaPrefix,
};

export function buildBaseUrl(config: ApiSettings = ApiConfig): string {
  const port = config.port !== null ? `:${config.port}` : '';
  return `${config.protocol}://${config.domain}${port}/${config.basePath}/${config.version}`;
}

export function buildMezclaUrl(path = '', config: ApiSettings = ApiConfig): string {
  const base = buildBaseUrl(config);
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${config.mezclaPrefix}${clean ? `/${clean}` : ''}`;
}
