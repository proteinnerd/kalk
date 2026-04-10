'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Category, Override, InvSettings,
  loadCats, saveCats, loadOv, saveOv, loadInv, saveInv,
  monthTotals, yearTotals, accumUntil, getVal,
  fkr, fkrS, colorCls,
  SEED_CATS, MO, MO3, ICONS,
  fv, monthsToGoal, defaultInv,
} from '@/lib/types'
import styles from './App.module.css'
import AnnualView from './AnnualView'
import CatsView from './CatsView'
import InvView from './InvView'
import Sheet from './Sheet'

type Tab = 'plan' | 'cats' | 'inv'

export default function App() {
  const [tab, setTab]     = useState<Tab>('plan')
  const [year, setYear]   = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [cats, setCatsState]   = useState<Category[]>([])
  const [ov, setOvState]       = useState<Override>({})
  const [inv, setInvState]     = useState<InvSettings | null>(null)
  const [sheet, setSheet]      = useState<{ open: boolean; type: 'income' | 'expense'; editId?: string }>({ open: false, type: 'income' })
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadCats()
    if (stored.length === 0) {
      saveCats(SEED_CATS)
      setCatsState(SEED_CATS)
      // Seed feriepenger override for June
      const ferieId = SEED_CATS[1].id
      const initOv: Override = { [`${ferieId}|${new Date().getFullYear()}|5`]: 38000 }
      saveOv(initOv)
      setOvState(initOv)
    } else {
      setCatsState(stored)
      setOvState(loadOv())
    }
    setInvState(loadInv())
    setHydrated(true)
  }, [])

  const updateCats = useCallback((newCats: Category[]) => {
    saveCats(newCats)
    setCatsState(newCats)
  }, [])

  const updateOv = useCallback((newOv: Override) => {
    saveOv(newOv)
    setOvState(newOv)
  }, [])

  const updateInv = useCallback((s: InvSettings) => {
    saveInv(s)
    setInvState(s)
  }, [])

  const openSheet = (type: 'income' | 'expense', editId?: string) => {
    setSheet({ open: true, type, editId })
  }
  const closeSheet = () => setSheet(s => ({ ...s, open: false }))

  const saveCategory = (name: string, amount: number, icon: string, type: 'income' | 'expense', editId?: string) => {
    if (editId) {
      updateCats(cats.map(c => c.id === editId ? { ...c, name, amount, icon, type } : c))
    } else {
      updateCats([...cats, { id: crypto.randomUUID(), name, amount, icon, type }])
    }
    closeSheet()
  }

  const deleteCategory = (id: string) => {
    if (!confirm('Slette denne kategorien?')) return
    updateCats(cats.filter(c => c.id !== id))
    const newOv = { ...ov }
    Object.keys(newOv).filter(k => k.startsWith(id + '|')).forEach(k => delete newOv[k])
    updateOv(newOv)
  }

  const setOverride = (catId: string, value: number | null) => {
    const key = `${catId}|${year}|${month}`
    const newOv = { ...ov }
    if (value === null) delete newOv[key]
    else newOv[key] = value
    updateOv(newOv)
  }

  const changeMonth = (d: number) => {
    let m = month + d, y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  if (!hydrated) return null

  const t   = monthTotals(cats, ov, year, month)
  const yt  = yearTotals(cats, ov, year)
  const acc = accumUntil(cats, ov, year, month)

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>💰 Budsjett</div>
        <div className={styles.tabs}>
          {(['plan','cats','inv'] as Tab[]).map(t2 => (
            <button
              key={t2}
              className={`${styles.tab} ${tab === t2 ? styles.tabOn : ''}`}
              onClick={() => setTab(t2)}
            >
              {t2 === 'plan' ? 'Årsplan' : t2 === 'cats' ? 'Kategorier' : 'Investering'}
            </button>
          ))}
        </div>
      </header>

      {/* Page content */}
      <main className={styles.page}>
        {tab === 'plan' && (
          <AnnualView
            cats={cats} ov={ov}
            year={year} month={month}
            t={t} yt={yt} acc={acc}
            onChangeYear={d => setYear(y => y + d)}
            onChangeMonth={changeMonth}
            onSelectMonth={setMonth}
            onSetOverride={setOverride}
            onOpenSheet={openSheet}
            onDelete={deleteCategory}
          />
        )}
        {tab === 'cats' && (
          <CatsView
            cats={cats}
            onUpdateCat={(id, amount) => {
              updateCats(cats.map(c => c.id === id ? { ...c, amount } : c))
            }}
            onOpenSheet={openSheet}
            onDelete={deleteCategory}
          />
        )}
        {tab === 'inv' && (
          <InvView
            inv={inv} cats={cats} ov={ov} year={year}
            onUpdate={updateInv}
          />
        )}
      </main>

      {/* Add/edit sheet */}
      <Sheet
        open={sheet.open}
        type={sheet.type}
        editId={sheet.editId}
        cats={cats}
        onSave={saveCategory}
        onClose={closeSheet}
      />
    </div>
  )
}
