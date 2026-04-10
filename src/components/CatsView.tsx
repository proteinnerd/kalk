'use client'
import { useState, useRef } from 'react'
import { Category, fkr } from '@/lib/types'
import s from './CatsView.module.css'

interface Props {
  cats: Category[]
  onUpdateCat: (id: string, amount: number) => void
  onOpenSheet: (type: 'income' | 'expense', editId?: string) => void
  onDelete: (id: string) => void
}

function AmountEdit({ cat, onSave }: { cat: Category; onSave: (n: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  if (editing) return (
    <input
      ref={ref} autoFocus
      className={s.inlineInput}
      type="number" inputMode="numeric" min="0"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { const n = parseFloat(draft); if (!isNaN(n) && n >= 0) onSave(n); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') ref.current?.blur(); if (e.key === 'Escape') setEditing(false) }}
    />
  )

  return (
    <button
      className={`${s.amountBtn} ${cat.type === 'income' ? s.green : s.red}`}
      onClick={() => { setDraft(cat.amount > 0 ? String(cat.amount) : ''); setEditing(true) }}
    >
      {cat.amount > 0 ? fkr(cat.amount) : '—'}
    </button>
  )
}

export default function CatsView({ cats, onUpdateCat, onOpenSheet, onDelete }: Props) {
  const inc = cats.filter(c => c.type === 'income')
  const exp = cats.filter(c => c.type === 'expense')
  const incSum = inc.reduce((s, c) => s + c.amount, 0)
  const expSum = exp.reduce((s, c) => s + c.amount, 0)

  const renderGroup = (list: Category[], type: 'income' | 'expense') => (
    <div className={s.section}>
      <div className={s.head}>
        <span>{type === 'income' ? '↑ Inntekter' : '↓ Utgifter'}</span>
        <span className={`${s.total} ${type === 'income' ? s.green : s.red}`}>
          {fkr(type === 'income' ? incSum : expSum)} / mnd
        </span>
      </div>
      {list.length === 0 && <div className={s.empty}>Ingen {type === 'income' ? 'inntekter' : 'utgifter'} ennå</div>}
      {list.map(c => (
        <div key={c.id} className={s.row}>
          <span className={s.icon}>{c.icon}</span>
          <div className={s.info}>
            <div className={s.name}>{c.name}</div>
            <div className={s.hint}>Gjelder alle måneder</div>
          </div>
          <AmountEdit cat={c} onSave={n => onUpdateCat(c.id, n)} />
          <button className={s.del} onClick={() => onDelete(c.id)}>×</button>
        </div>
      ))}
      <button className={s.addRow} onClick={() => onOpenSheet(type)}>
        <span>＋</span> Legg til {type === 'income' ? 'inntekt' : 'utgift'}
      </button>
    </div>
  )

  return (
    <>
      <p className={s.hint}>Klikk på et beløp for å endre fast månedlig beløp — gjelder automatisk alle 12 måneder.</p>
      {renderGroup(inc, 'income')}
      {renderGroup(exp, 'expense')}
    </>
  )
}
