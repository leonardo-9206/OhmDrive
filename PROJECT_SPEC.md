# ⚡ OhmDrive — Master Project Specification (Quick Context & Official Rubric Rules)

## 📌 Resumen del Proyecto
**OhmDrive** es una aplicación web interactiva (funcional en navegador de computadora y teléfono móvil, además de instalable como PWA) de aprendizaje gamificado estilo *Duolingo* enfocada en **Circuitos Eléctricos en Corriente Directa (CD)**, diseñada con una estética **Cyberpunk / Neo-PCB** y un **Motor Interactivo de Circuitos en SVG**.

- **Título Oficial de Rúbrica:** *"Página Web para circuitos eléctricos en corriente directa"*
- **Materia:** Circuitos Eléctricos (Clave: 31358 | 5° Semestre - UAA, ISC 5-A)
- **Fecha Oficial de Entrega:** Miércoles 9 de diciembre a las 10:00 hrs. (Aula de clase y Aula Virtual)
- **Mascota / Guía IA:** **Kilo (`K-1L0`)** — Zorro/droide cibernético con orejas de puntas de multímetro cuyo visor reacciona al estado eléctrico del circuito.

---

## 📋 Checklist Obligatorio de la Rúbrica Oficial del Profesor (33 Puntos)

Todo agente de IA y miembro del equipo **DEBE garantizar el cumplimiento estricto** de estos 11 puntos evaluables:

1. **Producto final (2 pts):** Página web funcional que pueda abrirse y utilizarse directamente en cualquier navegador (PC y móvil).
2. **Acceso del estudiante — Estructura Exacta (3 pts):** Incluir exactamente **3 Unidades y 6 Niveles** (2 niveles por unidad):
   * **Unidad 1: Fundamentos y Potencia en CD (*Distrito Ohm*)**
     * **Nivel 1:** Voltaje, corriente y resistencia.
     * **Nivel 2:** Ley de Ohm y potencia.
   * **Unidad 2: Redes Resistivas y Divisores (*Red de Distribución*)**
     * **Nivel 3:** Serie y paralelo.
     * **Nivel 4:** Divisores de voltaje y corriente.
   * **Unidad 3: Leyes de Kirchhoff y Análisis Sistemático (*Núcleo Kirchhoff*)**
     * **Nivel 5:** Leyes de Kirchhoff (LCK y LVK).
     * **Nivel 6:** Introducción a nodos y mallas.
3. **Contenido previo de cada nivel (3 pts):** Antes de comenzar los ejercicios de cada nivel, presentar obligatoriamente **3 bloques diferenciados**:
   * **(a) Explicación breve del tema**
   * **(b) Fórmulas necesarias** (renderizadas con KaTeX)
   * **(c) Un ejemplo resuelto paso a paso** (con circuito SVG, datos, sustitución y resultado).
4. **Cantidad de ejercicios (4 pts):** Incluir exactamente **4 ejercicios por nivel (24 ejercicios en total)**, con problemas prediseñados y respuestas previamente verificadas.
5. **Tipos de ejercicios (3 pts):** En cada nivel combinar ejercicios de:
   * **Opción múltiple** (`"multiple_choice"` / `"component_slot"`)
   * **Respuesta numérica con selector/entrada de unidad** (`"numeric_input"`)
   * **Diagramas de circuitos SVG** (`<CircuitCanvas />`) en todos los ejercicios que lo requieran para entender el problema.
6. **Validación de respuestas (3 pts):** Comprobar cada respuesta. En cálculos de **respuesta numérica**, **contemplar unidades** (ej. aceptar `20 mA` o `0.02 A`, verificando tanto el prefijo/unidad como el valor) y aplicar un **margen razonable de tolerancia por redondeo** ($\pm 2\%$ a $\pm 3\%$).
7. **Retroalimentación con Pista y Segundo Intento (3 pts):**
   * Indicar claramente si la respuesta es correcta o incorrecta.
   * **Ante un error:** Mostrar una **pista técnica (`hint_markdown`)** y **permitir otro intento** en el mismo ejercicio.
   * **Al finalizar el ejercicio** (al acertar o tras agotar el intento extra): Mostrar el **procedimiento correcto paso a paso (`explanation_markdown`)**.
8. **Resultados por nivel (3 pts):** Al concluir cada nivel (los 4 ejercicios), mostrar una pantalla de resumen con:
   * **Número de aciertos** (ej. `3 / 4`)
   * **Número de errores** (ej. `1`)
   * **Puntuación obtenida** (ej. `85 pts / Watts XP`)
9. **Progreso y navegación libre (6 pts — Criterios 9 y 10 de la rúbrica):**
   * **Libertad de elección:** Permitir al usuario (y al profesor al evaluar) **elegir libremente cualquiera de las 3 unidades y cualquiera de los 6 niveles** desde el inicio (sin bloquear el acceso con candados cerrados).
   * **Estado claro:** Distinguir visualmente los niveles **Completados** (`✓ COMPLETADO` en verde neón) de los **Pendientes** (`⏳ PENDIENTE` en cian/ámbar).
   * **Persistencia en el navegador:** Guardar y consultar el avance automáticamente al cerrar y volver a entrar desde el mismo navegador (`localStorage`).
10. **Presentación y funcionamiento Responsivo (3 pts):** Navegación clara, texto legible y diseño adaptativo que funcione y luzca impecable tanto en **computadora de escritorio (layout amplio)** como en **teléfono móvil**.

