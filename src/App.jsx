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

  // Fetch recent periods
  const fetchPeriods = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/periods`)
      const data = await res.json()
      setPeriods(data.periods || [])
      if (!selected && (data.periods || []).length) setSelected(data.periods[0])
    } catch (e) {
      setError('Unable to load periods')
    }
  }

  const fetchTotals = async (pid) => {
    if (!pid) return
    try {
      const res = await fetch(`${BACKEND}/api/periods/${pid}/totals`)
      const data = await res.json()
      setTotals(data.totals)
      setError('')
    } catch (e) {
      setError('Unable to load totals')
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
          <div className="text-gray-500">Loading totals…</div>
        )}
      </main>
    </div>
  )
}
