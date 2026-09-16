# Comisión como dato de la forma de pago

**Fecha:** 2026-09-10
**Estado:** propuesto — en revisión

## Problema

La comisión de la financiera (2,5%) está hardcodeada en el código y la misma regla
de negocio se identifica de tres maneras incompatibles entre sí:

| Criterio | Dónde |
|---|---|
| Nombre exacto `== "Financiera"` | `sales.go` (2 sitios), `migraciones.go` |
| Substring `.includes('financiera')` | `AgregarVentaModal.tsx`, `RegistrarPagoModal.tsx` |
| ID mágico `== 1` | `sales.go` (pago de saldo) |

Esta divergencia es la causa raíz de que el bug haya vuelto tres veces (commits
`b499a5a`, `cdd21be`, `6824db5`): nunca fue el mismo bug, sino tres copias de la
misma regla desincronizándose.

### Bloqueante para el alta de clientes nuevos

`SeedFormasPago` crea las formas de pago en el orden: Señas, Financiera, Valu
Tahiel, Cuenta 0, Efectivo. En una base nueva, **ID 1 sería "Señas"**.

En la base de Mayorea, ID 1 es "Financiera" por el orden histórico de inserción,
de modo que el `== 1` funciona por casualidad. En el primer cliente nuevo, ese
código descontaría 2,5% de la ganancia cuando el saldo se paga con Señas, y no
descontaría nada cuando se paga con Financiera. Sin errores y con números
plausibles.

## Evidencia recogida

Sobre 750 ventas reales de producción, consultadas vía `/api/owner/ventas`:

| Medición | Resultado |
|---|---|
| Ventas con `usa_financiera` | 477 (64%) |
| Ventas con pagos parciales (`forma_pago_saldo_id`) | 68 (9%) |
| Ganancias inconsistentes con `total - costo - descuento` | **0** |
| Override usado para perdonar la comisión | **0** |
| Override usado para forzar la comisión | **0** |

Conclusiones:

- El doble descuento del sitio del ID mágico **nunca se materializó** en datos, por
  lo que eliminarlo no mueve ningún número histórico.
- El override manual **nunca se usó** en ninguna dirección.
- La comisión es un camino caliente (64% de las ventas), no marginal.

## Decisiones de diseño

**1. La comisión pertenece a la venta, no al pago.**
Se cobra una sola vez, sobre el precio de la venta, según la forma de pago de la
venta. La forma de pago con la que se cancela un saldo se conserva como
información del cobro, pero **no afecta la ganancia**.

**2. La tasa es un dato de la forma de pago.**
`FormaPago` gana `comision_porcentaje`. "Financiera" deja de existir como concepto
en el código y pasa a ser una fila con 2,5.

**3. La tasa aplicada se congela en la venta.**
`Venta` gana `comision_porcentaje_aplicado`. Ver la sección siguiente.

**4. Se elimina el override manual.**
`usa_descuento_financiera` y `usa_financiera` dejan de aceptarse como entrada.

El override hoy está a medio implementar: el frontend lo envía desde
`AgregarVentaModal` y `EditarVentaModal`, pero `processVenta` no lo lee al crear
la venta. Solo se honra al actualizar. Hay un control en pantalla que en el alta
no tiene efecto, lo que explica que la evidencia muestre cero usos.

**5. Se elimina el descuento por ID mágico**, y con él la sección de
`RegistrarPagoModal` que lo anunciaba en pantalla.

**6. La columna `usa_financiera` se conserva**, escrita como valor derivado
(`comision_porcentaje_aplicado > 0`). No se renombra: está expuesta en la API y
usada en el frontend, y renombrarla no aporta a este cambio.

## Qué pasa cuando la tasa cambia

Hoy la tasa es una constante, así que el problema no existe. Al volverse un dato
editable aparece: si el cálculo consultara siempre la tasa vigente, editar una
venta de marzo la recalcularía con la tasa de hoy y reescribiría el pasado en
silencio.

Es el mismo problema que el proyecto ya resolvió para el costo, con el commit
*"snapshot costo_unitario en venta_detalles al crear venta"*. La solución es la
misma: **congelar**.

`Venta.comision_porcentaje_aplicado` guarda la tasa con la que se calculó esa
venta. Reglas:

