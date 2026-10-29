# Esquema provisional de base de datos

## Catálogo
- products: id, name, price_cents, category, track_stock (sí/no),
  min_stock (para avisos), active
  (track_stock opcional: el catálogo es muy variado y no todo se cuenta)

## Ventas (el centro)
- sales: id, created_at, customer_id (opcional), payment_method
  (efectivo | fiado), total_cents, status (activa | anulada)
- sale_items: id, sale_id, product_id (opcional), description,
  quantity, unit_price_cents
  (guarda el precio de ese momento; product_id vacío permite
  una venta rápida "por monto")
- Las ventas se ANULAN, no se borran.

## Inventario
- stock_movements: id, product_id, created_at, quantity (+/-),
  reason (compra | venta | ajuste | merma), reference_id
  (stock actual = suma de movimientos)

## Clientes y fiados
- customers: id, name, role (maestro | alumno | personal | otro, opcional),
  phone, notes
- payments: id, customer_id, created_at, amount_cents, note
  (abonos; saldo = ventas fiadas - pagos)

## Pedidos
- orders: id, customer_id, due_date, status (pendiente | entregado | cancelado)
- order_items: id, order_id, product_id (opcional), description, quantity
  (al entregar, se convierte en una venta)

## Compras y gastos
- purchases: id, created_at, store, currency (MXN | USD),
  exchange_rate, total_cents
- purchase_items: id, purchase_id, product_id (opcional), description,
  quantity, unit_cost (moneda original), unit_cost_mxn_cents
- expenses: id, created_at, category, amount_cents, note

## Historial
- audit_log: id, created_at, entity, entity_id, action
  (crear | editar | eliminar | anular), detail
  (como el historial de la app anterior)

## Fase posterior (NO se construye todavía)
- ingredients, recipes (para descontar insumos de lonches y tacos
  cuando alguien confirme las recetas)