---

## 🎮 Los 3 Modos de Juego de OhmDrive

1. **📖 Modo Principal: Unidades y Niveles ("Campaña CD: 3 Unidades / 6 Niveles"):**
   * Cubre al 100% la rúbrica oficial del profesor: selector libre de las **3 Unidades y 6 Niveles**, pantalla previa con *Explicación Breve + Fórmulas + Ejemplo Resuelto*, seguida de los **4 ejercicios verificados por nivel (24 en total)** con diagramas SVG, opción múltiple y respuesta numérica con unidades, sistema de pistas con reintento y resumen final de aciertos, errores y puntuación.
2. **🎯 Modo Práctica ("Arcade / Repaso por Tema"):**
   * Permite filtrar ejercicios de los 6 niveles por tema o en mix aleatorio para practicar libremente o en modo contrarreloj.
3. **🔬 Modo Libre ("CyberLab Sandbox"):**
   * Laboratorio interactivo de corriente directa donde el estudiante o profesor mueve sliders ($V$, $R_1$, $R_2$) en tiempo real sobre plantillas de *Ley de Ohm*, *Serie/Paralelo* y *Divisores de Voltaje/Corriente*, viendo el flujo de corriente animada y los cálculos en vivo.

---

## 👥 Roles Oficiales del Equipo (5 Integrantes)

- **Erich Leonardo Castruita Rodríguez (ID: 340804):** Lead Developer, System Architect & Core Lesson Engine
  * Liderazgo técnico, revisión de PRs, máquina de estados de `LessonRunnerPage.jsx` (Teoría + Fórmulas + Ejemplo Resuelto -> Flujo de Pista y Reintento -> Input Numérico con Unidades -> Resumen de Aciertos/Errores/Puntuación) y despliegue Web/PWA.
- **Rodrigo Vázquez Zúñiga (ID: 549632):** Database Architect (Supabase 3NF), LocalStorage Persistence & Progress Tracker
  * Persistencia garantizada en `localStorage` (`useGameStore.js`) para distinguir niveles *Completados vs Pendientes*, historial de aciertos/errores/puntuación por nivel, esquema PostgreSQL 3NF en Supabase y Leaderboard.
- **Carlos Antonio Villaseñor García (ID: 441641):** Lead Frontend, Responsive Desktop/Mobile UI & Mascot Animator
  * Diseño responsivo *Desktop + Mobile* (Cyber-PCB Dark Mode), vista de selección libre de las **3 Unidades y 6 Niveles** (`StoryMapPage.jsx`) con indicadores *Completado / Pendiente*, animaciones de **Kilo (`K-1L0`)** y Códice de Fórmulas.
- **Joao (JoaoSanBills):** Electrical Math Engine & 24 Verified Exercises Author
  * Diseño y verificación matemática de las **3 Unidades, 6 Niveles (Explicación, Fórmulas, Ejemplo Resuelto) y los 24 Ejercicios oficiales** (combinando opción múltiple y respuesta numérica con pistas y procedimientos paso a paso), más `circuitSolver.js` y `CyberLabPage.jsx`.
- **Josh:** Interactive SVG Circuit Renderer & Diagram Engineer
  * Motor `<CircuitCanvas />` en SVG para renderizar los diagramas de circuitos de los **24 ejercicios y los 6 ejemplos resueltos** (circuitos de 1 lazo, serie, paralelo, mixtos, divisores, LCK/LVK y mallas/nodos de 2 lazos).

---

## 📂 Estructura Oficial del Proyecto

```text
OhmDrive/
├── src/
│   ├── components/
│   │   ├── ui/                 # NeonButton, FuseBar, FormulaText, NumericUnitInput
│   │   ├── layout/             # AppShell (Responsive Desktop & Mobile), BottomNav
│   │   ├── mascot/             # <KiloMascot state="idle|thinking|happy|shock|overheat" />
│   │   └── circuit-svg/        # Motor SVG (<CircuitCanvas />, <Resistor />, <VoltageSource />, <CurrentSource />, <Wire />)
│   ├── data/
│   │   ├── sectors/            # unit1.json (Niveles 1-2), unit2.json (Niveles 3-4), unit3.json (Niveles 5-6)
│   │   └── codex-cards.json    # Tarjetas de fórmulas de los 6 niveles
│   ├── engine/
│   │   ├── circuitSolver.js    # Solucionador en CD + conversor de unidades (V, mV, A, mA, Ω, kΩ, W, mW)
│   │   └── challengeValidator.js # Validador de opción múltiple y respuesta numérica con unidades y tolerancia
│   ├── store/
│   │   └── useGameStore.js     # Persistencia en localStorage (estado Completado/Pendiente, aciertos, errores, puntos)
│   ├── services/
│   │   └── supabaseClient.js   # Sincronización en nube con fallback 100% offline
│   └── pages/                  # StoryMapPage (3 Unidades/6 Niveles), LessonRunnerPage, PracticePage, CyberLabPage, CodexPage, LeaderboardPage
├── supabase/
│   └── schema.sql              # Esquema relacional en 3NF
├── Docs nosotros/              # Documentación SSOT para el equipo y sus agentes
└── PROJECT_SPEC.md             # Este archivo (Fuente central de verdad)
```
