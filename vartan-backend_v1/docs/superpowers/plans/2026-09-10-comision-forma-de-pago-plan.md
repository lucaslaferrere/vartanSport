# Plan de implementación: comisión como dato de la forma de pago

**Diseño:** `docs/superpowers/specs/2026-09-10-comision-forma-de-pago-design.md`

## Objetivo

Eliminar las decisiones por nombre, substring, ID y override. La forma de pago
define la tasa vigente; cada venta guarda una copia congelada de la tasa
aplicada. Los pagos posteriores no alteran comisión, descuento ni ganancia.

El despliegue se divide en tres fases compatibles. Cada fase puede quedar en
producción sin depender de que la siguiente se publique simultáneamente.

## Reglas centralizadas

- `2.5` significa 2,5%.
- Descuento: `round(precio_venta * tasa / 100, 2)`.
- `usa_financiera` deriva de `comision_porcentaje_aplicado > 0`.
- Una venta nueva congela la tasa vigente de su forma de pago.
- Cambiar la forma de pago congela la tasa vigente de la nueva forma.
- Cambiar solo el precio recalcula con la tasa ya congelada.
- Editar productos, transporte u observaciones no cambia la tasa congelada.
- Registrar pagos no cambia tasa, descuento ni ganancia.
- Los recálculos históricos usan la tasa congelada.

## Paso 0 — Línea base y resguardo

1. Registrar el commit exacto de backend y frontend.
2. Ejecutar `go build ./...`, `go vet ./...`, TypeScript y ESLint focalizado.
3. Guardar ventas, costo, descuento y ganancia de un mes cerrado.
4. Repetir el chequeo paginado de las 750 ventas; se esperan 0 inconsistencias.
5. Obtener un respaldo de la base antes del backfill.

No avanzar si los totales no pueden reproducirse o la línea base difiere.

## Fase 1 — Backend compatible

### 1. Modelo y esquema

En `models/sale.go`:

- agregar `FormaPago.ComisionPorcentaje`, JSON `comision_porcentaje`, SQL
  `decimal(5,2) NOT NULL DEFAULT 0`;
- agregar `Venta.ComisionPorcentajeAplicado`, JSON
  `comision_porcentaje_aplicado`, con el mismo tipo SQL;
- conservar temporalmente los overrides en los DTO, pero ignorarlos al calcular.

Validar siempre `0 <= comision_porcentaje <= 100` en backend.

### 2. Helper único

Crear un helper puro que reciba precio y porcentaje, valide la tasa, calcule
`precio * porcentaje / 100` y redondee a dos decimales. No debe consultar la
base ni conocer nombres de formas de pago.

Agregar pruebas de tabla para 0%, 2,5%, 100%, redondeo y tasas inválidas.

### 3. Alta de ventas

En `controllers/sales.go`:

- eliminar `financieraRate` y la comparación con `"Financiera"`;
- cargar la forma elegida y congelar su tasa en la venta;
- calcular `descuento` con el helper;
- derivar `usa_financiera` de la tasa congelada;
- ignorar los overrides enviados por un frontend viejo.

Probar ventas al 0% y 2,5%, y un request antiguo con el override contrario.

### 4. Edición de ventas

En ambos caminos de edición:

- si cambia `forma_pago_id`, congelar la tasa vigente de la nueva forma;
- si no cambia, conservar `comision_porcentaje_aplicado` aunque haya cambiado la
  tasa maestra;
- si cambia el precio, recalcular el importe con la tasa congelada;
- derivar siempre `usa_financiera` de la tasa congelada;
- ignorar los overrides antiguos.

Probar el congelado: crear al 2,5%, cambiar la tasa maestra a 3%, editar el
precio y comprobar que se usa 2,5%. Probar también que cambiar la forma de pago
sí congela la nueva tasa.

### 5. Pagos y saldo

En `UpdateVentaPago` y el endpoint nuevo de pagos:

