# Click Viajes — Fase 0: Diseño (propuesta para aprobación)

> Documento de diseño. **No** contiene código de aplicación todavía. El objetivo es que
> apruebes (o ajustes) la arquitectura y el modelo de datos antes de empezar a programar.

## Decisiones de negocio confirmadas

| Tema | Decisión |
|------|----------|
| Monedas iniciales | PYG, USD, BRL, ARS |
| Resolución de tenant en login | Login unificado; el tenant se resuelve desde el usuario |
| Pasajeros en reserva | Titular = Cliente del CRM; acompañantes como datos de pasajero, vinculables opcionalmente a un Cliente |
| Comisión del vendedor | % configurable sobre el precio de venta |

---

## 1. Arquitectura general

### 1.1 Monorepo (pnpm workspaces)

Recomiendo **monorepo** sobre repos separados. Razón principal: queremos compartir entre
front y back los **esquemas Zod**, los **tipos TypeScript**, las **constantes de monedas** y
la **función de cálculo del RUC** (pieza crítica que debe dar el mismo resultado en el
autocompletado del front y en la validación del back). Un monorepo nos da una sola fuente de
verdad y refactors atómicos.

```
click-viajes/
├── apps/
│   ├── api/                      # Express + TypeScript (API REST)
│   │   ├── src/
│   │   │   ├── config/           # env, constantes de arranque
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts     # PrismaClient + extensión de tenant
│   │   │   │   └── tenant-context.ts  # AsyncLocalStorage del tenant
│   │   │   ├── middlewares/      # auth (JWT), tenant, errorHandler, validate(zod)
│   │   │   ├── modules/          # un dominio = una carpeta
│   │   │   │   └── customers/
│   │   │   │       ├── customer.routes.ts
│   │   │   │       ├── customer.controller.ts
│   │   │   │       ├── customer.service.ts
│   │   │   │       └── customer.repository.ts
│   │   │   ├── utils/            # respuestas API, errores tipados
│   │   │   ├── app.ts            # construcción de Express
│   │   │   └── server.ts         # arranque
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts           # monedas, super-admin, tenant demo
│   └── web/                      # Next.js (App Router) + React + TS
│       └── src/
│           ├── app/              # rutas (App Router)
│           ├── components/       # UI reutilizable (Tailwind)
│           ├── features/         # lógica por dominio del front
│           └── lib/
│               ├── api.ts        # cliente HTTP + manejo de tokens
│               ├── query.ts      # configuración de TanStack Query
│               └── format.ts     # helpers de presentación (fechas, dinero)
├── packages/
│   └── shared/                   # compartido front + back
│       └── src/
│           ├── schemas/          # esquemas Zod por dominio
│           ├── constants/        # monedas, roles, estados
│           ├── ruc.ts            # dígito verificador módulo 11 (Paraguay)
│           └── date.ts           # formato dd/mm/aaaa <-> ISO
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

### 1.2 Capas del backend

`ruta → controlador → servicio → repositorio`

- **Ruta:** define el endpoint y aplica middlewares (auth, rol, validación Zod).
- **Controlador:** traduce HTTP ↔ dominio; no contiene lógica de negocio.
- **Servicio:** lógica de negocio (cálculo de margen, descuento de cupo, plan de cuotas…).
- **Repositorio:** único punto que toca Prisma. Facilita testear y centraliza el acceso a datos.

### 1.3 Respuestas y errores

- Formato de respuesta consistente: `{ ok: true, data }` / `{ ok: false, error: { code, message, details? } }`.
- Errores tipados (`AppError` con `statusCode` y `code`) + un **errorHandler** central.
- Validación de **toda** entrada con Zod en el middleware antes de llegar al controlador.

---

## 2. Estrategia multi-tenant

### 2.1 Aislamiento: fila compartida con `tenantId`

Recomiendo **shared database / shared schema** con columna `tenantId` en cada entidad de
negocio. Es lo más práctico para arrancar y escalar a muchas agencias.

| Estrategia | Pros | Contras |
|-----------|------|---------|
| **Fila compartida + `tenantId`** (recomendada) | Una sola BD y migraciones; bajo costo operativo; fácil de mantener; onboarding instantáneo | El aislamiento depende del código → hay que blindarlo en una capa central |
| Schema por tenant | Aislamiento más fuerte a nivel BD | Migraciones × N schemas; complejidad operativa alta; onboarding más lento |
| BD por tenant | Aislamiento máximo | Costo y operación muy altos; sobredimensionado para empezar |

Mitigamos el único contra real de la opción recomendada con la capa central de abajo.

### 2.2 Capa central de aislamiento (clave)

Para que **ningún endpoint pueda olvidar** filtrar por tenant, combinamos dos piezas:

1. **Middleware de tenant:** tras autenticar el JWT, resuelve `tenantId` desde el usuario y lo
   guarda en un **`AsyncLocalStorage`** (contexto por request).
2. **Prisma Client Extension:** intercepta todas las queries de los modelos con `tenantId` y:
   - en lecturas (`findMany`, `findFirst`, `count`, etc.) **inyecta `where: { tenantId }`** automáticamente;
   - en escrituras (`create`, `createMany`) **inyecta `data.tenantId`** automáticamente;
   - en `update/delete` fuerza el `tenantId` en el `where`.

Así el código de negocio nunca escribe `tenantId` a mano y es imposible cruzar datos entre
agencias por descuido. El **super-admin de plataforma** usa un cliente Prisma sin la extensión
(o un "bypass" explícito) para operar sobre todos los tenants.

### 2.3 Roles

- `SUPER_ADMIN` — nivel plataforma, **sin** `tenantId`. Gestiona agencias.
- `AGENCY_ADMIN` — administrador de una agencia.
- `SELLER` — vendedor de una agencia (tiene `commissionRate`).

### 2.4 Preparado para SaaS (no se implementa aún)

Dejamos los modelos `Plan` y `Subscription` y los campos de límites en `Tenant`
(`maxUsers`, `maxBookingsPerMonth`) **definidos pero inactivos**, para enchufar onboarding,
planes y cobro más adelante sin migración disruptiva.

---

## 3. Multi-moneda

- `Currency` como **enum** (`PYG`, `USD`, `BRL`, `ARS`).
- Cada `Tenant` tiene `baseCurrency` (su moneda de reportes).
- **Todo monto** se guarda como `Decimal` (nunca `float`) **con su `Currency` al lado**.
- Tabla **`ExchangeRate`** por tenant, con histórico (`date`), para convertir de forma
  reproducible: una conversión usada en un pago queda "congelada" guardando el rate aplicado.
- Los reportes convierten a `baseCurrency` usando el rate vigente a la fecha correspondiente.

---

## 4. Localización Paraguay

### 4.1 RUC a partir del CI (dígito verificador módulo 11)

Función reutilizable en `packages/shared/src/ruc.ts`, usada por front (autocompletar) y back
(validar). Borrador del algoritmo estándar SET (personas físicas; contempla extranjeros con
letras vía código ASCII):

```ts
/** Calcula el dígito verificador (módulo 11) de un CI paraguayo. */
export function calcularDigitoVerificador(ci: string, base = 11): number {
  const limpio = ci.toUpperCase().replace(/[^0-9A-Z]/g, "");
  let total = 0;
  let factor = 2;
  for (let i = limpio.length - 1; i >= 0; i--) {
    const c = limpio.charCodeAt(i);
    const valor = c >= 48 && c <= 57 ? c - 48 : c; // dígito vs letra (ASCII)
    total += valor * factor;
    factor = factor > base ? 2 : factor + 1;
  }
  const resto = total % base;
  return resto > 1 ? base - resto : 0;
}

