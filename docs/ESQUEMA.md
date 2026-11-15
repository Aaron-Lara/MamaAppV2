# Esquema de base de datos (versión 8)

Base local `pos.db` con `expo-sqlite`. La versión se guarda en
`PRAGMA user_version` y `DATABASE_VERSION` vale 8 en `src/db/database.ts`.
Las migraciones v1–v8 son la fuente de verdad; este documento las resume.

Convenciones:
- Dinero en centavos enteros (`*_cents`).
- Fechas de negocio en `AAAA-MM-DD` (hora local del teléfono).
- `created_at` en UTC con `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`.
- Nada se borra: se anula (`status = 'void'`) o se desactiva (`active = 0`).

## products (v1)
- `id` INTEGER PK
- `name` TEXT NOT NULL
- `price_cents` INTEGER NOT NULL DEFAULT 0
- `category` TEXT
- `track_stock` INTEGER NOT NULL DEFAULT 0 (0 o 1)
- `min_stock` INTEGER NOT NULL DEFAULT 0
- `active` INTEGER NOT NULL DEFAULT 1
- `created_at` TEXT NOT NULL

## customers (v2, ampliada en v7)
- `id` INTEGER PK
- `name` TEXT NOT NULL
- `role` TEXT
- `phone` TEXT
- `notes` TEXT
- `grade` TEXT (v7)
- `group_name` TEXT (v7)
- `created_at` TEXT NOT NULL
- No tiene columna `active`: los clientes no se desactivan hoy.

## sales (v2, ampliada en v4)
- `id` INTEGER PK
- `created_at` TEXT NOT NULL
- `sale_date` TEXT NOT NULL, formato `AAAA-MM-DD`
- `customer_id` INTEGER REFERENCES customers(id)
- `payment_method` TEXT NOT NULL: `cash` o `credit`
- `total_cents` INTEGER NOT NULL, mayor o igual a 0
- `status` TEXT NOT NULL DEFAULT `active`: `active` o `void`
- `voided_at` TEXT (v4)
- `void_reason` TEXT (v4)
- CHECK: si `payment_method = 'credit'`, `customer_id` no puede ser NULL.

## sale_items (v2)
- `id` INTEGER PK
- `sale_id` INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE
- `product_id` INTEGER REFERENCES products(id), opcional
- `description` TEXT NOT NULL
- `quantity` INTEGER NOT NULL, mayor que 0
- `unit_price_cents` INTEGER NOT NULL, mayor o igual a 0
- `product_id` NULL permite la venta rápida "por monto".

## stock_movements (v3)
- `id` INTEGER PK
- `product_id` INTEGER NOT NULL REFERENCES products(id)
- `created_at` TEXT NOT NULL
- `movement_date` TEXT NOT NULL, formato `AAAA-MM-DD`
- `quantity` INTEGER NOT NULL, distinto de 0 (positivo entra, negativo sale)
- `reason` TEXT NOT NULL: `purchase`, `sale`, `adjustment`, `waste` o `void`
- `reference_id` INTEGER
- `note` TEXT
- CHECK: si `reason = 'sale'`, `reference_id` no puede ser NULL.
- El stock actual es la suma de `quantity` por producto.
- `reference_id` mezcla ids de ventas y compras: filtrar siempre por
  `reason`.

## payments (v5)
- `id` INTEGER PK
- `customer_id` INTEGER NOT NULL REFERENCES customers(id)
- `created_at` TEXT NOT NULL
- `payment_date` TEXT NOT NULL, formato `AAAA-MM-DD`
- `amount_cents` INTEGER NOT NULL, mayor que 0
- `note` TEXT
- `status` TEXT NOT NULL DEFAULT `active`: `active` o `void`
- `voided_at` TEXT
- `void_reason` TEXT
- Saldo = ventas fiadas activas − abonos activos.

