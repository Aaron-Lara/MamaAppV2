# Supuestos del negocio (provisional, 28-oct-2026)

## Lo que sé
- Vende dulces, bebidas y alimentos preparados (lonches, tacos, otros).
  Catálogo muy variado.
- Surte los domingos en EE. UU. (HEB, S-Mart) y algunos días en
  dulcerías de México.
- Fía a cualquier persona” por: “Fía a maestros, alumnos y personal de la escuela. No sé si también a gente de fuera.
- Cobra yendo con el cliente, cuando vuelve a comprar o cuando viene a pagar.
- También recibe pedidos.
- La app anterior tenía: inventario con avisos de stock, fiados y pedidos,
  e historial de acciones con fecha.
- el resumen del día puede prepararse cerca de la 1 pm, el recreo concentra las ventas y los “frecuentes” pueden calcularse con ese patrón

## Lo que supongo (confirmar)
- Recibe ticket en las compras.
- Las compras en EE. UU. son en dólares; las de México, en pesos.
- Al cierre del día cuenta el dinero y hace cuentas.
- Cajas: sin confirmar. Decisión provisional: el stock se guarda solo en unidades. Si hacen falta cajas, se manejarán al registrar compras, no en el producto. Preguntar a la usuaria: ¿compra por caja y vende por pieza? ¿El tamaño de la caja cambia según la tienda?” Cuando puedas hacer esas dos preguntas, queda decidido con datos reales.
## No sé
- Qué lleva cada producto preparado (recetas, cantidades).
- Cuántos productos distintos maneja ni cuánto vende al día.
- Si los fiados se pagan completos o por abonos.
- Qué hace exactamente al cierre.
- Sus gastos fijos.

## Decisiones de diseño derivadas
- Recetas e insumos: opcionales, fase posterior.
- Compras con moneda y tipo de cambio.
- Clientes de nombre libre; pedidos separados de fiados.
- Historial de acciones con fecha.
- Reportes calculados a partir de ventas; empezar por un resumen diario.
- Lectura de tickets: candidatos expo-ocr-kit, expo-mlkit-ocr y expo-ai-kit; ninguno confirmado con SDK 58. Probar en rama aparte con 3 tickets reales. Plan B: lectura en la nube (unos centavos al mes). Las fotos no se guardan.