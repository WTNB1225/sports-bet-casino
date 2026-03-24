import { Link } from 'react-router'
import { useAuthContext } from './contexts/AuthContext'

const featuredGames = [
  { name: 'Blackjack Elite', payout: '97.8%', players: '1,284' },
  { name: 'Roulette Royale', payout: '96.4%', players: '943' },
  { name: 'Lucky Slots 7', payout: '95.2%', players: '2,601' },
]

const liveTable = [
  { game: 'Baccarat', stakes: '$10 - $2,000', trend: '+18%' },
  { game: 'Poker', stakes: '$5 - $500', trend: '+9%' },
  { game: 'Blackjack', stakes: '$20 - $3,000', trend: '+22%' },
]

function App() {
  const { user, loading } = useAuthContext()

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-amber-100/70 bg-[linear-gradient(135deg,_rgba(17,24,39,0.97)_0%,_rgba(32,22,8,0.98)_100%)] p-6 shadow-[0_28px_90px_rgba(17,24,39,0.34)] md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,_rgba(251,191,36,0.22),_transparent_34%),radial-gradient(circle_at_82%_84%,_rgba(56,189,248,0.16),_transparent_36%)]" />

        <div className="relative space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="space-y-5 text-center lg:text-left">
              <p className="inline-flex rounded-full border border-amber-200/40 bg-amber-100/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                Legal Casino Lounge
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-amber-50 md:text-6xl">
                Play smart.
                <span className="block text-sky-200">Bet with confidence.</span>
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300 lg:mx-0">
                ライブテーブル、スポーツベット、限定キャンペーンを1つの画面で管理。
                スピード感のあるプレイ体験をホームからすぐ始められます。
              </p>

              <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to={user ? '/sports' : '/signin'}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-amber-300 px-6 text-sm font-semibold text-slate-900 transition hover:bg-amber-200"
                >
                  {user ? 'スポーツベットへ' : 'ログインして開始'}
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-amber-100/50 bg-transparent px-6 text-sm font-semibold text-amber-50 transition hover:bg-amber-100/10"
                >
                  無料アカウント作成
                </Link>
              </div>

              <p className="text-sm text-slate-300/90">
                {loading ? 'Loading...' : user ? `Welcome back, ${user.email}` : 'Guest mode'}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100/20 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">Live Pot</p>
              <p className="mt-2 text-4xl font-semibold text-amber-200">$2,483,920</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-950/50 p-3">
                  <p className="text-xs text-slate-400">Players</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">8,219</p>
                </div>
                <div className="rounded-xl bg-slate-950/50 p-3">
                  <p className="text-xs text-slate-400">Tables</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">174</p>
                </div>
                <div className="rounded-xl bg-slate-950/50 p-3">
                  <p className="text-xs text-slate-400">RTP Avg</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">96.8%</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-amber-100/20 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">Featured Games</p>
              <div className="mt-4 space-y-3">
                {featuredGames.map((game) => (
                  <div key={game.name} className="flex items-center justify-between rounded-xl bg-slate-950/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{game.name}</p>
                      <p className="text-xs text-slate-400">Players {game.players}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-300">RTP {game.payout}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100/20 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">Live Tables</p>
              <div className="mt-4 space-y-3">
                {liveTable.map((table) => (
                  <div key={table.game} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl bg-slate-950/50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-100">{table.game}</p>
                    <p className="text-xs text-slate-300">{table.stakes}</p>
                    <p className="text-xs font-semibold text-emerald-300">{table.trend}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default App
