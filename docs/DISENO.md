# Diseño y arquitectura

Documento de la arquitectura actual de MamaAppV2: capas, navegación, tema y
criterios de interfaz. No describe funcionalidades futuras.

## Arquitectura general

- Expo + TypeScript + `expo-router` + `expo-sqlite`.
- Offline-first: todo funciona sin internet.
- La base `pos.db` se abre una vez en `src/app/_layout.tsx` con
  `SQLiteProvider` y se migra al arrancar (`migrateDbIfNeeded`).
- El dinero se maneja en centavos enteros; las fechas de negocio en
  `AAAA-MM-DD` local.

## Capas

### `src/app/` — rutas y pantallas
- Cada archivo es una ruta de Expo Router.
- Solo composición y presentación: no escriben SQL.
- `_layout.tsx` raíz define `SQLiteProvider`, el tema de navegación y el
  `Stack`.
- `(tabs)/` contiene las cinco pestañas.

### `src/components/` — presentación
- Componentes agrupados por dominio: `sell/`, `inventory/`, `orders/`,
  `debts/`, `purchases/`, `expenses/`, `reports/`, `summary/`, `products/`
  y `stock/`.
- Reciben datos y callbacks ya calculados; no consultan la base.
- `themed-text.tsx` y `themed-view.tsx` aplican el tema.

### `src/hooks/` — estado y carga
- Conectan pantallas con `src/db/`.
- Manejan carga, error, reintento y estado local.
- Ejemplos: `use-sale-cart`, `use-record-sale`, `use-period-report`,
  `use-debtors`, `use-purchase-form`, `use-theme`.
- No contienen SQL.

### `src/db/` — datos
- Único lugar con SQL y transacciones.
- Un archivo por operación o por tabla: `sales-insert`, `sales-void`,
  `purchases-create`, `orders-deliver`, `balances`, `period-profit`, etc.
- Las migraciones viven en `migration-vN-*.ts` y se encadenan en
  `database.ts`.
- Usa `withExclusiveTransactionAsync` para operaciones atómicas.

### `src/lib/` — lógica pura
- Sin acceso a la base ni a React.
- Validaciones, cálculos, formato y reglas: `profit-estimate`,
  `period-dates`, `money`, `purchase-input`, `order-rows`, `stock-review`,
  `void-input`, etc.
- Es la parte más fácil de probar con Jest.

### `src/constants/` — tema
- `theme.ts` define `Colors` (claro/oscuro), `Fonts`, `Spacing`,
  `BottomTabInset` y `MaxContentWidth`.

### `src/ai/` — no existe todavía
- Reservado para voz, foto y resúmenes. Debe quedar aislado y nunca
  bloquear el registro de una venta.

## Flujo de una operación

1. La pantalla en `src/app/` usa un hook de `src/hooks/`.
2. El hook llama a una función de `src/db/`.
3. `src/db/` valida con `src/lib/`, abre la transacción y escribe.
4. El hook actualiza el estado y la pantalla vuelve a leer.

## Navegación

### Pestañas (NativeTabs)
Definidas en `src/components/app-tabs.tsx`, con `(tabs)/_layout.tsx` como
puerta de entrada:

1. **Vender** (`index`) — cuadrícula, filtros y carrito.
2. **Inventario** (`inventory`) — lista, filtros y accesos a compras,
   ajustes y alta de producto.
3. **Pedidos** (`orders`) — estados, atrasados, búsqueda y filtros.
4. **Fiados** (`debts`) — deudores, búsqueda, filtros y alta rápida.
5. **Resumen** (`summary`) — ventas del día, ganancia y acceso a reportes.

### Pantallas apiladas
Con opciones registradas en `src/app/_layout.tsx`:

- `product-form` — nuevo producto.
- `purchases` — lista de compras.
- `purchase-form` — nueva compra.
- `purchase-detail` — detalle de compra.
- `order-form` — nuevo pedido.
- `order-detail` — detalle de pedido.
- `stock-adjust` — ajustar stock.
- `customer-detail` — detalle del cliente.
- `expenses` — lista de gastos.
- `expense-form` — nuevo gasto.
- `expense-detail` — detalle de gasto.

`reports` existe como ruta automática en `src/app/reports.tsx` (reportes por
semana o mes). Todavía no tiene título propio registrado en el `Stack` de
`src/app/_layout.tsx`.

## Tema

- `Colors` tiene modo claro y oscuro: `text`, `background`,
  `backgroundElement`, `backgroundSelected`, `textSecondary`.
- `useTheme()` devuelve la paleta según el esquema del sistema.
- `use-color-scheme` centraliza la detección.
- `Spacing` usa una escala fija (`half` a `six`).
- `BottomTabInset` reserva espacio para la barra nativa.
- `MaxContentWidth` limita el ancho en pantallas grandes.

## Criterios de interfaz

- Listas largas con `FlatList`, nunca `ScrollView` con `map`.
- Montos formateados desde centavos; nunca se muestran decimales sueltos.
- Al usuario nunca se le muestran cantidades negativas de stock.
- Acciones irreversibles o de cantidad grande piden confirmación en pantalla.
- Estados de carga y error con opción de reintentar.
- Botones grandes y texto legible para el modo receso.
- Las acciones destructivas se expresan como "anular" o "desactivar", no
  "borrar".

## Deuda conocida

- **Colores hardcodeados**: hay colores semánticos fuera de `theme.ts`
  (por ejemplo `#3c87f7` en enlaces, `#8a5a00`/`#c62828` para stock bajo y
  agotado, `#f2c46d`/`#ff8a80` en modo oscuro). Centralizarlos es parte del
  rediseño visual pendiente.
- **Sin respaldo**: no hay exportación ni restauración de la base.
- **Sin IA**: no hay módulo de voz, cámara ni OCR.
- **Identidad de la app**: `app.json` conserva nombre, slug y scheme
  provisionales (`temp-app`, `tempapp`).
- **Primitives de interfaz**: `src/components/ui/` todavía no existe. Forma
  parte del rediseño visual pendiente.
