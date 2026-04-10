// lib/types.ts
export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  icon: string
  type: CategoryType
  amount: number
}

export interface Override {
  [key: string]: number // "catId|year|month" -> amount
}

export interface InvSettings {
  monthly: number
  split: number      // % stocks
  stockRet: number   // % annual
  saveRet: number    // % annual
  years: number
  goal: number
}

export interface MonthTotals {
  inc: number
  exp: number
  bal: number
}

// ── Storage keys ──────────────────────────────
const CATS_KEY = 'b_cats'
const OV_KEY   = 'b_ov'
const INV_KEY  = 'b_inv'

export function loadCats(): Category[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(CATS_KEY) || '[]') } catch { return [] }
}
export function saveCats(cats: Category[]) {
  localStorage.setItem(CATS_KEY, JSON.stringify(cats))
}

export function loadOv(): Override {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(OV_KEY) || '{}') } catch { return {} }
}
export function saveOv(ov: Override) {
  localStorage.setItem(OV_KEY, JSON.stringify(ov))
}

export function loadInv(): InvSettings | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(INV_KEY) || 'null') } catch { return null }
}
export function saveInv(s: InvSettings) {
  localStorage.setItem(INV_KEY, JSON.stringify(s))
}

// ── Calc ──────────────────────────────────────
export function getVal(cats: Category[], ov: Override, id: string, year: number, month: number) {
  const key = `${id}|${year}|${month}`
  if (ov[key] !== undefined) return { v: ov[key], manual: true }
  const cat = cats.find(c => c.id === id)
  return { v: cat ? cat.amount : 0, manual: false }
}

export function monthTotals(cats: Category[], ov: Override, year: number, month: number): MonthTotals {
  let inc = 0, exp = 0
  cats.forEach(c => {
    const v = getVal(cats, ov, c.id, year, month).v
    if (c.type === 'income') inc += v
    else exp += v
  })
  return { inc, exp, bal: inc - exp }
}

export function yearTotals(cats: Category[], ov: Override, year: number): MonthTotals {
  let inc = 0, exp = 0
  for (let m = 0; m < 12; m++) {
    const t = monthTotals(cats, ov, year, m)
    inc += t.inc; exp += t.exp
  }
  return { inc, exp, bal: inc - exp }
}

export function accumUntil(cats: Category[], ov: Override, year: number, month: number): number {
  let acc = 0
  for (let m = 0; m <= month; m++) acc += monthTotals(cats, ov, year, m).bal
  return acc
}

// ── Format ────────────────────────────────────
export function fkr(n: number): string {
  if (n === 0) return '—'
  return 'kr ' + Math.abs(n).toLocaleString('nb-NO', { maximumFractionDigits: 0 })
}
export function fkrS(n: number): string {
  if (n === 0) return '—'
  return (n > 0 ? '+' : '−') + fkr(n)
}
export function colorCls(n: number): string {
  return n > 0 ? 'green' : n < 0 ? 'red' : ''
}

// ── Seed ─────────────────────────────────────
export const SEED_CATS: Category[] = [
  { id: crypto.randomUUID(), type: 'income',  name: 'Lønn',       icon: '💼', amount: 45000 },
  { id: crypto.randomUUID(), type: 'income',  name: 'Feriepenger',icon: '✈️', amount: 0     },
  { id: crypto.randomUUID(), type: 'expense', name: 'Huslån',     icon: '🏠', amount: 10000 },
  { id: crypto.randomUUID(), type: 'expense', name: 'Mat',        icon: '🛒', amount: 4000  },
  { id: crypto.randomUUID(), type: 'expense', name: 'Strøm',      icon: '⚡', amount: 1500  },
  { id: crypto.randomUUID(), type: 'expense', name: 'Transport',  icon: '🚗', amount: 800   },
  { id: crypto.randomUUID(), type: 'expense', name: 'Abonnement', icon: '📺', amount: 600   },
]

export const MO  = ['Januar','Februar','Mars','April','Mai','Juni','Juli','August','September','Oktober','November','Desember']
export const MO3 = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des']
export const ICONS = ['💼','💰','📈','🎁','🏠','🏡','⚡','🛒','🚗','🚌','📺','🎬','🏋️','❤️','💊','📱','✈️','🎓','🐶','🍕','☕','🛍️','🔧','🎸','🧾','📦','💳','🏦']

// ── Investment calc ───────────────────────────
export function fv(monthly: number, annPct: number, years: number): number {
  const r = annPct / 100 / 12
  const n = years * 12
  if (r === 0) return monthly * n
  return monthly * (Math.pow(1 + r, n) - 1) / r
}

export function monthsToGoal(monthly: number, annPct: number, goal: number): number | null {
  if (monthly <= 0) return null
  const r = annPct / 100 / 12
  if (r === 0) return goal / monthly
  const m = Math.log(1 + (goal * r) / monthly) / Math.log(1 + r)
  return isFinite(m) ? m : null
}

export function defaultInv(yearBal: number): InvSettings {
  return {
    monthly: Math.max(Math.round(yearBal / 12), 0),
    split: 70,
    stockRet: 8,
    saveRet: 3.5,
    years: 10,
    goal: 1000000,
  }
}
