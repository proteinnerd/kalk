'use client'
import { useState, useRef } from 'react'
import { Category, Override, MonthTotals, getVal, monthTotals, fkr, fkrS, colorCls, MO, MO3 } from '@/lib/types'
import s from './AnnualView.module.css'

interface Props {
  cats: Category[]
  ov: Override
  year: number
  month: number
  t: MonthTotals
  yt: MonthTotals
  acc: number
  onChangeYear: (d: number) => void
  onChangeMonth: (d: number) => void
  onSelectMonth: (m: number) => void
  onSetOverride: (catId: string, value: number | null) => void
  onOpenSheet: (type: 'income' | 'expense', editId?: string) => void
  onDelete: (id: string) => void
}

function AmountCell({ value, colorClass, onCommit }: { value: number; colorClass: string; onCommit: (v: number | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(value > 0 ? String(value) : '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 30)
  }

  const commit = () => {
    const n = parseFloat(draft)
    if (draft.trim() === '') onCommit(null)
    else if (!isNaN(n) && n >= 0) onCommit(n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={s.inlineInput}
        type="number"
        inputMode="numeric"
        min="0"
        value={draft}
        autoFocus
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      />
    )
  }

  return (
    <button className={`${s.amountBtn} ${colorClass}`} onClick={startEdit}>
      {value > 0 ? fkr(value) : '—'}
    </button>
  )
}

export default function AnnualView({ cats, ov, year, month, t, yt, acc, onChangeYear, onChangeMonth, onSelectMonth, onSetOverride, onOpenSheet, onDelete }: Props) {
  const inc = cats.filter(c => c.type === 'income')
  const exp = cats.filter(c => c.type === 'expense')

  return (
    <>
      {/* Year nav */}
      <div className={s.yearRow}>
        <div className={s.yearNav}>
          <button className={s.yrBtn} onClick={() => onChangeYear(-1)}>‹</button>
          <span className={s.yrLabel}>{year}</span>
          <button className={s.yrBtn} onClick={() => onChangeYear(1)}>›</button>
        </div>
        <span className={`${s.yrResult} ${colorCls(yt.bal)}`}>{fkrS(yt.bal)} totalt</span>
      </div>

      {/* Month chips */}
      <div className={s.monthRow}>
        <button className={s.arrowBtn} onClick={() => onChangeMonth(-1)}>‹</button>
        <div className={s.chips} id="chip-list">
          {MO3.map((n, i) => {
            const mt2 = monthTotals(cats, ov, year, i)
            return (
              <button
                key={i}
                className={`${s.chip} ${i === month ? s.chipActive : ''}`}
                style={i !== month ? { color: mt2.bal > 0 ? 'var(--green)' : mt2.bal < 0 ? 'var(--red)' : 'var(--muted)' } : undefined}
                onClick={() => onSelectMonth(i)}
              >
                {n}
              </button>
            )
          })}
        </div>
        <button className={s.arrowBtn} onClick={() => onChangeMonth(1)}>›</button>
      </div>

      {/* Pills */}
      <div className={s.pills}>
        <div className={s.pill}>
          <div className={s.pillLbl}>Inntekt</div>
          <div className={`${s.pillVal} green`}>{fkr(t.inc)}</div>
        </div>
        <div className={s.pill}>
          <div className={s.pillLbl}>Utgifter</div>
          <div className={`${s.pillVal} red`}>{fkr(t.exp)}</div>
        </div>
        <div className={s.pill}>
          <div className={s.pillLbl}>Resultat</div>
          <div className={`${s.pillVal} ${colorCls(t.bal)}`}>{fkrS(t.bal)}</div>
        </div>
        <div className={`${s.pill} ${acc >= 0 ? s.pillGreen : s.pillRed}`}>
          <div className={s.pillLbl}>Akkumulert</div>
          <div className={`${s.pillVal} ${colorCls(acc)}`}>{fkrS(acc)}</div>
        </div>
      </div>

      {/* Income section */}
      <div className={s.section}>
        <div className={s.sectionHead}>
          <span>↑ Inntekter</span>
          <span className={`${s.sectionTotal} green`}>{fkr(t.inc)}</span>
        </div>
        {inc.length === 0 && <div className={s.emptyRow}>Ingen inntekter — legg til under</div>}
        {inc.map(c => {
          const r = getVal(cats, ov, c.id, year, month)
          return (
            <div key={c.id} className={s.row}>
              <span className={s.rowIcon}>{c.icon}</span>
              <div className={s.rowName}>
                {c.name}
                {r.manual && <small style={{ color: 'var(--blue)', display: 'block', fontSize: 11 }}>● justert</small>}
              </div>
              <AmountCell
                value={r.v}
                colorClass="green"
                onCommit={v => onSetOverride(c.id, v)}
              />
              <button className={s.delBtn} onClick={() => onDelete(c.id)}>×</button>
            </div>
          )
        })}
        <button className={s.addRow} onClick={() => onOpenSheet('income')}>
          <span>＋</span> Legg til inntekt
        </button>
      </div>

      {/* Expense section */}
      <div className={s.section}>
        <div className={s.sectionHead}>
          <span>↓ Utgifter</span>
          <span className={`${s.sectionTotal} red`}>{fkr(t.exp)}</span>
        </div>
        {exp.length === 0 && <div className={s.emptyRow}>Ingen utgifter — legg til under</div>}
        {exp.map(c => {
          const r = getVal(cats, ov, c.id, year, month)
          return (
            <div key={c.id} className={s.row}>
              <span className={s.rowIcon}>{c.icon}</span>
              <div className={s.rowName}>
                {c.name}
                {r.manual && <small style={{ color: 'var(--blue)', display: 'block', fontSize: 11 }}>● justert</small>}
              </div>
              <AmountCell
                value={r.v}
                colorClass="red"
                onCommit={v => onSetOverride(c.id, v)}
              />
              <button className={s.delBtn} onClick={() => onDelete(c.id)}>×</button>
            </div>
          )
        })}
        <button className={s.addRow} onClick={() => onOpenSheet('expense')}>
          <span>＋</span> Legg til utgift
        </button>
      </div>

      {/* Year table */}
      <div className={s.yrTable}>
        <div className={s.yrTableHead}>
          <span>Måned</span>
          <span>Inntekt</span>
          <span>Utgift</span>
          <span>Resultat</span>
        </div>
        {MO.map((name, i) => {
          const mt2 = monthTotals(cats, ov, year, i)
          return (
            <div key={i} className={`${s.yrRow} ${i === month ? s.yrRowCur : ''}`} onClick={() => onSelectMonth(i)}>
              <div className={s.yrMonth}>{MO3[i]}</div>
              <div className={`${s.yrNum} green`}>{mt2.inc ? fkr(mt2.inc) : '—'}</div>
              <div className={`${s.yrNum} red`}>{mt2.exp ? fkr(mt2.exp) : '—'}</div>
              <div className={`${s.yrNum} ${colorCls(mt2.bal)}`}>{mt2.inc || mt2.exp ? fkrS(mt2.bal) : '—'}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
