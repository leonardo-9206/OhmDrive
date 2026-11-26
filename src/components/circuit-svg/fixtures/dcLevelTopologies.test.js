/**
 * Verificación física de los circuitos de referencia de US-08R.
 * Ejecutar: node src/components/circuit-svg/fixtures/dcLevelTopologies.test.js
 *
 * 1. LCK: en cada nodo, la suma de corrientes que entran = la suma de las que salen
 *    (cada componente lleva su corriente de `from` hacia `to`; negativa = al revés).
 * 2. LVK + Ohm: se calculan los voltajes de nodo recorriendo el circuito desde tierra
 *    (fuente: V_to − V_from = value; resistor: V_from − V_to = I·R; cable: igual voltaje)
 *    y se verifica que no haya contradicciones en ningún lazo.
 */
import { DC_LEVEL_TOPOLOGIES } from './dcLevelTopologies.js'

const EPS = 1e-9
let failures = 0

for (const { id, config } of DC_LEVEL_TOPOLOGIES) {
  const errors = []

  // 1) LCK
  const balance = Object.fromEntries(config.nodes.map((nd) => [nd.id, 0]))
  for (const c of config.components) {
    const i = Number(c.current_amps ?? 0)
    balance[c.from] -= i
    balance[c.to] += i
  }
  for (const [node, sum] of Object.entries(balance)) {
    if (Math.abs(sum) > EPS) errors.push(`LCK en ${node}: suma = ${sum}`)
  }

  // 2) voltajes de nodo por propagación (las fuentes de corriente no fijan diferencia de voltaje)
  const ground = config.nodes.find((nd) => nd.is_ground)
  const V = { [ground.id]: 0 }
  const constraints = config.components
    .filter((c) => c.type !== 'current_source_dc')
    .map((c) => {
      if (c.type === 'voltage_source_dc') return { c, drop: -c.value } // V_from − V_to = −Vs
      if (c.type === 'resistor') return { c, drop: c.current_amps * c.value }
      return { c, drop: 0 }
    })
  let changed = true
  while (changed) {
    changed = false
    for (const { c, drop } of constraints) {
      const hasF = c.from in V
      const hasT = c.to in V
      if (hasF && !hasT) { V[c.to] = V[c.from] - drop; changed = true }
      else if (!hasF && hasT) { V[c.from] = V[c.to] + drop; changed = true }
      else if (hasF && hasT && Math.abs(V[c.from] - V[c.to] - drop) > 1e-6) {
        errors.push(`LVK/Ohm en ${c.id}: V(${c.from}) − V(${c.to}) = ${(V[c.from] - V[c.to]).toFixed(4)} ≠ ${drop.toFixed(4)}`)
      }
    }
  }

  // 3) fuentes de corriente: el voltaje en sus terminales debe ser consistente con las ramas en paralelo
  //    (ya cubierto por LCK + Ohm en las resistencias).

  if (errors.length) {
    failures++
    console.log(`✗ ${id}\n   ${errors.join('\n   ')}`)
  } else {
    const shown = Object.entries(V).map(([k, v]) => `${k}=${+v.toFixed(3)}V`).join(' ')
    console.log(`✓ ${id}  ${shown}`)
  }
}

if (failures) {
  console.error(`\n${failures} circuito(s) con errores físicos`)
  process.exit(1)
}
console.log(`\nTodos los ${DC_LEVEL_TOPOLOGIES.length} circuitos de referencia cumplen LCK, LVK y Ley de Ohm.`)
