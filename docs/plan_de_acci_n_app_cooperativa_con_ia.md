# Plan de Acción y Documentación del Proyecto: App de Gestión y Punto de Venta con IA para Cooperativa Escolar

## 1. Resumen Ejecutivo y Propósito del Proyecto

### ¿Qué es la aplicación?

Es una aplicación móvil multiplataforma (orientada a dispositivos Android/iOS mediante **Expo Go**) diseñada como un **Punto de Venta (POS) Inteligente y Sistema de Gestión Operativa**. Combina una interfaz táctil de alta velocidad para entornos de alta demanda con herramientas de **Inteligencia Artificial (IA)** para comandos de voz, procesamiento automático de datos y analítica en tiempo real.

### ¿Para quién es?

Está diseñada específicamente para la **administradora de una cooperativa escolar** (en este caso de uso real, tu madre), quien opera el establecimiento sola o con auxilio puntual de personal, atendiendo a alumnos, docentes y personal administrativo.

### ¿Por qué se crea?

1. **Necesidad Operativa Real:** La versión previa del software requería captura 100% manual, lo que generaba fricción durante las horas pico de venta (recesos escolares). Esto obligaba a la usuaria a recurrir a cuadernos de papel para llevar cuentas, fiados y sumas al final de la jornada.

2. **Caso de Estudio y Portafolio Profesional:** Servirá como un proyecto práctico de alto impacto para validar capacidades en desarrollo móvil con **React Native / Expo Go**, integración de modelos de lenguaje e IA conversacional, análisis de usabilidad (UX) enfocado en fricción cero, y uso de herramientas avanzadas de asistencia de código (**Claude Code**).

## 2. Definición del Problema a Resolver

```
    [ PROBLEMA ACTUAL ]                          [ SOLUCIÓN CON LA APP ]
• Filas largas y tiempo limitado.        ➔ • Interfaz de 1 solo toque (Botones Gigantes).
• Cuadernos de papel para fiados.        ➔ • Módulo digital de fiados con historial.
• Conteo manual al final del día.        ➔ • Dashboard automático e informes con IA.
• Captura manual lenta en cel/tablet.    ➔ • Entrada por voz (Push-to-Talk) y Visión IA.

```

1. **Saturación en Horas Pico:** El recreo o receso escolar dura entre 20 y 30 minutos. La alta concentración de alumnos exige registrar ventas en fracciones de segundo.

2. **Falta de Trazabilidad en "Fiados":** El registro de cuentas pendientes para profesores o alumnos autorizados en cuadernos de papel genera pérdidas financieras por olvidos o errores de cálculo.

3. **Pérdida de Tiempo en Cierre de Caja:** Al terminar el día, la usuaria invierte tiempo extra sumando ventas, calculando totales de efectivo vs. fiado y revisando qué productos deben surtirse.

4. **Complicación en Productos Preparados (Lonches):** Dificultad para descontar insumos (pan, jamón, queso) cuando el producto vendido es un alimento preparado al momento.

## 3. Características y Funcionalidades del Sistema

### A. Módulo de Venta Ultrarrápida (Modo Receso)

* **Grid de Botones Gigantes:** Configuración de productos estrella y montos frecuentes (\$10, $15, $20, Combo Lonche + Bebida) para registrar ventas en 0.5 segundos con un solo toque.

* **Cobro por Lotes:** Selección consecutiva de ítems sin menús desplegables intermedios.

### B. Módulo de Inteligencia Artificial (Push-to-Talk y Visión)

* **Reconocimiento de Voz Contextual (Push-to-Talk):** Botón flotante para mantener presionado y dictar ventas complejas o fiados (ej. *"Dos lonches de jamón y un jugo para la cuenta de la Maestra Elena"*). Se utiliza únicamente al presionar el botón para evitar captar ruido ambiental o conversaciones ajenas.

* **Filtrado e Interpretación por IA:** El modelo procesa la intención, descarta frases no relacionadas con ventas y asigna los productos o la deuda al cliente correspondiente.

* **Procesamiento de Tickets/Facturas (Visión):** Captura de foto a la nota de surtido de proveedores para actualizar el inventario y precios de costo automáticamente.

### C. Módulo de Cuentas Pendientes (Fiados)