/** Devuelve el RUC en formato CI-DV. */
export function calcularRuc(ci: string): string {
  const limpio = ci.replace(/[^0-9A-Za-z]/g, "");
  return `${limpio}-${calcularDigitoVerificador(limpio)}`;
}
```

- El RUC se **autocompleta** al ingresar el CI, pero el campo queda **editable** (jurídicos y
  casos especiales).
- Se acompaña de **tests** (vectores conocidos) porque será base de la **futura integración SIFEN**.
- Los datos fiscales del cliente quedan modelados pensando en SIFEN, sin implementar la
  facturación electrónica todavía.

### 4.2 Fechas `dd/mm/aaaa`

- Almacenamiento en BD: `DateTime`/`Date` ISO (UTC).
- Presentación: helper central en `packages/shared/src/date.ts` (`formatFecha`, `parseFecha`).
  Ningún componente formatea fechas a mano.

---

## 5. Modelo de datos (esquema Prisma — borrador)

> Borrador para revisión. Cada entidad de negocio lleva `tenantId` e índice por `tenantId`.
> Montos en `Decimal` + `Currency`.

```prisma
// ───────────── Enums ─────────────
enum Currency { PYG USD BRL ARS }
enum UserRole { SUPER_ADMIN AGENCY_ADMIN SELLER }
enum TenantStatus { ACTIVE SUSPENDED }

