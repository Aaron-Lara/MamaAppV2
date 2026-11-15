# Supuestos del negocio

Documento provisional. Separa lo confirmado de lo que todavía hay que
preguntar a la usuaria. No inventa datos sobre la cooperativa.

## Lo que sé (dicho por la usuaria)

- Vende dulces, bebidas y alimentos preparados (lonches, tacos, otros).
  Catálogo muy variado.
- Surte los domingos en EE. UU. (HEB, S-Mart) y algunos días en dulcerías de
  México.
- Fía a maestros, alumnos y personal de la escuela. No está confirmado si
  también fía a gente de fuera.
- Cobra yendo con el cliente, cuando vuelve a comprar o cuando viene a pagar.
- También recibe pedidos.
- La app anterior tenía inventario con avisos de stock, fiados, pedidos e
  historial de acciones con fecha.
- El resumen del día puede prepararse cerca de la 1 pm; el recreo concentra
  las ventas y los clientes frecuentes pueden calcularse con ese patrón.

## Confirmado por decisiones o por la implementación

- Compras en dólares (EE. UU.) y en pesos (México), con tipo de cambio.
- El stock se guarda en unidades. Si hicieran falta cajas, se resolverían al
  registrar compras, no en el producto (decisión provisional).
- La aplicación permite registrar abonos; el saldo es ventas fiadas activas
  menos abonos activos.
- Los pedidos están separados de los fiados.
- Las ventas son en efectivo o fiadas; una venta fiada siempre tiene cliente.
- No todo el catálogo se cuenta: cada producto decide si lleva stock.
- Los reportes se calculan a partir de las ventas; no se guardan totales.
- Los clientes no se borran ni se desactivan actualmente.

## Lo que sigue sin confirmar

- Si recibe ticket en las compras.
- Si al cierre del día cuenta el dinero y hace cuentas, y cómo lo hace.
- Si los fiados se pagan completos o siempre por abonos.
- Cuáles son sus gastos fijos.
- Cuántos productos distintos maneja y cuánto vende al día.
- Si fía también a gente de fuera de la escuela.
- Cajas: si compra por caja y vende por pieza, y si el tamaño de la caja
  cambia según la tienda.

## Resuelto o fuera de alcance

- **Recetas e insumos**: idea provisional, fuera del alcance actual. No se
  implementan y no se conoce qué lleva cada producto preparado.
- **`audit_log` / historial de acciones**: no existe ni está implementado.
  Es opcional y no debe confundirse con el historial de periodos de los
  reportes.
- **Lectura de tickets**: no implementada. No hay librería confirmada para el
  SDK actual. Las fotos no se guardan.

## Decisiones de diseño derivadas

- Compras con moneda y tipo de cambio.
- Clientes de nombre libre; pedidos separados de fiados.
- Reportes calculados a partir de ventas, con resumen diario y reportes por
  semana o mes.
- La app funciona sin internet y sin respaldo automático por ahora.
