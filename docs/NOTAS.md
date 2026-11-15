# Notas técnicas del proyecto

Bitácora de lo implementado y de lo pendiente. Se actualiza cuando cambia el
código o una decisión confirmada.

## Implementado

### Catálogo e inventario
- Productos con precio en centavos, categoría, `track_stock`, `min_stock` y
  `active`. Los productos se desactivan; nunca se borran.
- El stock es la suma de `stock_movements.quantity`. No se guarda un total
  aparte.
- Solo los productos con `track_stock = 1` mueven inventario. Los demás se
  venden sin afectar existencias.
- Ajustes de stock manuales con motivo (`adjustment` o `waste`).
- Avisos de stock bajo y agotado; al usuario nunca se le muestran cantidades
  negativas.

### Ventas
- Venta en efectivo o fiada. Una venta fiada siempre tiene cliente.
- La venta guarda renglones con descripción, cantidad y precio del momento.
  Un renglón puede no tener producto (venta rápida "por monto").
- La venta descuenta stock en la misma transacción. Nunca se bloquea por
  falta de existencias.
- Anular una venta la marca `status = 'void'` y devuelve el stock con
  movimientos `reason = 'void'`. No se borra nada.
- Una venta fiada no se puede anular si dejaría el saldo del cliente en
  negativo.

### Fiados y clientes
- Clientes con nombre libre, rol, teléfono, notas, grado y grupo.
- Saldo = ventas fiadas activas − abonos activos.
- Los abonos se anulan con `status = 'void'`; no se borran.
- Solo aparecen como deudores los clientes con saldo mayor que cero.
- Los clientes no se borran ni se desactivan actualmente.

### Compras
- Compras en pesos o dólares, con tipo de cambio entero `x10000`.
  Para MXN el tipo de cambio siempre es `10000`.
- Cada renglón guarda unidades y costo total en moneda original y en pesos.
- Las compras alimentan el costo de lo vendido.
- Anular una compra compensa el stock con movimientos `reason = 'purchase'`
  y cantidad negativa. No se usa `reason = 'void'`.

### Pedidos
- Pedido con cliente, fecha, fecha de entrega opcional, notas y renglones.
- Estados: `pending`, `delivered`, `cancelled`.
- Entregar un pedido crea la venta (efectivo o fiado), descuenta stock y
  marca el pedido como entregado, todo en una sola transacción.
- Cancelar un pedido no exige motivo desde la versión 8.
- Los pedidos no se borran.

### Gastos
- Gastos con fecha, categoría, descripción y monto en centavos.
- Se anulan con `status = 'void'`, fecha y motivo. No se borran.
- Las compras no son gastos.

### Ganancia y reportes
- Ganancia bruta = ingresos con costo conocido − costo de lo vendido.
- Los ingresos sin costo conocido se reportan aparte; no se mezclan con la
  ganancia.
- Ganancia neta = ganancia bruta − gastos activos.
- En periodos, cada venta usa el costo conocido en su propia fecha.
- Reportes por semana (lunes a domingo) o mes calendario, con comparación
  contra el periodo anterior, productos principales e historial de periodos.
- Solo cuentan ventas y gastos con `status = 'active'`.

## Decisiones técnicas

- Expo + TypeScript + `expo-sqlite`, offline-first. Base local `pos.db`.
- Versión de base de datos: 8. Las migraciones aplicadas no se editan; los
  cambios nuevos van en `migration-vN-*.ts` y suben `DATABASE_VERSION`.
- Dinero siempre en centavos enteros. Nunca decimales.
- Fechas locales en formato `AAAA-MM-DD`; `created_at` en UTC.
- Nada se borra: se anula o se desactiva.
- `stock_movements.reference_id` comparte ids de ventas y compras. Toda
  consulta por `reference_id` debe filtrar también por `reason`.
- Las pantallas no escriben SQL. La lógica de datos vive en `src/db/` y la
  lógica pura en `src/lib/`. El estado se maneja con hooks en `src/hooks/`.
- Los reportes y saldos se calculan a partir de las ventas, no se guardan.
- La app debe funcionar sin internet.

## Pendiente

- Rediseño visual. Varios colores semánticos están hardcodeados fuera del
  tema; ver `DISENO.md`.
- APK, respaldo de la base y prueba de restauración.
- IA: voz, foto de tickets y resúmenes. Debe vivir en `src/ai/` y nunca
  bloquear el registro de una venta.
- Recetas e ingredientes: idea provisional, fuera del alcance actual.

## Operación

- No hay respaldo automático. La base vive solo en el teléfono.
- Las fotos de tickets no se guardan: se procesan, se borra el archivo
  temporal y nunca se guarda su ruta.
