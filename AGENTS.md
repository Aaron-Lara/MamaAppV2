This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
- Nada se borra: las ventas se anulan y los productos se desactivan. Los clientes no se borran ni se desactivan actualmente. Toda acción irreversible o de cantidad grande exige confirmación en pantalla. Los mensajes al usuario nunca muestran números negativos de stock
- Los reportes, saldos y totales solo cuentan ventas con status = 'active'.
- Anular una venta nunca la borra: marca status = 'void' y compensa el stock con movimientos 'void'.
- Los pedidos no se borran: se cancelan. Entregar un pedido crea la venta, descuenta stock y marca el pedido como entregado en una sola transacción.
- Los gastos no se borran: se anulan con status = 'void', fecha y motivo. Las compras no son gastos.
- Las fotos de tickets no se guardan: se procesan, se borra el archivo temporal y nunca se guarda su ruta. El proceso de lectura no debe bloquear ventas.
- En stock_movements, el reference_id mezcla ids de ventas y compras: toda consulta por reference_id debe incluir también reason. La anulación de una compra compensa con reason 'purchase' y cantidad negativa, nunca con 'void'.
- Los colores, espacios y tamaños de letra salen de src/constants/theme.ts y del hook useTheme. Quedan colores semánticos hardcodeados: centralizarlos es parte del rediseño visual pendiente.

## Proyecto: app POS e inventario (cooperativa escolar)
Stack: Expo + TypeScript + expo-sqlite (offline-first).
Provisional: las reglas del negocio se ajustarán tras hablar con la usuaria.

### Arquitectura
- Lógica de datos en src/db/. Las pantallas no escriben SQL.
- Lógica pura (validaciones, cálculos, formato) en src/lib/. El estado de las pantallas vive en src/hooks/.
- La IA (voz, foto, resúmenes) va en src/ai/, detrás de funciones aisladas, cuando se implemente. Hoy no existe src/ai/. Nunca debe bloquear el registro de una venta.
- La app debe funcionar sin internet.
- Archivos de 150 - 200 líneas. Variables en inglés, comentarios en español.

### Reglas del negocio
- Cada venta descuenta stock solo de los productos con track_stock = 1. Nunca se bloquea una venta por falta de stock. Las recetas e ingredientes son provisionales y no están implementados.
- Ganancia bruta = ingresos con costo conocido - costo de lo vendido. Los ingresos sin costo conocido se reportan aparte. Ganancia neta = ganancia bruta - gastos activos.
- Dinero siempre en centavos (enteros), nunca en decimales.
- audit_log no existe ni está implementado. Es opcional y no debe confundirse con el historial de periodos de los reportes.

### Forma de trabajar
- Responde en español. Ante ambigüedad, haz máximo 3 preguntas.
- No instales dependencias sin preguntarme; si lo apruebo, usa `npx expo install <paquete>`.
- Una tarea pequeña a la vez; no toques archivos que no te pedí.
- Antes de dar una tarea por terminada, ejecuta lint y `npx tsc --noEmit`, e indica qué cambió.

- Las listas largas usan FlatList, nunca ScrollView con map