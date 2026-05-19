# AppMezcla — Gestión de órdenes de Mezcla PVC (Rototec)

App móvil React Native + Expo para los **operarios mezcladores** de la planta CDIS Las Palmas. No es una app de inspección de calidad: su propósito es que el operario gestione su turno de mezcla — ver las órdenes asignadas, registrar los sacos producidos, reportar incidencias y cerrar la orden cuando termina.

Consume el microservicio `produccion-mezcla` (Fastify + TypeORM, prefijo `/production/mezcla` vía Gateway).

## Stack

- React Native 0.83.2 + Expo ~55 + React 19.2
- TypeScript 5.9 (strict)
- NativeWind 4.2 + Tailwind CSS 3.4 (paleta orange/amber)
- @react-navigation v7 (native-stack + drawer)
- @tanstack/react-query (cache + invalidaciones)
- zustand (auth + network store)
- axios + JWT (SecureStore)
- expo-camera (escáner de barcode), expo-haptics, expo-secure-store, expo-sqlite (offline futuro)
- @shopify/flash-list, lucide-react-native, react-native-reanimated 4

## Estructura

```
AppMezcla/
├── App.tsx                       Entry — providers + navigator
├── index.ts                      registerRootComponent
├── babel.config.js               + module-resolver para alias
├── metro.config.js               + nativewind
├── tailwind.config.js            tokens orange/amber + safelist
├── tsconfig.json                 strict + paths
├── global.css                    @tailwind base/components/utilities
├── app.json                      Expo config (permisos, splash, ícono)
│
├── assets/
│   ├── images/                   icon, splash, favicon (placeholders)
│   ├── icons/
│   └── fonts/
│
└── src/
    ├── components/
    │   └── ui/                   AppButton, Card, Screen, AppBar, GradientHeader,
    │                             StatusBadge, EmptyState, Skeleton, NumberField,
    │                             NoConnectionDialog
    ├── config/
    │   ├── api.config.ts         baseURL + prefix de Mezcla
    │   └── icons.ts              ICON_SET + IconDefaults
    ├── constants/
    │   ├── colors.ts             Colors token (espejo de tailwind, paleta orange)
    │   ├── typography.ts         Typography preset
    │   ├── spacing.ts            Spacing + Radius + HitSlop
    │   ├── app.ts                ROLES (OPERARIO_MEZCLADOR=9), ESTADOS_MEZCLA
    │   └── index.ts
    ├── hooks/
    │   ├── useMezcla.ts          hooks de React Query (queries + mutations)
    │   ├── useNetworkStatus.ts
    │   ├── useNetworkGuard.ts
    │   └── useHaptics.ts
    ├── navigation/
    │   ├── RootNavigator.tsx     Auth | App
    │   ├── DrawerNavigator.tsx   Home / Mis órdenes / Historial / Settings
    │   ├── CustomDrawerContent.tsx
    │   └── types.ts
    ├── providers/
    │   └── AppProviders.tsx      Gesture + SafeArea + QueryClient + NetInfo
    ├── screens/
    │   ├── auth/LoginScreen.tsx
    │   ├── home/HomeScreen.tsx
    │   ├── mezcla/
    │   │   ├── OrdenesScreen.tsx          Lista de órdenes asignadas
    │   │   ├── OrdenDetalleScreen.tsx     KPIs + acciones (registrar saco, incidencia, cerrar)
    │   │   ├── RegistrarSacoScreen.tsx    Captura barcode + peso
    │   │   ├── EscanerScreen.tsx          Cámara + barcode → devuelve a RegistrarSaco
    │   │   ├── IncidenciaScreen.tsx       Reporta incidencia del turno
    │   │   ├── CompletarOrdenScreen.tsx   Cierra orden con observaciones
    │   │   └── HistorialScreen.tsx        Tabs Incidencias / Cumplimiento
    │   └── settings/SettingsScreen.tsx
    ├── services/
    │   ├── api.ts                axios + JWT interceptor + tokenStorage
    │   ├── AuthService.ts        singleton — login + restoreSession (mismo Gateway)
    │   ├── MezclaService.ts      singleton — endpoints del operario mezclador
    │   └── index.ts
    ├── store/
    │   ├── authStore.ts          zustand
    │   └── networkStore.ts
    ├── types/
    │   ├── api.ts                ApiResponse<T>
    │   ├── auth.ts               JWTPayload, LoginRequest
    │   └── mezcla.ts             ResumenOrdenMezcla, SacoMezcla, IncidenciaMezcla, etc.
    └── utils/
        ├── responsive.ts
        ├── format.ts
        ├── networkError.ts
        └── index.ts
```

## Setup

