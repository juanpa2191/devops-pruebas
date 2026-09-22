# Taller de Motos API

API en Node.js + Express para gestionar reparaciones y repuestos de un taller de motocicletas, construida con arquitectura en capas y pruebas unitarias con Jest.

## Arquitectura

El proyecto separa responsabilidades en capas independientes, donde cada capa solo depende de la inmediatamente inferior (inyección de dependencias manual en `src/app.js`):

```
src/
  routes/         Definicion de endpoints HTTP (Express Router)
  controllers/    Adaptan request/response, delegan en los servicios
  services/       Logica de negocio (validaciones, reglas del dominio)
  repositories/   Acceso a datos (implementacion en memoria)
  models/         Entidades del dominio (Moto, Repuesto, Reparacion)
  errors/         Errores de dominio (ValidationError, NotFoundError)
  middlewares/    Middleware de manejo de errores
  config/         Constantes compartidas (estados de reparacion)
```

Flujo de una petición: `routes -> controllers -> services -> repositories -> models`.

Los repositorios usan almacenamiento en memoria (`Map`), por lo que se pueden reemplazar por una implementación con base de datos real sin tocar la capa de servicios, siempre que se respete la misma interfaz (`create`, `findAll`, `findById`, `update`, `delete`).

## Dominio

- **Moto**: vehículo del cliente (placa, marca, modelo, año, propietario).
- **Repuesto**: pieza en inventario (nombre, precio, stock, categoría).
- **Reparación**: orden de trabajo asociada a una moto, con estado (`pendiente`, `en_proceso`, `completada`, `cancelada`), lista de repuestos usados y costo total (mano de obra + repuestos).

Reglas de negocio principales:
- No se puede crear una moto con una placa ya registrada.
- No se puede crear una reparación para una moto inexistente.
- Al agregar un repuesto a una reparación se reduce automáticamente el stock del repuesto y se recalcula el costo total.
- No se pueden agregar repuestos a una reparación `completada` o `cancelada`.
- No se puede reducir stock por debajo de cero.

## Requisitos

- Node.js 16 o superior

## Instalación

```bash
npm install
```

## Uso

```bash
npm start        # inicia el servidor (por defecto en el puerto 3000)
npm run dev       # inicia el servidor con nodemon (recarga automática)
```

Variable de entorno opcional: `PORT` (puerto en el que escucha el servidor).

## Calidad de código

```bash
npm run lint      # revisa el codigo con ESLint
npm run lint:fix  # revisa y corrige automaticamente lo que se pueda
```

## Pruebas

```bash
npm test                # pruebas unitarias (tests/unit)
npm run test:integration # pruebas de integracion end-to-end (tests/integration)
npm run test:watch      # modo watch (todas las pruebas)
npm run test:coverage   # cobertura combinada (unit + integration)
```

- **Unitarias** (`tests/unit`): servicios con repositorios mockeados (Jest mocks) y repositorios reales en memoria, aisladas del resto del sistema.
- **Integración** (`tests/integration`): flujo completo vía HTTP con `supertest` contra la app real (`createApp()`), sin mocks — routes → controllers → services → repositories.
- **Cobertura**: umbral mínimo forzado en `jest.config.js` (statements 75%, branches 70%, functions 65%, lines 75%). `src/server.js` se excluye del cálculo porque es solo el punto de arranque (se valida con el smoke-test del CI).

## Integración continua (CI)

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) corre **solo en Pull Requests contra `main`** (sin importar la rama de origen) con 6 jobs independientes, y actúa como gate de merge:

| Job (nombre del check) | Qué hace |
|---|---|
| `Lint` | `npm run lint` (ESLint) |
| `Unit Test` | `npm test` — pruebas unitarias |
| `Coverage` | `npm run test:coverage` — falla si la cobertura baja del umbral; publica el reporte como artifact |
| `Build` | Instala dependencias, levanta el servidor y hace smoke-test a `/health` (`npm run smoke-test`) |
| `Integration Test` | `npm run test:integration` — pruebas end-to-end con `supertest` |
| `Security Checks` | `npm audit --audit-level=high` — vulnerabilidades conocidas en dependencias |

### Requerir estos checks para poder mergear un PR

En GitHub: **Settings → Branches → Branch protection rules → Add rule** (rama `main`) → activar **"Require status checks to pass before merging"** y seleccionar los 6 checks: `Lint`, `Unit Test`, `Coverage`, `Build`, `Integration Test`, `Security Checks` (aparecen en la lista después de que el workflow corra al menos una vez en un PR).

### Empaquetado post-merge

El workflow [`.github/workflows/build-deploy.yml`](.github/workflows/build-deploy.yml) corre **solo con push a `main`** (es decir, justo después de que un PR se mergea) — no vuelve a correr el CI, que ya se validó en el PR. En su lugar:

1. Instala únicamente dependencias de producción (`npm ci --omit=dev`).
2. Empaqueta `src/`, `package.json`, `package-lock.json` y `node_modules` en un `.tar.gz` versionado (`taller-motos-api-<version>-<sha corto>.tar.gz`).
3. Extrae ese mismo paquete en un directorio aislado y corre el smoke-test contra él (`SERVER_ENTRY` apuntando al `server.js` extraído), para confirmar que el artefacto arranca con solo las dependencias de producción, no solo en el checkout completo del repo.
4. Publica el `.tar.gz` como artifact del workflow (30 días de retención), listo para que un futuro job de CD lo descargue y lo despliegue.

Este workflow todavía no hace deploy a ningún destino — solo prepara y valida el artefacto. Cuando se defina dónde desplegar (VM, contenedor, servicio serverless), se agrega un job adicional que tome ese artifact y lo publique ahí.

## Endpoints principales

### Motos (`/api/motos`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear moto |
| GET | `/` | Listar motos |
| GET | `/:id` | Obtener moto por id |
| PUT | `/:id` | Actualizar moto |
| DELETE | `/:id` | Eliminar moto |

### Repuestos (`/api/repuestos`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear repuesto |
| GET | `/` | Listar repuestos |
| GET | `/:id` | Obtener repuesto por id |
| PUT | `/:id` | Actualizar repuesto |
| DELETE | `/:id` | Eliminar repuesto |
| PATCH | `/:id/aumentar-stock` | Aumentar stock (`{ "cantidad": n }`) |
| PATCH | `/:id/reducir-stock` | Reducir stock (`{ "cantidad": n }`) |

### Reparaciones (`/api/reparaciones`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear reparación (`{ "motoId", "descripcion", "mecanico", "costoManoObra" }`) |
| GET | `/` | Listar reparaciones |
| GET | `/:id` | Obtener reparación por id |
| DELETE | `/:id` | Eliminar reparación |
| POST | `/:id/repuestos` | Agregar repuesto (`{ "repuestoId", "cantidad" }`) — reduce stock y recalcula costo |
| PATCH | `/:id/estado` | Cambiar estado (`{ "estado": "en_proceso" \| "completada" \| "cancelada" }`) |

## Próximos pasos sugeridos

- Reemplazar los repositorios en memoria por una implementación con base de datos (por ejemplo PostgreSQL o MongoDB), manteniendo la misma interfaz.
- Agregar autenticación/autorización para diferenciar mecánicos, administradores y clientes.
- Definir e implementar el CD (Docker + deploy) sobre la base del CI actual.
