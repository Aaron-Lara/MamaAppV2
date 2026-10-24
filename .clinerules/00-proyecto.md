# App POS e inventario para cooperativa escolar
Stack: Expo (React Native) + TypeScript + expo-sqlite (offline-first).

## Arquitectura
- Lógica de datos en src/db/. Las pantallas no escriben SQL.
- La IA (voz, foto, resúmenes) va en src/ai/, detrás de funciones aisladas.
  Nunca bloquea el registro de una venta.
- La app debe funcionar sin internet.
- Archivos de menos de 150 líneas. Nombres de variables en inglés,
  comentarios en español.

## Reglas del negocio
- Cada venta descuenta insumos según la receta del producto.
- Ganancia = ventas - costo de lo vendido - gastos.
- Dinero siempre en centavos (enteros), nunca en decimales.