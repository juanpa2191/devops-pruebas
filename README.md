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

## Pruebas

```bash
npm test              # ejecuta todas las pruebas unitarias
npm run test:watch    # modo watch
npm run test:coverage # con reporte de cobertura
```

Las pruebas unitarias cubren:
- **Servicios** (`tests/unit/services`): lógica de negocio con repositorios mockeados (Jest mocks), incluyendo reglas de validación y flujos de error.
- **Repositorios** (`tests/unit/repositories`): comportamiento real de la capa de datos en memoria.

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
- Agregar pruebas de integración de extremo a extremo con `supertest` (ya incluido como devDependency).
