'use client'
import { Category, Override, InvSettings, yearTotals, fkr, fv, monthsToGoal, defaultInv } from '@/lib/types'
import s from './InvView.module.css'

interface Props {
  inv: InvSettings | null
  cats: Category[]
  ov: Override
  year: number
  onUpdate: (s: InvSettings) => void
}

export default function InvView({ inv, cats, ov, year, onUpdate }: Props) {
  const yt = yearTotals(cats, ov, year)
  const settings = inv || defaultInv(yt.bal)
  const sug = Math.max(Math.round(yt.bal / 12), 0)

  const stockAmt = settings.monthly * settings.split / 100
  const saveAmt  = settings.monthly * (100 - settings.split) / 100
  const blend    = settings.stockRet * settings.split / 100 + settings.saveRet * (100 - settings.split) / 100

  const stockFV = fv(stockAmt, settings.stockRet, settings.years)
  const saveFV  = fv(saveAmt,  settings.saveRet,  settings.years)
  const total   = stockFV + saveFV
  const paid    = settings.monthly * 12 * settings.years
  const profit  = total - paid

  const m2g = monthsToGoal(settings.monthly, blend, settings.goal)
  const y2g = m2g ? Math.floor(m2g / 12) : null
  const mo2g = m2g ? Math.round(m2g % 12) : null
  const goalYr = m2g ? new Date().getFullYear() + Math.ceil(m2g / 12) : null

  const update = (patch: Partial<InvSettings>) => onUpdate({ ...settings, ...patch })

  return (
    <>
      {sug > 0 && sug !== settings.monthly && (
        <div className={s.sugBar}>
          <span className={s.sugTxt}>Årsplanen viser kr {sug.toLocaleString('nb-NO')} / mnd i overskudd</span>
          <button className={s.sugBtn} onClick={() => update({ monthly: sug })}>Bruk</button>
        </div>
      )}

      <div className={s.card}>
        <div className={s.cardHead}>⚙️ Innstillinger</div>
        <div className={s.field}>
          <div className={s.fieldLbl}>Månedlig sparing</div>
          <div className={s.fieldRow}>
            <input className={s.inp} type="number" inputMode="numeric" value={settings.monthly}
              onChange={e => update({ monthly: parseFloat(e.target.value) || 0 })} />
            <span className={s.unit}>kr</span>
          </div>
        </div>
        <div className={s.field}>
          <div className={s.fieldLbl}>Aksjer {settings.split}% · Sparekonto {100 - settings.split}%</div>
          <input type="range" className={s.slider} min="0" max="100" value={settings.split}
            onChange={e => update({ split: parseFloat(e.target.value) })} />
          <div className={s.splitRow}>
            <span>kr {Math.round(stockAmt).toLocaleString('nb-NO')} aksjer</span>
            <span>kr {Math.round(saveAmt).toLocaleString('nb-NO')} sparekonto</span>
          </div>
        </div>
        <div className={s.field}>
          <div className={s.fieldLbl}>Aksje-avkastning (historisk ~7–10%)</div>
          <div className={s.fieldRow}>
            <input className={s.inp} type="number" inputMode="decimal" step="0.1" value={settings.stockRet}
              onChange={e => update({ stockRet: parseFloat(e.target.value) || 0 })} />
            <span className={s.unit}>% / år</span>
          </div>
        </div>
        <div className={s.field}>
          <div className={s.fieldLbl}>Sparekonto-rente</div>
          <div className={s.fieldRow}>
            <input className={s.inp} type="number" inputMode="decimal" step="0.1" value={settings.saveRet}
              onChange={e => update({ saveRet: parseFloat(e.target.value) || 0 })} />
            <span className={s.unit}>% / år</span>
          </div>
        </div>
        <div className={s.field}>
          <div className={s.fieldLbl}>Antall år</div>
          <div className={s.fieldRow}>
            <input className={s.inp} type="number" inputMode="numeric" min="1" max="50" value={settings.years}
              onChange={e => update({ years: parseFloat(e.target.value) || 10 })} />
            <span className={s.unit}>år</span>
          </div>
        </div>
      </div>

      <div className={s.resultBox}>
        <div className={s.resultMain}>kr {Math.round(total).toLocaleString('nb-NO')}</div>
        <div className={s.resultSub}>Total verdi etter {settings.years} år</div>
        <div className={s.resultLine}><span>Innbetalt</span><span>kr {Math.round(paid).toLocaleString('nb-NO')}</span></div>
        <div className={s.resultLine}><span>Avkastning</span><span style={{color:'var(--green)'}}>+kr {Math.round(profit).toLocaleString('nb-NO')}</span></div>
      </div>

      <div className={s.card}>
        <div className={s.cardHead}>🎯 Når når jeg målet?</div>
        <div className={s.field}>
          <div className={s.fieldLbl}>Målbeløp</div>
          <div className={s.fieldRow}>
            <input className={s.inp} type="number" inputMode="numeric" value={settings.goal}
              onChange={e => update({ goal: parseFloat(e.target.value) || 0 })} />
            <span className={s.unit}>kr</span>
          </div>
        </div>
        {m2g && m2g > 0 && m2g < 99999 ? (
          <div className={s.goalBox}>
            <div className={s.goalMain}>{y2g} år{mo2g ? ` ${mo2g} mnd` : ''}</div>
            <div className={s.goalSub}>Du når målet rundt <strong>{goalYr}</strong> ved kr {settings.monthly.toLocaleString('nb-NO')} / mnd</div>
          </div>
        ) : (
          <div className={s.goalBoxEmpty}>Sett et beløp og mål for å beregne</div>
        )}
      </div>
    </>
  )
}
