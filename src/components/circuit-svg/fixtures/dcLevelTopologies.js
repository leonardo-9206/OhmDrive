/**
 * OhmDrive — Circuitos de referencia para los 6 niveles de la rúbrica (US-08R).
 *
 * Sirven para dos cosas:
 *  1. Probar visualmente <CircuitCanvas /> en /dev/circuits.
 *  2. Ser plantillas copiables para unit1/2/3.json (Joao): coordenadas que ya se ven
 *     bien en 360×240 y el uso de `current_amps` y `annotations`.
 *
 * Todos los valores son físicamente consistentes (ver dcLevelTopologies.test.js:
 * verifica LCK en cada nodo y la Ley de Ohm en cada resistor).
 */

const n = (id, x, y, label, extra = {}) => ({ id, x, y, ...(label ? { label } : {}), ...extra })
const R = (id, from, to, value, current_amps, label = id) => ({ id, type: 'resistor', from, to, label, value, unit: 'Ω', current_amps })
const VS = (id, from, to, value, current_amps, label = id) => ({ id, type: 'voltage_source_dc', from, to, label, value, unit: 'V', current_amps })
const IS = (id, from, to, value, label = id) => ({ id, type: 'current_source_dc', from, to, label, value, unit: 'A', current_amps: value })
const W = (id, from, to, current_amps) => ({ id, type: 'wire', from, to, current_amps })
const arrow = (target, label, extra = {}) => ({ type: 'current_arrow', target, label, ...extra })