| Acción | Efecto sobre la comisión |
|---|---|
| Alta de una venta | Toma la tasa vigente de su forma de pago y la congela |
| Cambio de forma de pago | Vuelve a tomar la tasa vigente de la nueva forma y la congela |
| Cambio de precio de venta | Recalcula el importe **con la tasa congelada**, no con la vigente |
| Editar productos, transporte, observaciones | No toca la comisión |
| Registrar un pago o cancelar el saldo | No toca la comisión |
| `RecalcularCostos` | Usa la tasa congelada de cada venta; **nunca** la vigente |

La diferencia con recalcular al precio actual usando la tasa vigente es
deliberada: cambiar el precio de una venta es corregir un dato de esa venta, no
re-negociarla con las condiciones comerciales de hoy. Con esta regla, la tasa de
una venta solo cambia si cambia su forma de pago, que es el único hecho que
realmente la determina.

La columna además evita depender de derivar `descuento / precio_venta × 100`, que
deja de ser confiable en cuanto el precio se edita.

## Cambios por sitio

### Backend

| Sitio | Hoy | Queda |
|---|---|---|
| `models/sale.go` `FormaPago` | solo `id`, `nombre` | agrega `comision_porcentaje` |
| `models/sale.go` `Venta` | — | agrega `comision_porcentaje_aplicado` |
| `models/sale.go` DTO de alta | acepta `usa_descuento_financiera` | se quita |
| `models/sale.go` DTO de edición | acepta ambos overrides | se quitan |
| `sales.go:20` | `const financieraRate = 0.025` | se elimina |
| `sales.go` actualizar venta | compara nombre | helper con tasa congelada |
| `sales.go` crear venta | compara nombre | helper con tasa vigente, y la congela |
| `sales.go` actualizar pago | lee el flag de entrada | no toca la comisión |
| `sales.go` bloque `UsaFinanciera` | recalcula por flag | no toca la comisión |
| `sales.go` bloque `FormaPagoSaldoID == 1` | ID mágico, doble cobro | **se elimina** |
| `migraciones.go` | compara nombre | usa la tasa congelada de cada venta |
| `main.go` `SeedFormasPago` | crea nombres | además hace el backfill inicial |

Se agrega un único helper que calcula el importe a partir de una tasa y un
precio, y todos los caminos pasan a llamarlo.

### Frontend

| Archivo | Hoy | Queda |
|---|---|---|
| `ventaEntity.ts` `IFormaPago` | `id`, `nombre` | agrega `comision_porcentaje` |
| `ventaEntity.ts` `IVenta` | — | agrega `comision_porcentaje_aplicado` |
| `IVentaRequest.ts` | incluye el override | se quita |
| `venta.service.ts:39,67` | envía el override | deja de enviarlo |
| `AgregarVentaModal.tsx:66` | `.includes('financiera')` | lee la tasa de la forma de pago |
| `AgregarVentaModal.tsx:238` | envía el override | deja de enviarlo |
| `EditarVentaModal.tsx:193` | envía el override | deja de enviarlo |
| `RegistrarPagoModal.tsx:30,257-264` | calcula y anuncia comisión sobre el pago | **se elimina la sección** |
| `DetalleVentaModal.tsx:284` | rótulo fijo `Sí (-3%)` | muestra importe y tasa congelados |

`DetalleVentaModal` debe mostrar `descuento` y `comision_porcentaje_aplicado` de
la venta, **no** `venta.forma_pago.comision_porcentaje`: esa fila pudo cambiar
después. Hoy además el rótulo dice `-3%` mientras el sistema cobra 2,5%.

## Modelo de datos y migración

**Columnas:**

- `forma_pagos.comision_porcentaje` — `decimal(5,2) NOT NULL DEFAULT 0`
- `venta.comision_porcentaje_aplicado` — `decimal(5,2) NOT NULL DEFAULT 0`

**Convención:** se almacena `2.5` para dos y medio por ciento. El importe se
calcula como `precio × comision / 100` y se redondea a dos decimales antes de
persistir. Es la misma convención que ya usa `usuarios.porcentaje_comision`.