* **Listado de Clientes Frecuentes:** Panel rápido con nombres/fotos de maestros y alumnos autorizados.

* **Registro de Abonos y Liquidación:** Módulo para abonar o saldar deudas parciales/totales con un clic.

* **Alertas de Cobro:** Indicadores visuales de antigüedad de deuda por cliente.

### D. Dashboard Analítico y Cierre de Jornada

* **Gráficas Visuales:** Representación de ingresos diarios, semanales y comparativa entre cobro en efectivo vs. fiado.

* **Resumen en Lenguaje Natural (Cerrar Día):** Un botón que genera un reporte ejecutivo redactado por la IA indicando ganancias totales, producto más vendido y alertas de inventario bajo.

## 4. Arquitectura Técnica y Stack Tecnológico

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                   FRONTEND MÓVIL (EXPO GO)                      │
 │  • React Native + Expo Managed Workflow                         │
 │  • React Navigation (Navegación fluida)                         │
 │  • Expo AV / Audio (Grabación para Push-to-Talk)                │
 │  • Victory Native / Chart.js (Gráficas interactivas)            │
 └──────────────────────────────┬──────────────────────────────────┘
                                │ API REST / Async Storage
 ┌──────────────────────────────┴──────────────────────────────────┐
 │                  BACKEND & BASE DE DATOS                        │
 │  • SQLite / WatermelonDB (Persistencia de datos en el dispositivo)│
 │  • Node.js / FastAPI (Servidor intermedio ligero o Servless)    │
 └──────────────────────────────┬──────────────────────────────────┘
                                │ Consumo por Tokens
 ┌──────────────────────────────┴──────────────────────────────────┐
 │                      SERVICIOS DE IA                            │
 │  • Whisper API / Speech-to-Text (Transcripción de audio)        │
 │  • Claude / GPT API (Procesamiento de lenguaje natural y texto) │
 └─────────────────────────────────────────────────────────────────┘

```

### Tecnologías Seleccionadas

* **Entorno Móvil:** React Native con **Expo Go** (facilita pruebas en tiempo real en dispositivo físico).

* **Gestión de Estado y Almacenamiento Local:** AsyncStorage / SQLite local para garantizar que la app funcione incluso si hay fallas de conexión a internet durante el receso.

* **Desarrollo Asistido:** Uso de **Claude Code** para acelerar la escritura de componentes, esquemas de bases de datos e integración de hooks de audio.

## 5. Cronograma de Desarrollo y Fases de Ejecución

### Fase 1: Estructuración y Base de Datos (Semana 1)

* \[ \] Configuración del proyecto en Expo con TypeScript.

* \[ \] Diseño del esquema de base de datos local (Productos, Insumos, Ventas, Clientes, Deudas).

* \[ \] Creación de la pantalla de catálogo e inventario básico.

### Fase 2: Interfaz Táctil de Venta y Fiados (Semana 2)

* \[ \] Desarrollo del "Modo Receso" con botones de alta visibilidad.

* \[ \] Implementación de la lógica de descuento de inventario (incluyendo insumos de lonches).

* \[ \] Creación del módulo de gestión de fiados y clientes.

### Fase 3: Integración de IA y Audio (Semana 3)

* \[ \] Configuración del módulo de grabación de audio `Push-to-Talk` con Expo AV.

* \[ \] Integración con la API de transcripción y procesamiento de texto para interpretar comandas por voz.

* \[ \] Implementación de la rutina de "Cerrar Día" con resumen en lenguaje natural.

### Fase 4: Dashboard, Pruebas en Campo y Pulido (Semana 4)

* \[ \] Integración de la pantalla de analítica y gráficas de ventas.

* \[ \] Despliegue en el dispositivo de la usuaria mediante Expo Go para pruebas reales durante la jornada escolar.

* \[ \] Ajustes finales de interfaz basados en la retroalimentación de la usuaria.

## 6. Métricas de Éxito del Proyecto

1. **Tiempo de Registro:** Reducir el tiempo de captura por venta a menos de 1 segundo en el modo táctil y menos de 3 segundos mediante comando de voz.

2. **Adopción de la Usuaria:** Eliminación total del cuaderno de papel para el conteo de caja y registro de fiados.

3. **Calidad de Portafolio:** Código modular, documentado, con arquitectura desacoplada y caso de estudio listo para presentación técnica.