- eliminar `FormaPagoSaldoID == 1`;
- no modificar descuento, tasa aplicada, flag ni ganancia;
- conservar la forma de pago del saldo como información del cobro.

Probar que cancelar el saldo con una forma de otra tasa deja esos cuatro valores
exactamente iguales.

### 6. Recálculos históricos

Cambiar `RecalcularCostos` para calcular el descuento exclusivamente con
`venta.comision_porcentaje_aplicado`, nunca con nombre o tasa vigente. Probarlo
cambiando primero la tasa maestra.

### 7. Backfill registrado una vez

Implementar una migración identificada, por ejemplo
`20260910_comision_forma_pago`, registrada en una tabla de migraciones aplicadas
y ejecutada en una transacción:

1. AutoMigrate agrega las columnas.
2. Si la migración ya figura aplicada, no hace nada.
3. Asigna 2,5 a la forma llamada `Financiera`.
4. Asigna 2,5 a ventas con `usa_financiera = true` y 0 al resto.
5. Registra la migración solo si todo terminó bien.

`SeedFormasPago` puede crear filas con tasa inicial, pero nunca actualizar una
tasa existente en cada arranque. Probar dos ejecuciones y que un cambio posterior
del dueño no vuelva a 2,5.

### 8. Contrato API y control

- Confirmar que `GET /api/formas-pago` expone la tasa.
- Validar el rango en cualquier endpoint de alta o edición de formas de pago.
- Buscar cálculos residuales por nombre, ID y constante.
- Ejecutar build, vet y pruebas.
- Aplicar primero sobre una copia de datos y comparar totales.
- Publicar backend y verificar que el frontend viejo continúa funcionando.

## Fase 2 — Frontend

### 9. Contratos

- Agregar `comision_porcentaje` a `IFormaPago`.
- Agregar `comision_porcentaje_aplicado` a `IVenta`.
- Quitar el override de los requests activos.
- Tolerar una tasa ausente como 0 durante la transición.

### 10. Alta y edición

En `AgregarVentaModal`, usar la tasa de la forma seleccionada para la estimación,
con la misma fórmula y redondeo, y dejar de enviar el override.

En `EditarVentaModal`, eliminar estado y controles del override. Usar la tasa
congelada mientras no cambie la forma de pago; si cambia, usar la tasa de la
nueva selección. Dejar de enviar el override.

### 11. Pagos y detalle

En `RegistrarPagoModal`, eliminar toda detección, cálculo y presentación de
comisión. Mostrar solamente pago, seña acumulada y saldo.

En `DetalleVentaModal`, mostrar `descuento` y
`comision_porcentaje_aplicado`; nunca la tasa maestra actual.

### 12. Control frontend

- Quitar overrides de los payloads de `venta.service.ts`.
- Revisar cada coincidencia de las búsquedas del diseño.
- Ejecutar TypeScript y ESLint focalizado.
- Probar alta al 0% y 2,5%, edición de precio, cambio de forma y cancelación de
  saldo.
- Publicar frontend y repetir totales y consistencia.

## Fase 3 — Limpieza

Cuando no queden frontends viejos activos:

- eliminar overrides de todos los DTO de entrada y del parseo multipart;
- mantener `Venta.UsaFinanciera` únicamente como salida histórica derivada;
- actualizar documentación de API y pruebas de contrato;
- comprobar que enviar overrides no cambia ningún cálculo.

Repetir compilación, pruebas, totales y chequeo de consistencia.

## Criterios de aceptación

- No se identifica una comisión por nombre, substring o ID.
- No existe lógica de comisión en pagos parciales.
- Cada venta guarda tasa, descuento y flag derivados de una única forma de pago.
- Cambiar una tasa maestra no modifica ventas existentes.
- Editar precio usa la tasa congelada; cambiar forma congela una nueva.
- El backfill corre exactamente una vez y no sobrescribe configuración.
- Las 750 ventas mantienen 0 inconsistencias.
- Los totales del mes cerrado coinciden antes y después de cada fase.