enum DocumentType { PASSPORT VISA ID_CARD OTHER }
enum SupplierType { HOTEL TRANSPORT GUIDE INSURANCE OTHER }

enum TripStatus { SCHEDULED IN_PROGRESS FINISHED CANCELLED }
enum QuoteStatus { DRAFT SENT ACCEPTED REJECTED EXPIRED }
enum BookingStatus { PENDING CONFIRMED CANCELLED }
enum InstallmentStatus { PENDING PARTIAL PAID OVERDUE }
enum PaymentMethod { CASH TRANSFER CARD }

// ───────────── Plataforma / Tenant ─────────────
model Tenant {
  id            String       @id @default(cuid())
  name          String
  slug          String       @unique               // para futuro subdominio
  baseCurrency  Currency     @default(PYG)
  status        TenantStatus @default(ACTIVE)
  // Preparado para SaaS (inactivo por ahora):
  planId        String?
  maxUsers      Int?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  users         User[]
  customers     Customer[]
  destinations  Destination[]
  suppliers     Supplier[]
  packages      Package[]
  trips         Trip[]
  quotes        Quote[]
  bookings      Booking[]
  payments      Payment[]
  exchangeRates ExchangeRate[]
  plan          Plan?        @relation(fields: [planId], references: [id])
}

// SaaS futuro (definido, sin uso aún)
model Plan {
  id        String   @id @default(cuid())
  name      String
  maxUsers  Int?
  price     Decimal? @db.Decimal(14, 4)
  currency  Currency @default(USD)
  tenants   Tenant[]
}

model User {
  id             String    @id @default(cuid())
  tenantId       String?                       // null = SUPER_ADMIN
  email          String    @unique
  passwordHash   String
  fullName       String
  role           UserRole  @default(SELLER)
  commissionRate Decimal?  @db.Decimal(5, 2)   // % sobre venta (solo SELLER)
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  tenant         Tenant?   @relation(fields: [tenantId], references: [id])
  refreshTokens  RefreshToken[]
  @@index([tenantId])
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  user      User     @relation(fields: [userId], references: [id])
  @@index([userId])
}

model ExchangeRate {
  id           String   @id @default(cuid())
  tenantId     String
  fromCurrency Currency
  toCurrency   Currency
  rate         Decimal  @db.Decimal(18, 6)
  date         DateTime                         // fecha de vigencia
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  @@index([tenantId, fromCurrency, toCurrency, date])
}

// ───────────── CRM ─────────────
model Customer {
  id         String   @id @default(cuid())
  tenantId   String
  firstName  String
  lastName   String
  ci         String?
  ruc        String?                            // autocompletado desde CI, editable
  email      String?
  phone      String?
  address    String?
  birthDate  DateTime?
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  documents  CustomerDocument[]
  quotes     Quote[]
  bookings   Booking[]
  passengers Passenger[]
  @@index([tenantId])
  @@index([tenantId, ci])
}

model CustomerDocument {
  id         String       @id @default(cuid())
  tenantId   String
  customerId String
  type       DocumentType
  number     String
  issueDate  DateTime?
  expiryDate DateTime?                          // base para alertas de vencimiento
  notes      String?
  customer   Customer     @relation(fields: [customerId], references: [id])
  @@index([tenantId, expiryDate])
}

// ───────────── Destinos ─────────────
model Destination {
  id                String   @id @default(cuid())
  tenantId          String
  name              String
  country           String
  city              String?
  description       String?
  recommendedSeason String?
  photos            String[]                    // URLs
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  attractions       Attraction[]
  tripLinks         TripDestination[]
  packageLinks      PackageDestination[]
  @@index([tenantId])
}

model Attraction {
  id            String      @id @default(cuid())
  tenantId      String
  destinationId String
  name          String
  description   String?
  destination   Destination @relation(fields: [destinationId], references: [id])
}

// ───────────── Proveedores ─────────────
model Supplier {
  id        String       @id @default(cuid())
  tenantId  String
  name      String
  type      SupplierType
  email     String?
  phone     String?
  notes     String?
  tenant    Tenant       @relation(fields: [tenantId], references: [id])
  tripCosts TripSupplier[]
  @@index([tenantId])
}

// ───────────── Paquetes (plantillas) ─────────────
model Package {
  id           String   @id @default(cuid())
  tenantId     String
  name         String
  description  String?
  basePrice    Decimal? @db.Decimal(14, 4)
  currency     Currency @default(USD)
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  destinations PackageDestination[]
  itinerary    PackageItineraryItem[]
  trips        Trip[]
  @@index([tenantId])
}