## purchases (v6)
- `id` INTEGER PK
- `created_at` TEXT NOT NULL
- `purchase_date` TEXT NOT NULL, formato `AAAA-MM-DD`
- `store` TEXT
- `currency` TEXT NOT NULL: `MXN` o `USD`
- `exchange_rate_x10000` INTEGER NOT NULL, mayor que 0
- `total_cents` INTEGER NOT NULL, mayor o igual a 0
- `total_mxn_cents` INTEGER NOT NULL, mayor o igual a 0
- `status` TEXT NOT NULL DEFAULT `active`: `active` o `void`
- `voided_at` TEXT
- `void_reason` TEXT
- CHECK: para MXN, `exchange_rate_x10000 = 10000`.
- CHECK: para USD, `exchange_rate_x10000` entre 10000 y 1000000.

## purchase_items (v6)
- `id` INTEGER PK
- `purchase_id` INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE
- `product_id` INTEGER REFERENCES products(id), opcional
- `description` TEXT NOT NULL
- `units` INTEGER NOT NULL, mayor que 0
- `cost_cents` INTEGER NOT NULL, mayor o igual a 0 (moneda original)
- `cost_mxn_cents` INTEGER NOT NULL, mayor o igual a 0 (en pesos)

## orders (v7, reconstruida en v8)
- `id` INTEGER PK
- `created_at` TEXT NOT NULL
- `customer_id` INTEGER NOT NULL REFERENCES customers(id)
- `order_date` TEXT NOT NULL, formato `AAAA-MM-DD`
- `due_date` TEXT, opcional; si existe, formato válido y mayor o igual a
  `order_date`
- `notes` TEXT
- `status` TEXT NOT NULL DEFAULT `pending`: `pending`, `delivered` o
  `cancelled`
- `delivered_at` TEXT
- `delivered_sale_id` INTEGER UNIQUE REFERENCES sales(id)
- `cancelled_at` TEXT
- `cancel_reason` TEXT
- CHECK de estados: cada estado exige sus campos de cierre y prohíbe los
  demás. En v8, un pedido cancelado puede tener `cancel_reason` NULL; si
  existe, no puede quedar vacío.

## order_items (v7)
- `id` INTEGER PK
- `order_id` INTEGER NOT NULL REFERENCES orders(id) (sin ON DELETE CASCADE)
- `product_id` INTEGER REFERENCES products(id), opcional
- `description` TEXT NOT NULL, no vacía
- `quantity` INTEGER NOT NULL, mayor que 0
- `unit_price_cents` INTEGER NOT NULL, mayor o igual a 0
- Los pedidos no se borran: se cancelan.

## expenses (v7)
- `id` INTEGER PK
- `created_at` TEXT NOT NULL
- `expense_date` TEXT NOT NULL, formato `AAAA-MM-DD`
- `category` TEXT NOT NULL, no vacía
- `description` TEXT
- `amount_cents` INTEGER NOT NULL, mayor que 0
- `status` TEXT NOT NULL DEFAULT `active`: `active` o `void`
- `voided_at` TEXT
- `void_reason` TEXT
- CHECK: `active` no tiene datos de anulación; `void` exige fecha y motivo
  no vacío.

## Relaciones

- `customers` 1 → N `sales`, `payments`, `orders`.
- `sales` 1 → N `sale_items`.
- `products` 1 → N `sale_items`, `stock_movements`, `purchase_items`,
  `order_items` (todas opcionales salvo `stock_movements`).
- `purchases` 1 → N `purchase_items`.
- `orders` 1 → N `order_items`; `orders.delivered_sale_id` apunta a la venta
  creada al entregar.
- `expenses` no se relaciona con compras: una compra no es un gasto.

## Índices

- v2: `idx_sales_sale_date`, `idx_sales_customer`, `idx_sale_items_sale`.
- v3: `idx_stock_movements_product`.
- v5: `idx_payments_customer`.
- v6: `idx_purchases_purchase_date`, `idx_purchase_items_purchase`,
  `idx_purchase_items_product`.
- v7: `idx_orders_status_order_date`, `idx_orders_customer`,
  `idx_orders_due_date`, `idx_order_items_order`,
  `idx_order_items_product`, `idx_expenses_status_date`,
  `idx_expenses_category`, `idx_customers_grade_group`.

## No existe en la base

- `audit_log` ni ningún historial de acciones. Es opcional y no debe
  confundirse con el historial de periodos de los reportes.
- `ingredients` ni `recipes`. Recetas e ingredientes son provisionales y
  están fuera del alcance actual.
- No hay tabla de respaldos ni de configuración.