**Validación:** `0 <= comision_porcentaje <= 100`, rechazada en el endpoint de
alta y edición de formas de pago.

**Backfill, por única vez:**

1. `AutoMigrate` agrega ambas columnas con default 0.
2. Un paso de backfill **idempotente y de una sola ejecución** asigna:
   - `forma_pagos.comision_porcentaje = 2.5` donde `nombre = 'Financiera'`
   - `venta.comision_porcentaje_aplicado = 2.5` donde `usa_financiera = true`

El backfill **no puede ejecutarse en cada arranque**: un `UPDATE ... SET 2.5` en
cada boot impediría que el dueño cambie la tasa después, porque el siguiente
deploy la revertiría. Debe registrarse su ejecución (tabla de migraciones
aplicadas o condición que no vuelva a cumplirse) y no repetirse.

Para Mayorea el comportamiento resultante es idéntico al actual, número por
número. Para un cliente que no cree una fila "Financiera", la comisión no existe,
sin código específico para ese cliente.

## Despliegue en tres fases

No conviene depender de que backend y frontend se publiquen en el mismo instante:
son dos servicios distintos en Coolify. El cambio se hace compatible hacia atrás:

**Fase 1 — backend.** Agrega las columnas, expone `comision_porcentaje` en el
endpoint de formas de pago, deriva siempre la comisión de la forma de pago e
**ignora** los overrides que siga enviando el frontend viejo. Frontend viejo
contra backend nuevo: sigue funcionando, su estimación en pantalla coincide
mientras la forma de pago se llame "Financiera".

**Fase 2 — frontend.** Empieza a consumir la tasa, deja de enviar los overrides y
se elimina la sección de `RegistrarPagoModal`.

**Fase 3 — limpieza.** Se eliminan los campos de override de los DTO, una vez que
no queda ningún cliente enviándolos.

Sin este orden, un frontend nuevo contra un backend viejo podría enviar un cero
implícito y quitar la comisión durante una edición.

## Fuera de alcance

- **Costo de productos en dólares y cotización.** Trabajo separado; requiere un
  mecanismo de configuración que hoy no existe en el sistema.
- **Comisión por pago individual.** Descartada por la evidencia; si en el futuro
  hiciera falta, la tasa ya vive en la forma de pago y la evolución es limpia.
- **Renombrar `usa_financiera`.**

## Notas para quien implemente

**Los números de línea de este documento caducan.** Están tomados de `b9edadf` y
se desplazan con la primera edición. Para ubicar los sitios, usar búsqueda por
patrón:

```
rg -n 'financieraRate|"Financiera"|usa_financiera|UsaFinanciera|usaFinanciera' --glob '*.go'
rg -n "includes\('financiera'\)|usa_descuento_financiera" --glob '*.tsx' --glob '*.ts'
```

Al terminar, esas búsquedas no deben devolver ningún cálculo: solo la columna
`usa_financiera` en el modelo y su escritura derivada.

**Este es un camino caliente.** El 64% de las ventas de Mayorea pasa por acá, en
producción y con datos reales. Un error no rompe la aplicación: guarda ganancias
equivocadas que después hay que reconstruir a mano.

## Verificación

1. `go build ./...`, `go vet`, `tsc` y ESLint limpios.
2. Antes de deployar: registrar los totales de un mes cerrado.
3. Después de cada fase: los mismos totales deben coincidir exactamente.
4. Chequeo de consistencia sobre ventas de producción. Se corrió antes del cambio
   sobre 750 ventas con resultado 0 inconsistencias; ese es el valor a reproducir.
   Para cada página de `GET /api/owner/ventas?page=N&limit=50`, verificar por
   cada venta:

   ```
   abs(ganancia - (total - costo - descuento)) <= 0.5
   ```

5. Alta de dos ventas de prueba, una con forma de pago al 0% y otra al 2,5%,
   comparando la ganancia estimada en pantalla contra la guardada.
6. Prueba de congelado: crear una venta, cambiar después la tasa de esa forma de
   pago, editar el precio de la venta original y confirmar que el importe se
   recalcula con la tasa vieja, no con la nueva.
7. Prueba de pagos: cancelar el saldo de una venta con una forma de pago distinta
   y confirmar que `descuento` y `ganancia` no se modifican.
