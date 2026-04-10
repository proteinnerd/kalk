'use client'
import { useState, useEffect } from 'react'
import { Category, ICONS } from '@/lib/types'
import s from './Sheet.module.css'

interface Props {
  open: boolean
  type: 'income' | 'expense'
  editId?: string
  cats: Category[]
  onSave: (name: string, amount: number, icon: string, type: 'income' | 'expense', editId?: string) => void
  onClose: () => void
}

export default function Sheet({ open, type, editId, cats, onSave, onClose }: Props) {
  const [name, setName]       = useState('')
  const [amount, setAmount]   = useState('')
  const [icon, setIcon]       = useState('💼')
  const [ctype, setCtype]     = useState<'income' | 'expense'>(type)

  useEffect(() => {
    if (!open) return
    setCtype(type)
    if (editId) {
      const cat = cats.find(c => c.id === editId)
      if (cat) { setName(cat.name); setAmount(String(cat.amount)); setIcon(cat.icon); setCtype(cat.type) }
    } else {
      setName(''); setAmount(''); setIcon(type === 'income' ? '💼' : '🛒')
    }
  }, [open, editId, type])

  const save = () => {
    if (!name.trim()) { alert('Skriv inn navn'); return }
    onSave(name.trim(), parseFloat(amount) || 0, icon, ctype, editId)
  }

  return (
    <>
      <div className={`${s.overlay} ${open ? s.open : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose() }} />
      <div className={`${s.sheet} ${open ? s.sheetOpen : ''}`}>
        <div className={s.handle} />
        <div className={s.title}>{editId ? 'Rediger' : 'Ny post'}</div>

        <div className={s.typeRow}>
          <button className={`${s.tt} ${s.ttInc} ${ctype === 'income' ? s.ttOn : ''}`} onClick={() => setCtype('income')}>↑ Inntekt</button>
          <button className={`${s.tt} ${s.ttExp} ${ctype === 'expense' ? s.ttOn : ''}`} onClick={() => setCtype('expense')}>↓ Utgift</button>
        </div>

        <div className={s.field}>
          <label className={s.label}>Navn</label>
          <input className={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="f.eks. Lønn, Strøm…" autoComplete="off" />
        </div>

        <div className={s.field}>
          <label className={s.label}>Fast beløp / mnd (kr)</label>
          <input className={s.input} type="number" inputMode="numeric" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
        </div>

        <div className={s.field}>
          <label className={s.label}>Ikon</label>
          <div className={s.icons}>
            {ICONS.map(ic => (
              <button key={ic} className={`${s.ic} ${ic === icon ? s.icOn : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
            ))}
          </div>
        </div>

        <button className={s.saveBtn} onClick={save}>Lagre</button>
      </div>
    </>
  )
}
