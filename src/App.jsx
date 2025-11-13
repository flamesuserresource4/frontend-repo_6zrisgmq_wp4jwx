import { useEffect, useMemo, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

function formatINR(n) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `₹${n}`
  }
}

function PeriodSelector({ periods, value, onChange }) {
  if (!periods.length) return null
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select value={value} onChange={e => onChange(e.target.value)} className="border rounded px-3 py-2">
        {periods.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  )
}

function StatCard({ title, value, accent }) {
  return (
    <div className={`rounded-lg p-4 bg-white shadow border-l-4 ${accent}`}>
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}

export default function App() {
  const [periods, setPeriods] = useState([])
  const [selected, setSelected] = useState('')
  const [totals, setTotals] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchPeriods = async () => {
    if (!BACKEND) {
      setError('Backend URL not configured (VITE_BACKEND_URL)')
      return
    }
    try {
      const res = await fetch(`${BACKEND}/api/periods`)
      if (!res.ok) throw new Error('Failed to load periods')
      const data = await res.json()
      setPeriods(data.periods || [])
      if (!selected && (data.periods || []).length) setSelected(data.periods[0])
      if (!(data.periods || []).length) setTotals(null)
    } catch (e) {
      setError('Unable to load periods')
    }
  }

  const fetchTotals = async (pid) => {
    if (!pid || !BACKEND) return
    try {
      const res = await fetch(`${BACKEND}/api/periods/${pid}/totals`)
      if (!res.ok) throw new Error('Failed to load totals')
      const data = await res.json()
      setTotals(data.totals)
      setError('')
    } catch (e) {
      setError('Unable to load totals')
    }
  }

  const seedDemo = async () => {
    if (!BACKEND) {
      alert('Backend URL not configured (VITE_BACKEND_URL)')
      return
    }
    setBusy(true)
    try {
      const pid = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
      const bets = []
      // Big/Small
      bets.push({ period_id: pid, bet_type: 'big_small', selection: 'big', amount: 15000 })
      bets.push({ period_id: pid, bet_type: 'big_small', selection: 'small', amount: 9000 })
      // Colors
      bets.push({ period_id: pid, bet_type: 'color', selection: 'red', amount: 7000 })
      bets.push({ period_id: pid, bet_type: 'color', selection: 'green', amount: 3000 })
      bets.push({ period_id: pid, bet_type: 'color', selection: 'violet', amount: 1200 })
      // Numbers 0-9
      for (let i = 0; i < 10; i++) {
        bets.push({ period_id: pid, bet_type: 'number', selection: String(i), amount: Math.floor(Math.random()*4000)+500 })
      }
      await Promise.all(
        bets.map(b => fetch(`${BACKEND}/api/bets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(b)
        }))
      )
      await fetchPeriods()
      setSelected(pid)
      await fetchTotals(pid)
    } catch (e) {
      alert('Failed to seed demo data')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    fetchPeriods()
    const i = setInterval(fetchPeriods, 5000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    fetchTotals(selected)
    const i = setInterval(() => fetchTotals(selected), 2000)
    return () => clearInterval(i)
  }, [selected])

  const numberTotals = useMemo(() => {
    if (!totals) return []
    return Array.from({ length: 10 }, (_, i) => ({ key: String(i), amount: totals.number?.[String(i)] || 0 }))
  }, [totals])

  const emptyState = (
    <div className="bg-white border rounded-lg p-6 text-center text-gray-600">
      <div className="text-lg font-medium mb-2">No data yet</div>
      <p className="mb-4">Start sending bets to the backend or load demo data to see the dashboard in action.</p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button onClick={seedDemo} disabled={busy} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Seeding…' : 'Load demo data'}
        </button>
        <a
          target="_blank" rel="noreferrer"
          href="https://httpie.io/run?method=POST&url=BACKEND%2Fapi%2Fbets&body=%7B%0A%20%20%22period_id%22%3A%20%222025-11-13-1201%22%2C%0A%20%20%22bet_type%22%3A%20%22big_small%22%2C%0A%20%20%22selection%22%3A%20%22big%22%2C%0A%20%20%22amount%22%3A%205000%0A%7D&headers=Content-Type%3A%20application%2Fjson"
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >API example</a>
      </div>
      {BACKEND ? (
        <p className="mt-3 text-xs text-gray-500">Backend: {BACKEND}</p>
      ) : (
        <p className="mt-3 text-xs text-red-600">VITE_BACKEND_URL is not set. Create .env with VITE_BACKEND_URL and reload.</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 py-4 border-b bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Wingo Admin Panel</h1>
          <div className="text-sm text-gray-500">Live totals auto-refresh</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <PeriodSelector periods={periods} value={selected} onChange={setSelected} />
          <div className="flex items-center gap-2">
            <button onClick={seedDemo} disabled={busy} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">{busy ? 'Seeding…' : 'Load demo data'}</button>
            <button onClick={() => { fetchPeriods(); fetchTotals(selected); }} className="px-3 py-2 border rounded hover:bg-gray-50">Refresh</button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
        )}

        {totals ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h2 className="font-semibold">Big / Small</h2>
              <StatCard title="Big" value={formatINR(totals.big_small?.big || 0)} accent="border-blue-500" />
              <StatCard title="Small" value={formatINR(totals.big_small?.small || 0)} accent="border-indigo-500" />
              <StatCard title="Total" value={formatINR(totals.big_small?.total || 0)} accent="border-slate-400" />
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold">Numbers</h2>
              <div className="grid grid-cols-5 gap-2">
                {numberTotals.map((n) => (
                  <div key={n.key} className="bg-white rounded shadow p-3 text-center">
                    <div className="text-sm text-gray-500">{n.key}</div>
                    <div className="font-semibold">{formatINR(n.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold">Colours</h2>
              <StatCard title="Red" value={formatINR(totals.color?.red || 0)} accent="border-red-500" />
              <StatCard title="Green" value={formatINR(totals.color?.green || 0)} accent="border-green-500" />
              <StatCard title="Violet" value={formatINR(totals.color?.violet || 0)} accent="border-violet-500" />
            </div>
          </div>
        ) : (
          !periods.length ? emptyState : <div className="text-gray-500">Loading totals…</div>
        )}
      </main>
    </div>
  )
}
