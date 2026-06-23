# Click Viajes — Análisis de flujos y mejoras propuestas

> Revisión del sistema completo (Fases 0–9). Cada ítem indica **problema**, **propuesta** y
> **esfuerzo** (S/M/L). Prioridad: **P0** (corregir antes de producción real), **P1** (valor de
> negocio / flujos incompletos), **P2** (escala, robustez, DX).

---

## P0 — Seguridad y correctitud

### 1. Aislamiento: super-admin (o request sin contexto) ve datos de todos los tenants
- **Problema:** la extensión de Prisma ([prisma.ts:54](../apps/api/src/lib/prisma.ts)) hace *bypass*
  cuando `tenantId` es null. Un `SUPER_ADMIN` (tenantId null) que llame a `GET /customers`,
  `/trips`, etc. recibe datos **de todas las agencias**, porque esos endpoints solo usan
  `requireAuth` (sin rol). También: si un endpoint futuro olvida `requireAuth`, queda sin aislar.
- **Propuesta:**
  1. **Defensa en profundidad:** que la extensión **lance error** si se consulta un modelo con
     `tenantId` y no hay tenant en contexto, salvo un *bypass* explícito (`runAsPlatform`) para
     operaciones de plataforma. Así un olvido nunca filtra datos.
  2. Bloquear a `SUPER_ADMIN` de los endpoints de negocio del tenant (no le corresponden), o
     exigir que opere "impersonando" un tenant elegido.
- **Esfuerzo:** M

### 2. Permisos dentro de la agencia (admin vs vendedor)
- **Problema:** casi todos los endpoints de negocio solo exigen `requireAuth`. Un **vendedor**
  puede borrar viajes, proveedores, paquetes, destinos, clientes y editar/borrar reservas de
  otros. No hay matriz de permisos.
- **Propuesta:** definir y aplicar una matriz de roles:
  - **AGENCY_ADMIN:** todo (catálogo, usuarios, tasas, borrados).
  - **SELLER:** crear/editar clientes, cotizaciones, reservas y pagos; **sin** borrar catálogo ni
    gestionar tasas/usuarios; idealmente ve/edita **sus** cotizaciones/reservas (no las ajenas).
  - Implementar con `requireRole` por ruta + filtro por `sellerId` en listados para vendedores.
- **Esfuerzo:** M

### 3. Registro público sin verificación ni anti-abuso
- **Problema:** `POST /auth/register-agency` crea agencia + admin con cualquier email, sin
  verificar el correo ni protección contra spam (solo rate-limit por IP).
- **Propuesta:** verificación de email (token por correo) antes de activar la agencia; opcional
  captcha. Mientras tanto, dejar las agencias nuevas en estado "pendiente" hasta verificar.
- **Esfuerzo:** M (requiere envío de emails)

---

## P1 — Flujos de negocio incompletos / de alto valor

### 4. Generar salida desde un paquete (plantilla → viaje)
- **Problema:** los paquetes son plantillas (destinos + itinerario), pero crear un viaje **no**
  precarga nada del paquete; hay que recargar todo a mano. El diseño decía "a partir de las
  cuales se generan salidas".
- **Propuesta:** botón "Crear salida" en cada paquete que abra el form de viaje **precargado**
  (destinos, itinerario, `packageId`, moneda/precio base sugerido).
- **Esfuerzo:** M

### 5. Reserva: total derivado del viaje
- **Problema:** `Booking.totalAmount` se ingresa a mano; no se relaciona con `Trip.salePrice × pax`.
  Riesgo de inconsistencia entre lo que vale el viaje y lo que se cobra.
- **Propuesta:** precargar `total = salePrice × paxCount` (moneda del viaje) al elegir viaje/pax,
  editable; mostrar diferencia si se cambia.
- **Esfuerzo:** S

### 6. Vencimiento de cotizaciones
- **Problema:** `validUntil` se guarda pero las cotizaciones no pasan solas a `EXPIRED`.
- **Propuesta:** marcar `EXPIRED` las cotizaciones vencidas (job diario o al listar/leer) y
  resaltarlas; bloquear su conversión a reserva.
- **Esfuerzo:** S

### 7. Cliente jurídico / RUC directo (SIFEN-ready)
- **Problema:** el RUC es solo lectura derivado del CI. Una **persona jurídica** (RUC propio, sin
  CI) no tiene forma de cargarse correctamente.
- **Propuesta:** campo "tipo de cliente" (física/jurídica). Física: RUC = CI+DV (actual).
  Jurídica: RUC editable directo. Preparar datos fiscales adicionales para SIFEN.
- **Esfuerzo:** M

### 8. Recibos imprimibles
- **Problema:** se guarda `receiptNumber` pero no hay comprobante imprimible (el diseño pedía
  "generación de comprobantes/recibos").
- **Propuesta:** vista de recibo (HTML imprimible / PDF) por pago, con datos de agencia, cliente,
  reserva, monto, método y nº de recibo.
