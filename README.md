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
| `Coverage` | `npm run test:coverage` — falla si la cobertura baja del umbral; publica el reporte HTML completo como artifact |
| `Build` | Instala dependencias, levanta el servidor y hace smoke-test a `/health` (`npm run smoke-test`) |
| `Integration Test` | `npm run test:integration` — pruebas end-to-end con `supertest` |
| `Security Checks` | `npm audit --audit-level=high` — vulnerabilidades conocidas en dependencias |

Además corre un 7mo job, **informativo, no forma parte del gate de merge**:

| Job | Qué hace |
|---|---|
| `Coverage Comment` | Postea (y actualiza en cada push) un comentario en el PR con una tabla de cobertura por archivo, coloreada según el %, usando [`ArtiomTr/jest-coverage-report-action`](https://github.com/ArtiomTr/jest-coverage-report-action). Es solo para verla de un vistazo sin descargar el artifact — el umbral real que bloquea el merge lo sigue poniendo el job `Coverage`. |

### Requerir estos checks para poder mergear un PR

En GitHub: **Settings → Branches → Branch protection rules → Add rule** (rama `main`) → activar **"Require status checks to pass before merging"** y seleccionar los 6 checks que son gate: `Lint`, `Unit Test`, `Coverage`, `Build`, `Integration Test`, `Security Checks` (aparecen en la lista después de que el workflow corra al menos una vez en un PR). **No** selecciones `Coverage Comment` — es informativo, no debe bloquear nada.

### Empaquetado y deploy post-merge (CD)

El workflow [`.github/workflows/build-deploy.yml`](.github/workflows/build-deploy.yml) corre **solo con push a `main`** (justo después de que un PR se mergea) — no vuelve a correr el CI, que ya se validó en el PR. Tiene dos jobs:

**`Package`**
1. Instala únicamente dependencias de producción (`npm ci --omit=dev`).
2. Empaqueta `src/`, `package.json`, `package-lock.json`, `ecosystem.config.js` y `node_modules` en un `.tar.gz` versionado (`taller-motos-api-<version>-<sha corto>.tar.gz`).
3. Extrae ese mismo paquete en un directorio aislado y corre el smoke-test contra él (`SERVER_ENTRY` apuntando al `server.js` extraído), para confirmar que el artefacto arranca con solo las dependencias de producción, no solo en el checkout completo del repo.
4. Publica el `.tar.gz` como artifact del workflow (30 días de retención).

**`Deploy`** (depende de `Package`, usa el [GitHub Environment](#configurar-el-environment-production-y-sus-secrets) `production`)
1. Descarga el artefacto generado por `Package`.
2. Se conecta por SSH al VPS (clave cargada vía `webfactory/ssh-agent`).
3. Copia el `.tar.gz` a `/tmp` en el VPS.
4. Corre [`scripts/deploy-remote.sh`](scripts/deploy-remote.sh) en el VPS: extrae el release en `$DEPLOY_PATH/releases/<artifact>`, actualiza el symlink `$DEPLOY_PATH/current` para que apunte ahí, recarga la app con PM2 (zero-downtime si ya estaba corriendo) usando [`ecosystem.config.js`](ecosystem.config.js), y borra releases viejos (conserva los últimos 5).

Este flujo asume que **nginx ya está configurado como reverse proxy** en el VPS apuntando al puerto donde corre la app (por defecto `3030`, el mismo default de [`src/server.js`](src/server.js)); el deploy no toca la config de nginx.

#### Setup de una sola vez en el VPS (Hostinger)

Antes del primer deploy automático, a mano en el VPS:

```bash
# 1. Node.js 20.x y PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
pm2 startup   # deja el comando que te imprime para que PM2 sobreviva a un reboot

# 2. Usuario y carpeta de despliegue (ajustar segun tu convencion)
sudo useradd -m -s /bin/bash deploy   # si no existe ya
sudo mkdir -p /home/deploy/apps/taller-motos-api/releases
sudo chown -R deploy:deploy /home/deploy/apps/taller-motos-api

# 3. Clave SSH para que GitHub Actions se conecte como "deploy"
#    (generar el par en tu maquina, NO en el VPS, y copiar solo la publica)
ssh-copy-id -i ruta/a/tu_clave.pub deploy@TU_VPS_IP
```

Nginx (ejemplo mínimo, adaptar dominio y certificados):

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Configurar el Environment `production` y sus secrets

En GitHub: **Settings → Environments → New environment** → nombre `production` (tiene que coincidir con `environment: production` en el job `Deploy`). Ahí, en **Environment secrets**, agregar:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP o hostname del VPS |
| `VPS_USER` | usuario SSH (ej. `deploy`) |
| `VPS_SSH_KEY` | clave **privada** SSH completa (la pública ya debe estar en `~/.ssh/authorized_keys` del VPS) |
| `VPS_PORT` | puerto SSH, solo si no es el 22 |
| `DEPLOY_PATH` | carpeta base en el VPS (ej. `/home/deploy/apps/taller-motos-api`) |

#### Aprobación manual antes de desplegar (opcional)

En el mismo Environment `production`, en **Deployment protection rules**, activá **Required reviewers** y agregá a la persona (o equipo, con permiso de escritura en el repo) que debe aprobar cada deploy. Con esto, el job `Deploy` queda en estado "Waiting" apenas termina `Package`, y no se conecta al VPS hasta que esa persona lo apruebe desde la pestaña **Actions** de la corrida.

> No pude probar el job `Deploy` contra un VPS real (no tengo acceso a tu servidor) — sí verifiqué localmente que el `.tar.gz` se arma bien, incluye `ecosystem.config.js` y arranca correctamente al extraerlo. El primer deploy automático conviene mirarlo en vivo (pestaña Actions) por si algo en tu VPS especifico (rutas, permisos, version de PM2) necesita un ajuste.

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