model PackageDestination {
  packageId     String
  destinationId String
  package       Package     @relation(fields: [packageId], references: [id])
  destination   Destination @relation(fields: [destinationId], references: [id])
  @@id([packageId, destinationId])
}

model PackageItineraryItem {
  id          String  @id @default(cuid())
  packageId   String
  dayNumber   Int
  title       String
  description String?
  package     Package @relation(fields: [packageId], references: [id])
}

// ───────────── Viajes / Salidas programadas ─────────────
model Trip {
  id            String     @id @default(cuid())
  tenantId      String
  packageId     String?
  name          String
  startDate     DateTime
  endDate       DateTime
  capacity      Int                              // cupo máximo
  bookedSeats   Int        @default(0)           // denormalizado, mantenido en transacción
  status        TripStatus @default(SCHEDULED)
  salePrice     Decimal    @db.Decimal(14, 4)
  saleCurrency  Currency   @default(PYG)
  tenant        Tenant     @relation(fields: [tenantId], references: [id])
  package       Package?   @relation(fields: [packageId], references: [id])
  destinations  TripDestination[]
  itinerary     TripItineraryItem[]
  suppliers     TripSupplier[]
  quotes        Quote[]
  bookings      Booking[]
  @@index([tenantId, startDate])
  @@index([tenantId, status])
}

model TripDestination {
  tripId        String
  destinationId String
  trip          Trip        @relation(fields: [tripId], references: [id])
  destination   Destination @relation(fields: [destinationId], references: [id])
  @@id([tripId, destinationId])
}

model TripItineraryItem {
  id          String   @id @default(cuid())
  tripId      String
  dayNumber   Int
  date        DateTime?
  title       String
  description String?
  trip        Trip     @relation(fields: [tripId], references: [id])
}

model TripSupplier {
  id           String   @id @default(cuid())
  tenantId     String
  tripId       String
  supplierId   String
  description  String?
  cost         Decimal  @db.Decimal(14, 4)       // costo para calcular margen
  costCurrency Currency @default(USD)
  trip         Trip     @relation(fields: [tripId], references: [id])
  supplier     Supplier @relation(fields: [supplierId], references: [id])
  @@index([tenantId, tripId])
}

// ───────────── Cotizaciones ─────────────
model Quote {
  id          String      @id @default(cuid())
  tenantId    String
  customerId  String
  tripId      String?
  sellerId    String
  status      QuoteStatus @default(DRAFT)
  validUntil  DateTime?
  totalAmount Decimal     @db.Decimal(14, 4)
  currency    Currency    @default(PYG)
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  customer    Customer    @relation(fields: [customerId], references: [id])
  trip        Trip?       @relation(fields: [tripId], references: [id])
  booking     Booking?                            // si se convierte en reserva
  @@index([tenantId, status])
}

// ───────────── Reservas ─────────────
model Booking {
  id               String        @id @default(cuid())
  tenantId         String
  customerId       String                          // titular (Cliente del CRM)
  tripId           String
  sellerId         String
  quoteId          String?       @unique
  status           BookingStatus @default(PENDING)
  paxCount         Int
  totalAmount      Decimal       @db.Decimal(14, 4)
  currency         Currency      @default(PYG)
  commissionRate   Decimal?      @db.Decimal(5, 2) // % sobre venta
  commissionAmount Decimal?      @db.Decimal(14, 4)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  tenant           Tenant        @relation(fields: [tenantId], references: [id])
  customer         Customer      @relation(fields: [customerId], references: [id])
  trip             Trip          @relation(fields: [tripId], references: [id])
  quote            Quote?        @relation(fields: [quoteId], references: [id])
  passengers       Passenger[]
  installments     Installment[]
  payments         Payment[]
  @@index([tenantId, status])
}

model Passenger {
  id         String    @id @default(cuid())
  tenantId   String
  bookingId  String
  customerId String?                              // opcional: vínculo al CRM
  firstName  String
  lastName   String
  docType    DocumentType?
  docNumber  String?
  birthDate  DateTime?
  booking    Booking   @relation(fields: [bookingId], references: [id])
  customer   Customer? @relation(fields: [customerId], references: [id])
  @@index([tenantId, bookingId])
}

// ───────────── Pagos / Cuotas ─────────────
model Installment {
  id        String            @id @default(cuid())
  tenantId  String
  bookingId String
  number    Int                                   // nº de cuota
  dueDate   DateTime
  amount    Decimal           @db.Decimal(14, 4)
  currency  Currency
  status    InstallmentStatus @default(PENDING)
  booking   Booking           @relation(fields: [bookingId], references: [id])
  payments  Payment[]
  @@index([tenantId, dueDate])
}

