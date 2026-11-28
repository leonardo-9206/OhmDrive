import { useLayoutEffect, useMemo, useRef } from 'react'
import katex from 'katex'

/** Escala mínima para fórmulas en bloque: por debajo de esto se deja el scroll horizontal. */
const MIN_DISPLAY_SCALE = 0.6

/**
 * Fórmula en bloque que se encoge sola para caber en el ancho disponible (US-18).
 * En celulares de 360px varias fórmulas ($$...$$) medían más que su tarjeta y había que
 * deslizarlas de lado. KaTeX mide todo en `em`, así que basta con bajar el font-size
 * del contenedor interno. Si aun al 60 % no cabe, se conserva el overflow-x-auto.
 */
function FitDisplayMath({ html, className }) {
  const boxRef = useRef(null)
  useFitToWidth(boxRef, html, (box) => box.clientWidth)
  return (
    <div ref={boxRef} className={className}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

/**
 * Fórmula en línea ($...$) que no puede partirse: si es más ancha que el párrafo
 * (ej. "I = Δq/Δt = 72 C / 12 s = 6.0 A = 6000 mA" en 360px), se encoge igual que las de bloque.
 */
function FitInlineMath({ html, className }) {
  const boxRef = useRef(null)
  useFitToWidth(boxRef, html, blockAncestorWidth)
  return (
    <span ref={boxRef} className={className}>
      <span className="inline-block" dangerouslySetInnerHTML={{ __html: html }} />
    </span>
  )
}

/** Ancho de contenido del primer ancestro que no sea inline (los <span> inline miden 0). */
function blockAncestorWidth(box) {
  let el = box.parentElement
  while (el && getComputedStyle(el).display === 'inline') el = el.parentElement
  if (!el) return 0
  const cs = getComputedStyle(el)
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
}

function useFitToWidth(boxRef, html, getAvailable) {
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return undefined
    const fit = () => {
      const inner = box.firstElementChild
      if (!inner) return
      inner.style.fontSize = ''
      const natural = Math.max(inner.scrollWidth, inner.offsetWidth)
      const available = getAvailable(box)
      if (available > 0 && natural > available) {
        inner.style.fontSize = `${Math.max(MIN_DISPLAY_SCALE, (available - 2) / natural)}em`
      }
    }
    fit()
    let target = box.parentElement ?? box
    while (target.parentElement && getComputedStyle(target).display === 'inline') target = target.parentElement
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    observer?.observe(target)
    document.fonts?.ready?.then(fit).catch(() => {})
    return () => observer?.disconnect()
    // getAvailable es estable por componente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html])
}

/**
 * Renders a single LaTeX expression safely with KaTeX.
 *
 * @param {string} latex
 * @param {boolean} displayMode
 * @returns {string}
 */
function renderKatexHtml(latex, displayMode) {
  return katex.renderToString(latex, {
    displayMode,
    throwOnError: false,
    strict: false,
    output: 'htmlAndMathml',
  })
}

/**
 * Splits mixed prose containing $$...$$ or $...$ math delimiters into typed segments.
 *
 * @param {string} input
 * @returns {Array<{ type: 'text'|'inline'|'display', value: string }>}
 */
function parseMixedFormulaText(input) {
  const tokenRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = tokenRegex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: input.slice(lastIndex, match.index) })
    }
    const token = match[0]
    if (token.startsWith('$$')) {
      parts.push({ type: 'display', value: token.slice(2, -2).trim() })
    } else {
      parts.push({ type: 'inline', value: token.slice(1, -1).trim() })
    }
    lastIndex = tokenRegex.lastIndex
  }

  if (lastIndex < input.length) {
    parts.push({ type: 'text', value: input.slice(lastIndex) })
  }

  return parts
}

/**
 * Renders electrical engineering formulas and equations using KaTeX.
 * Supports either a pure LaTeX `formula` prop or mixed prose with `$...$` / `$$...$$` via `text`.
 *
 * @param {Object} props
 * @param {string} [props.formula] - Pure LaTeX string to render directly
 * @param {string} [props.text] - Mixed prose + $...$ / $$...$$ LaTeX string
 * @param {boolean} [props.block=false] - Render pure formula in display (block) mode
 * @param {boolean} [props.displayMode=false] - Alias for block
 * @param {string} [props.className='']
 * @param {import('react').ReactNode} [props.children] - Pure LaTeX string fallback if formula/text omitted
 */
export default function FormulaText({
  formula,
  text,
  block = false,
  displayMode = false,
  className = '',
  children,
}) {
  const isDisplay = block || displayMode

  const pureFormulaHtml = useMemo(() => {
    const raw = formula ?? (typeof children === 'string' && !text ? children : null)
    if (raw == null) return null
    return renderKatexHtml(String(raw), isDisplay)
  }, [formula, children, text, isDisplay])

  const mixedSegments = useMemo(() => {
    if (pureFormulaHtml !== null || !text) return null
    return parseMixedFormulaText(String(text))
  }, [pureFormulaHtml, text])

  if (pureFormulaHtml !== null) {
    if (isDisplay) {
      return (
        <FitDisplayMath
          html={pureFormulaHtml}
          className={['text-slate-100 my-2 overflow-x-auto py-1 text-center', className].filter(Boolean).join(' ')}
        />
      )
    }
    return (
      <span
        className={['text-slate-100 inline-block align-middle', className].filter(Boolean).join(' ')}
        dangerouslySetInnerHTML={{ __html: pureFormulaHtml }}
      />
    )
  }

  if (mixedSegments) {
    return (
      <span className={['leading-relaxed text-slate-100', className].filter(Boolean).join(' ')}>
        {mixedSegments.map((seg, idx) => {
          if (seg.type === 'text') {
            return <span key={idx}>{seg.value}</span>
          }
          const html = renderKatexHtml(seg.value, seg.type === 'display')
          if (seg.type === 'display') {
            return <FitDisplayMath key={idx} html={html} className="my-2 overflow-x-auto py-1 text-center" />
          }
          return (
            <FitInlineMath key={idx} html={html} className="mx-0.5 inline-block max-w-full align-middle" />
          )
        })}
      </span>
    )
  }

  return <span className={className}>{children}</span>
}