- **Esfuerzo:** M

### 9. Alertas de documentos por vencer
- **Problema:** los vencimientos de documentos solo aparecen en el calendario; no hay aviso
  proactivo.
- **Propuesta:** KPI/badge en dashboard y en la lista de clientes ("documentos por vencer en 30
  días"), con filtro dedicado.
- **Esfuerzo:** S

### 10. CI único por agencia
- **Problema:** se pueden cargar dos clientes con el mismo CI en la misma agencia (duplicados).
- **Propuesta:** índice único `(tenantId, ci)` (permitiendo múltiples nulos) + manejo de 409 en
  el form.
- **Esfuerzo:** S (migración)

---

## P2 — Escala, robustez y DX

### 11. Dashboard: agregar en SQL, no en memoria
- **Problema:** [dashboard.service.ts](../apps/api/src/modules/dashboard/dashboard.service.ts)
  trae **todas** las reservas/pagos/viajes y agrega en JS. No escala con muchos datos.
- **Propuesta:** usar `groupBy`/agregaciones de Prisma/SQL y, para conversión multi-moneda,
  precalcular o convertir en consulta. Paginar/limitar tops.
- **Esfuerzo:** M

### 12. Montos como tipos exactos en transporte
- **Problema:** la BD usa `Decimal` (exacto) ✓, pero la API transporta montos como `number`
  (float JS). El diseño pedía "nunca float".
- **Propuesta:** aceptar/devolver montos como **string** y operar con Decimal en todo el camino
  (Zod `z.string()` validando decimal). Importante antes de facturación/volumen.
- **Esfuerzo:** M (transversal)

### 13. Auditoría (quién hizo qué)
- **Problema:** no hay registro de auditoría; en un ERP con dinero es clave saber quién creó/editó
  reservas, pagos, tasas, usuarios.
- **Propuesta:** tabla `AuditLog` (tenantId, userId, entidad, acción, antes/después, fecha) escrita
  desde una capa central.
- **Esfuerzo:** M

### 14. No hacer hard-delete de registros financieros
- **Problema:** borrar una reserva/pago es destrucción física e irreversible; se pierde historial.
- **Propuesta:** soft-delete / archivado por estado para reservas y pagos (no eliminar registros
  con dinero asociado); mantener trazabilidad.
- **Esfuerzo:** M

### 15. Limpieza de refresh tokens
- **Problema:** `RefreshToken` acumula filas vencidas/revocadas indefinidamente.
- **Propuesta:** job/cron que borre tokens vencidos; opcional "cerrar sesión en todos los
  dispositivos".
- **Esfuerzo:** S

### 16. Nº de recibo correlativo atómico
- **Problema:** se genera con `count()+1` → posible colisión bajo concurrencia (recibos
  duplicados).
- **Propuesta:** secuencia por tenant (tabla contador con update atómico) o constraint único +
  reintento.
- **Esfuerzo:** S

### 17. Observabilidad
- **Problema:** sin logging de requests ni monitoreo de errores.
- **Propuesta:** logger HTTP (pino/morgan) con requestId y tenantId; integrar monitoreo de errores
  (Sentry) en API y front.
- **Esfuerzo:** S

### 18. CI (integración continua)
- **Problema:** las 22 pruebas y el typecheck solo corren localmente.
- **Propuesta:** GitHub Actions con Postgres de servicio que corra `pnpm install`, `pnpm typecheck`
  y `pnpm test` en cada push/PR.
- **Esfuerzo:** S

### 19. Accesibilidad del Modal
- **Problema:** el `Modal` cierra al click fuera pero no atrapa el foco ni cierra con `Escape`.
- **Propuesta:** focus-trap, cierre con `Escape`, restaurar foco al cerrar.
- **Esfuerzo:** S

### 20. Migrar a `prisma.config.ts`
- **Problema:** `package.json#prisma` (seed) está *deprecated* y el LSP de Prisma 7 marca el `url`
  del datasource.
- **Propuesta:** migrar la config (seed + datasource) a `prisma.config.ts`.
- **Esfuerzo:** S

### 21. Recuperación de contraseña
- **Problema:** no hay flujo "olvidé mi contraseña".
- **Propuesta:** token de reseteo por email con expiración.
- **Esfuerzo:** M (requiere emails)

---

## Resumen de prioridades

| Prioridad | Ítems | Foco |
|-----------|-------|------|
| **P0** | 1–3 | Aislamiento estricto, permisos por rol, registro seguro |
| **P1** | 4–10 | Paquete→salida, total de reserva, vencimientos, cliente jurídico, recibos |
| **P2** | 11–21 | Escala (dashboard, montos), auditoría, soft-delete, CI, observabilidad |

**Recomendación de arranque:** P0-1 y P0-2 (aislamiento + roles) por ser de seguridad; luego
P1-4/5/6 (flujos comerciales que ya tienen casi todo el terreno hecho y aportan mucho con poco).