model Payment {
  id            String        @id @default(cuid())
  tenantId      String
  bookingId     String
  installmentId String?
  amount        Decimal       @db.Decimal(14, 4)
  currency      Currency
  rateToBase    Decimal?      @db.Decimal(18, 6)  // tasa aplicada congelada
  method        PaymentMethod
  paidAt        DateTime      @default(now())
  receiptNumber String?
  receivedById  String
  booking       Booking       @relation(fields: [bookingId], references: [id])
  installment   Installment?  @relation(fields: [installmentId], references: [id])
  tenant        Tenant        @relation(fields: [tenantId], references: [id])
  @@index([tenantId, paidAt])
}
```

**Notas de modelo:**
- **Cupo:** `Trip.capacity` (máximo) y `Trip.bookedSeats` (denormalizado). Al confirmar/cancelar
  una reserva se ajusta `bookedSeats` **dentro de una transacción** con verificación de
  disponibilidad, para evitar sobreventa. Cupos disponibles = `capacity - bookedSeats`.
- **Margen:** `salePrice − Σ(TripSupplier.cost)` convertido a una moneda común vía `ExchangeRate`.
- **Estado de cuenta:** se calcula desde `Installment` + `Payment` (total / pagado / saldo).
- **Calendario, Dashboard y reportes:** no son tablas; son consultas agregadas sobre lo anterior.

---

## 6. Autenticación

- JWT **access** (corto) + **refresh** (largo, persistido en `RefreshToken` hasheado).
- `bcrypt` para contraseñas.
- Middleware `auth` (verifica access token) → `tenant` (carga `tenantId` al contexto) →
  `requireRole(...)` por endpoint.
- Login unificado: email+contraseña; el `tenantId` sale del usuario autenticado.

---

## 7. Plan de fases propuesto

| Fase | Contenido | Entregable |
|------|-----------|-----------|
| **0** | Diseño (este documento) | Arquitectura + modelo aprobados |
| **1** | Scaffold monorepo, Prisma + Postgres, Tailwind, healthcheck, **fundamentos multi-tenant** (modelo Tenant, AsyncLocalStorage, extensión Prisma), `packages/shared` con **RUC + tests** y helper de fecha | Proyecto corre; aislamiento por tenant funcionando |
| **2** | Auth (JWT access/refresh), usuarios, roles (plataforma/agencia), seed de super-admin + tenant demo, login en el front | Login y rutas protegidas por rol |
| **3** | CRUD **Clientes** (con RUC auto + documentos/alertas) y **Destinos** | Primeros módulos de negocio filtrados por tenant |
| **4** | **Proveedores**, **Paquetes**, **Viajes/Salidas** (cupos, costos, multi-moneda, margen) | Catálogo operativo |
| **5** | **Cotizaciones** y **Reservas** (descuento de cupo, pasajeros, conversión cotización→reserva) | Flujo comercial central |
| **6** | **Pagos**, cuotas, estados de cuenta, recibos | Cuentas por cobrar |
| **7** | **Calendario / Agenda** | Vista unificada de salidas, vencimientos y pagos |
| **8** | **Dashboard y reportes** (con conversión a moneda base) | KPIs e informes |
| **9** | (Más adelante) Capa **SaaS**: onboarding de agencias, planes, límites, suscripciones | Producto vendible |

**MVP sugerido:** Fases 1–6 (de login a cobranza) es un sistema usable de punta a punta para
una agencia. Calendario, dashboard y SaaS se montan encima sin tocar el núcleo.

---

## 8. Preguntas abiertas para confirmar antes de la Fase 1

1. **Postgres:** ¿lo corremos en **Docker local** (te dejo un `docker-compose.yml`) o ya tienes
   una instancia/servicio (Neon, Supabase, RDS…)?
2. **Vectores de prueba del RUC:** ¿me puedes dar 2–3 pares CI→RUC reales y correctos para fijar
   los tests del dígito verificador? (Asegura que el algoritmo coincide exactamente con SET.)
3. **Subida de fotos** (destinos): ¿guardamos solo URLs por ahora (sin storage) o quieres
   integrar almacenamiento de archivos desde la Fase 4?
4. **Nombres de cliente:** ¿`firstName`/`lastName` separados (como propuse) o un único `fullName`?
   (Separados ayuda a futuros documentos SIFEN.)
```