```bash
npm install
# (opcional) crea .env basado en las variables de abajo
npm start              # Expo CLI; luego escanea con Expo Go o run:android
```

### Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_PROTOCOL` | `http` | http o https |
| `EXPO_PUBLIC_API_DOMAIN` | `api.rototec.com.gt` | Dominio del Gateway |
| `EXPO_PUBLIC_API_PORT` | `3001` | Puerto del Gateway |
| `EXPO_PUBLIC_API_BASE_PATH` | `api` | Base path |
| `EXPO_PUBLIC_API_VERSION` | `v2` | Versión |
| `EXPO_PUBLIC_MEZCLA_PREFIX` | `production/mezcla` | Prefijo del módulo |

URL final: `{protocol}://{domain}:{port}/{basePath}/{version}/{mezclaPrefix}/...`

## Convenciones

- Aliases TS: `@/`, `@components/`, `@constants/`, `@hooks/`, `@navigation/`, `@providers/`, `@screens/`, `@services/`, `@store/`, `@types/`, `@utils/`, `@assets/`, `@config/`.
- Servicios singleton (`XService.getInstance()`).
- React Query para cache; query keys centralizadas en `useMezcla.ts` (`mezclaKeys`).
- JWT en SecureStore (`auth_token`); interceptor borra token en 401.
- Roboto forzado en Android desde `App.tsx` para anular fuentes del SO.

## Endpoints consumidos

Todos en `MezclaService` (`src/services/MezclaService.ts`). El microservicio devuelve `{ok, message, data}` para los endpoints modernos del operario; los más antiguos devuelven el resultado crudo.

| Método | Path (relativo a baseURL) | Service method | Uso |
|--------|---------------------------|----------------|-----|
| POST   | `…/resumen/empleado`              | `obtenerOrdenesPorEmpleado`   | Mis órdenes del turno |
| GET    | `…/resumen-ordenes-mezcla`        | `obtenerResumenOrdenes`       | Resumen general |
| POST   | `…/detalle-ordenes-mezcla`        | `obtenerDetallePorFecha`      | Órdenes de un día |
| GET    | `…/obtener-empleados-asignados/:id` | `obtenerEmpleadosAsignados` | Empleados de la orden |
| POST   | `…/sacos/registrar`               | `registrarSaco`               | Captura saco con peso |
| GET    | `…/sacos/consultar?codigoBarra=`  | `consultarSaco`               | Buscar saco por barcode |
| POST   | `…/ordenes/:id/completar`         | `completarOrden`              | Cierra la orden del turno |
| POST   | `…/registrar-incidencia`          | `registrarIncidencia`         | Reporta paro/material/etc. |
| GET    | `…/obtener-incidencias`           | `obtenerIncidencias`          | Historial de incidencias |
| GET    | `…/obtener-cumplimientos`         | `obtenerCumplimientos`        | Rendimiento histórico |

## Pantallas implementadas

- ✅ **Login** — username + password (mismo Gateway que AppCalidad / monolito).
- ✅ **Home** — saludo, stats (órdenes activas, sacos del turno), atajos.
- ✅ **Mis órdenes** (drawer) — lista con KPIs (kg plan/producido, sacos, %), pull-to-refresh.
- ✅ **Detalle de orden** — número, fórmula, KPIs, empleados del turno, 3 acciones rápidas.
- ✅ **Registrar saco** — escaneo de barcode (cámara) + peso, validación inline.
- ✅ **Escáner** — full-screen, soporta itf14/code128/ean13/ean8/code39/qr, fallback manual.
- ✅ **Incidencia** — formulario con descripción mínima 10 caracteres.
- ✅ **Completar orden** — observaciones obligatorias si kg producidos < plan o sin sacos.
- ✅ **Historial** (drawer) — tabs Incidencias / Cumplimiento últimos 15 días.
- ✅ **Settings** — sesión, conexión de red, logout.

## Pendientes / próximas iteraciones

- Suscripción al WebSocket del microservicio (`/production/mezcla/ws/sacos`) para refresco en vivo cuando otro operario registra un saco en la misma orden.
- Flujo de **solicitud / recepción de materiales** desde bodega (depende del módulo Bodega → Mezcla).
- **Impresión de etiqueta de fórmula** al cerrar la mezcla (impresora térmica del operario).
- **Boleta de cierre de turno** con datos físicos + biométrico (espejo del flujo ya construido en extrusión).
- Modo offline con `expo-sqlite` para registros de sacos cuando hay caída de WiFi.
- Notificaciones push (FCM) para incidencias críticas o decisiones del jefe.

## Logo / Splash

Los assets en `assets/images/` son placeholders heredados (ahora con `backgroundColor: #7c2d12` — orange-900). Reemplázalos con el branding final de Rototec Mezcla cuando esté listo.
