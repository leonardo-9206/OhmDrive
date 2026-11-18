import { useMemo } from 'react'
import katex from 'katex'

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
    const Tag = isDisplay ? 'div' : 'span'
    return (
      <Tag
        className={[
          'text-slate-100',
          isDisplay ? 'my-2 overflow-x-auto py-1 text-center' : 'inline-block align-middle',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
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
            return (
              <div
                key={idx}
                className="my-2 overflow-x-auto py-1 text-center"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )
          }
          return (
            <span
              key={idx}
              className="mx-0.5 inline-block align-middle"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        })}
      </span>
    )
  }

  return <span className={className}>{children}</span>
}
