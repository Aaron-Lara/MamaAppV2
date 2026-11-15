# Plan actual del proyecto (seguimiento)

Este archivo registra el estado de los **nueve puntos actuales** del proyecto.
Los nueve puntos provienen de la sección 14 del documento de traspaso.

No sustituye al plan histórico
`plan_de_acci_n_app_cooperativa_con_ia.md`, que conserva las cuatro fases
originales y no se modifica. La correspondencia entre ambos documentos es
aproximada y se marca como inferencia.

## Estado de los nueve puntos

| # | Punto | Estado | Evidencia en el código |
|---|-------|--------|------------------------|
| 1 | Compras | Completado | Tablas `purchases` y `purchase_items` (v6), registro con moneda y tipo de cambio, anulación con compensación de stock (`reason = 'purchase'`). |
| 2 | Ganancia estimada | Completado | `src/lib/profit-estimate.ts`, `src/db/day-profit.ts`, `src/db/period-profit.ts` y `src/lib/period-profit-estimate.ts`. |
| 3 | Refactor de migraciones | Completado | Migraciones v1–v8 separadas por versión, encadenadas en `src/db/database.ts`; las versiones aplicadas no se editan. |
| 4 | Pedidos, gastos y grado/grupo | Completado | Tablas `orders`, `order_items` y `expenses` (v7); columnas `customers.grade` y `customers.group_name` (v7). |
| 5 | Reportes semanales/mensuales e historial | Completado y probado en Android | `src/app/reports.tsx`, `src/lib/period-dates.ts`, `period-history.ts`, `period-compare.ts`; prueba en dispositivo reportada por la usuaria. |
| 6 | Limpieza y documentación | Completado | Documentación actualizada: `AGENTS.md`, `ESQUEMA.md`, `NOTAS.md`, `SUPUESTOS.md`, `DISENO.md` y este plan. |
| 7 | Rediseño visual | Pendiente | El tema existe, pero hay colores semánticos hardcodeados (ver `DISENO.md`). |
| 8 | APK y respaldo/restauración | Pendiente | No hay código de respaldo, exportación ni restauración. Incluye APK, respaldo y prueba de restauración. |
| 9 | IA | Pendiente | No existe `src/ai/` ni dependencias de audio, cámara u OCR. |

## Correspondencia aproximada con las cuatro fases históricas

Las relaciones siguientes son **inferencias** para dar contexto; no están
escritas así en el documento histórico.

| Punto actual | Fase histórica | Relación |
|--------------|----------------|----------|
| 1 Compras | Fase 1 | Inferida: la fase habla de inventario e insumos, no de compras como módulo. |
| 2 Ganancia estimada | Fase 4 | Inferida: la fase incluye analítica y gráficas. |
| 3 Refactor de migraciones | Ninguna | Trabajo técnico posterior, no previsto en el plan histórico. |
| 4 Pedidos, gastos y grado/grupo | Fase 2 y Fase 4 | Inferida: clientes/fiados y pulido del dashboard. |
| 5 Reportes semanales/mensuales e historial | Fase 4 | Inferida: analítica de ventas. |
| 6 Limpieza y documentación | Fase 4 | Inferida: pulido y ajustes finales. |
| 7 Rediseño visual | Fase 4 | Inferida: ajustes de interfaz con retroalimentación. |
| 8 APK y respaldo/restauración | Fase 4 | Parcial: la fase habla de desplegar en Expo Go, no de APK ni respaldo. |
| 9 IA | Fase 3 | Directa: voz, transcripción y cierre del día. |

## Límites de esta verificación

- El estado de los puntos 1–4 y 9 se comprobó leyendo el código y las migraciones.
- El punto 5 se documenta como "probado en Android" porque lo reportó la
  usuaria; no hay evidencia de esa prueba dentro del repositorio.
- No se verificaron tareas de Git, ni commits, ni ramas.
- El documento de traspaso (sección 14) no se encontró dentro del repositorio;
  los nueve puntos se tomaron de la instrucción de la usuaria.