export const DC_LEVEL_TOPOLOGIES = [
  {
    id: 'N1-lazo-simple',
    level: 1,
    title: 'Nivel 1 · Lazo simple (V, I, R)',
    config: {
      template: 'single_loop_dc',
      is_energized_initially: true,
      current_speed_amps: 0.003,
      nodes: [n('N1', 60, 60, '+9V'), n('N2', 280, 60, 'A'), n('N3', 280, 180, 'B'), n('N4', 60, 180, 'GND', { is_ground: true })],
      components: [VS('VS1', 'N4', 'N1', 9, 0.003, 'Vs'), R('R1', 'N1', 'N2', 3000, 0.003), W('W1', 'N2', 'N3', 0.003), W('W2', 'N3', 'N4', 0.003)],
      annotations: [arrow('W1', 'I = ?')],
    },
  },
  {
    id: 'N2-ohm-potencia',
    level: 2,
    title: 'Nivel 2 · Ley de Ohm y potencia',
    config: {
      template: 'single_loop_dc',
      is_energized_initially: true,
      current_speed_amps: 0.03,
      nodes: [n('N1', 60, 60, '+12V'), n('N2', 280, 60, 'A'), n('N3', 280, 180, 'B'), n('N4', 60, 180, 'GND', { is_ground: true })],
      components: [
        VS('VS1', 'N4', 'N1', 12, 0.03, 'Vs'),
        W('W1', 'N1', 'N2', 0.03),
        R('RL', 'N2', 'N3', 400, 0.03, 'R_L'),
        W('W2', 'N3', 'N4', 0.03),
      ],
      annotations: [arrow('W1', 'I = 30 mA')],
    },
  },
  {
    id: 'N3-serie',
    level: 3,
    title: 'Nivel 3 · Resistencias en serie',
    config: {
      template: 'series_dc',
      is_energized_initially: true,
      current_speed_amps: 0.02,
      nodes: [n('N1', 60, 60, '+12V'), n('N2', 280, 60, 'A'), n('N3', 280, 180, 'B'), n('N4', 60, 180, 'GND', { is_ground: true })],
      components: [
        VS('VS1', 'N4', 'N1', 12, 0.02, 'Vs'),
        R('R1', 'N1', 'N2', 100, 0.02),
        R('R2', 'N2', 'N3', 200, 0.02),
        R('R3', 'N3', 'N4', 300, 0.02),
      ],
      annotations: [arrow('R1', 'I')],
    },
  },
  {
    id: 'N3-paralelo',
    level: 3,
    title: 'Nivel 3 · Paralelo de 3 ramas',
    config: {
      template: 'parallel_dc',
      is_energized_initially: true,
      current_speed_amps: 0.6,
      nodes: [
        n('T0', 50, 50, '+12V'), n('T1', 150, 50), n('T2', 240, 50), n('T3', 320, 50),
        n('B0', 50, 190, 'GND', { is_ground: true }), n('B1', 150, 190), n('B2', 240, 190), n('B3', 320, 190),
      ],
      components: [
        VS('VS1', 'B0', 'T0', 12, 0.6, 'Vs'),
        W('WT1', 'T0', 'T1', 0.6), W('WT2', 'T1', 'T2', 0.4), W('WT3', 'T2', 'T3', 0.3),
        R('R1', 'T1', 'B1', 60, 0.2), R('R2', 'T2', 'B2', 120, 0.1), R('R3', 'T3', 'B3', 40, 0.3),
        W('WB3', 'B3', 'B2', 0.3), W('WB2', 'B2', 'B1', 0.4), W('WB1', 'B1', 'B0', 0.6),
      ],
      annotations: [arrow('WT1', 'I_T'), arrow('R1', 'I₁'), arrow('R2', 'I₂'), arrow('R3', 'I₃')],
    },
  },
  {
    id: 'N3-mixto',
    level: 3,
    title: 'Nivel 3 · Arreglo mixto (serie + paralelo)',
    config: {
      template: 'mixed_dc',
      is_energized_initially: true,
      current_speed_amps: 1.5,
      nodes: [
        n('T0', 50, 50, '+12V'), n('T1', 180, 50, 'A'), n('T2', 310, 50),
        n('B0', 50, 190, 'GND', { is_ground: true }), n('B1', 180, 190), n('B2', 310, 190),
      ],
      components: [
        VS('VS1', 'B0', 'T0', 12, 1.5, 'Vs'),
        R('R1', 'T0', 'T1', 4, 1.5),
        W('WT', 'T1', 'T2', 1.0),
        R('R2', 'T1', 'B1', 12, 0.5),
        R('R3', 'T2', 'B2', 6, 1.0),
        W('WB2', 'B2', 'B1', 1.0), W('WB1', 'B1', 'B0', 1.5),
      ],
      annotations: [arrow('R1', 'I_T'), arrow('R2', 'I₂'), arrow('R3', 'I₃')],
    },
  },
  {
    id: 'N4-divisor-voltaje',
    level: 4,
    title: 'Nivel 4 · Divisor de voltaje',
    config: {
      template: 'voltage_divider_dc',
      is_energized_initially: true,
      current_speed_amps: 0.002,
      nodes: [
        n('T0', 60, 50, '+10V'), n('T1', 240, 50),
        n('M', 240, 120), n('OUT', 330, 120, 'Salida'),
        n('B0', 60, 190, 'GND', { is_ground: true }), n('B1', 240, 190),
      ],
      components: [
        VS('VS1', 'B0', 'T0', 10, 0.002, 'Vs'),
        W('WT', 'T0', 'T1', 0.002),
        R('R1', 'T1', 'M', 2000, 0.002),
        R('R2', 'M', 'B1', 3000, 0.002),
        W('WOUT', 'M', 'OUT', 0),
        W('WB', 'B1', 'B0', 0.002),
      ],
      annotations: [{ type: 'node_voltage', node: 'M', label: 'V_out = ?' }, arrow('WT', 'I')],
    },
  },
  {
    id: 'N4-divisor-corriente',
    level: 4,
    title: 'Nivel 4 · Divisor de corriente',
    config: {
      template: 'current_divider_dc',
      is_energized_initially: true,
      current_speed_amps: 0.03,
      nodes: [
        n('T0', 60, 50), n('T1', 180, 50, 'A'), n('T2', 300, 50),
        n('B0', 60, 190, 'GND', { is_ground: true }), n('B1', 180, 190), n('B2', 300, 190),
      ],
      components: [
        IS('IS1', 'B0', 'T0', 0.03, 'Is'),
        W('WT1', 'T0', 'T1', 0.03), W('WT2', 'T1', 'T2', 0.01),
        R('R1', 'T1', 'B1', 1000, 0.02), R('R2', 'T2', 'B2', 2000, 0.01),
        W('WB2', 'B2', 'B1', 0.01), W('WB1', 'B1', 'B0', 0.03),
      ],
      annotations: [arrow('R1', 'I₁ = ?'), arrow('R2', 'I₂')],
    },
  },
  {
    id: 'N5-lvk',
    level: 5,
    title: 'Nivel 5 · LVK con dos fuentes',
    config: {
      template: 'kvl_loop_dc',
      is_energized_initially: true,
      current_speed_amps: 0.02,
      nodes: [n('N1', 60, 60, 'A'), n('N2', 280, 60, 'B'), n('N3', 280, 180, 'C'), n('N4', 60, 180, 'GND', { is_ground: true })],
      components: [
        VS('VS1', 'N4', 'N1', 12, 0.02, 'Vs1'),
        R('R1', 'N1', 'N2', 100, 0.02),
        // Vs2 se opone: su "+" está arriba, pero la corriente la atraviesa hacia abajo
        VS('VS2', 'N3', 'N2', 4, -0.02, 'Vs2'),
        R('R2', 'N3', 'N4', 300, 0.02),
      ],
      annotations: [arrow('R1', 'I = ?'), { type: 'mesh_current', label: 'LVK', nodes: ['N1', 'N2', 'N3', 'N4'] }],
    },
  },
  {
    id: 'N5-lck',
    level: 5,
    title: 'Nivel 5 · LCK en un nodo',
    config: {
      template: 'kcl_node_dc',
      is_energized_initially: true,
      current_speed_amps: 4,
      nodes: [
        n('T0', 40, 50), n('T1', 130, 50, 'Nodo A'), n('T2', 230, 50), n('T3', 320, 50),
        n('B0', 40, 190, 'GND', { is_ground: true }), n('B1', 130, 190), n('B2', 230, 190), n('B3', 320, 190),
      ],
      components: [
        IS('IS1', 'B0', 'T0', 4, 'Is1'),
        W('WT1', 'T0', 'T1', 4),
        R('R1', 'T1', 'B1', 4, 2.5),
        W('WT2', 'T1', 'T2', 1.5),
        R('R2', 'T2', 'B2', 4, 2.5),
        W('WT3', 'T2', 'T3', -1),
        IS('IS2', 'B3', 'T3', 1, 'Is2'),
        W('WB3', 'B2', 'B3', 1), W('WB2', 'B2', 'B1', 1.5), W('WB1', 'B1', 'B0', 4),
      ],
      annotations: [arrow('WT1', '4 A'), arrow('R1', 'I₁'), arrow('R2', 'I_x = ?'), arrow('WT3', '1 A')],
    },
  },
  {
    id: 'N6-nodos',
    level: 6,
    title: 'Nivel 6 · Análisis de nodos (V_A)',
    config: {
      template: 'two_mesh_dc',
      is_energized_initially: true,
      current_speed_amps: 2.25,
      nodes: [
        n('TL', 40, 50), n('A', 180, 50), n('TR', 320, 50),
        n('BL', 40, 190), n('BM', 180, 190, 'GND', { is_ground: true }), n('BR', 320, 190),
      ],
      components: [
        VS('VS1', 'BL', 'TL', 12, 2.25, 'Vs1'),
        R('R1', 'TL', 'A', 2, 2.25),
        R('R3', 'A', 'BM', 4, 1.875),
        R('R2', 'A', 'TR', 4, 0.375),
        VS('VS2', 'BR', 'TR', 6, -0.375, 'Vs2'),
        W('WBR', 'BR', 'BM', 0.375),
        W('WBL', 'BM', 'BL', 2.25),
      ],
      annotations: [
        { type: 'node_voltage', node: 'A', label: 'V_A = ?' },
        arrow('R1', 'I₁'),
        arrow('R2', 'I₂'),
        arrow('R3', 'I₃'),
      ],
    },
  },
  {
    id: 'N6-mallas',
    level: 6,
    title: 'Nivel 6 · Análisis de mallas',
    config: {
      template: 'two_mesh_dc',
      is_energized_initially: true,
      current_speed_amps: 2.25,
      nodes: [
        n('TL', 40, 50), n('A', 180, 50, 'A'), n('TR', 320, 50),
        n('BL', 40, 190), n('BM', 180, 190, 'GND', { is_ground: true }), n('BR', 320, 190),
      ],
      components: [
        VS('VS1', 'BL', 'TL', 12, 2.25, 'Vs1'),
        R('R1', 'TL', 'A', 2, 2.25),
        R('R3', 'A', 'BM', 4, 1.875),
        R('R2', 'A', 'TR', 4, 0.375),
        VS('VS2', 'BR', 'TR', 6, -0.375, 'Vs2'),
        W('WBR', 'BR', 'BM', 0.375),
        W('WBL', 'BM', 'BL', 2.25),
      ],
      annotations: [
        { type: 'mesh_current', label: 'I_a', nodes: ['TL', 'A', 'BM', 'BL'] },
        { type: 'mesh_current', label: 'I_b', nodes: ['A', 'TR', 'BR', 'BM'] },
      ],
    },
  },
]
