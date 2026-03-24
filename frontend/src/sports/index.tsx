
const topBets = [
  { sport: 'Football', league: 'Premier League', match: 'Liverpool vs Arsenal', odds: '1.8 / 2.1', volume: '$450K' },
  { sport: 'Basketball', league: 'NBA', match: 'Lakers vs Celtics', odds: '1.95 / 1.9', volume: '$280K' },
  { sport: 'Tennis', league: 'ATP', match: 'Djokovic vs Alcaraz', odds: '2.1 / 1.75', volume: '$120K' },
  { sport: 'American Football', league: 'NFL', match: 'Chiefs vs Texans', odds: '1.85 / 2.0', volume: '$310K' },
]

const liveEvents = [
  { name: 'Soccer - European Leagues', active: '48 matches' },
  { name: 'Basketball - NBA 2nd Half', active: '6 games' },
  { name: 'Tennis - French Open', active: '12 matches' },
  { name: 'American Football - MNF', active: '1 game' },
]

export default function Sports() {
    return (
        <div className="w-full space-y-6">
          <div className="rounded-2xl border border-amber-100/20 bg-[linear-gradient(135deg,_rgba(17,24,39,0.97)_0%,_rgba(32,22,8,0.98)_100%)] p-6 shadow-lg">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">Sports Betting Hub</p>
              <h1 className="text-3xl font-semibold text-amber-50 md:text-4xl">Live Events & Odds</h1>
              <p className="text-sm text-slate-300">Global sports markets with real-time odds</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-amber-100/20 bg-[linear-gradient(135deg,_rgba(17,24,39,0.97)_0%,_rgba(32,22,8,0.98)_100%)] p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80 mb-4">Top Bets</p>
              <div className="space-y-3">
                {topBets.map((bet, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center rounded-xl bg-slate-950/50 p-4 hover:bg-slate-950/80 transition-colors cursor-pointer">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-amber-200">{bet.sport}</p>
                        <span className="text-xs text-slate-500">{bet.league}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-100 truncate">{bet.match}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Odds</p>
                      <p className="text-sm font-semibold text-emerald-300">{bet.odds}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Volume</p>
                      <p className="text-sm font-semibold text-sky-300">{bet.volume}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100/20 bg-[linear-gradient(135deg,_rgba(17,24,39,0.97)_0%,_rgba(32,22,8,0.98)_100%)] p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80 mb-4">Live Now</p>
              <div className="space-y-2">
                {liveEvents.map((event, i) => (
                  <a
                    key={i}
                    href="#"
                    className="block rounded-lg bg-slate-950/50 p-3 hover:bg-amber-300/10 transition-colors border border-slate-700/50 hover:border-amber-300/30"
                  >
                    <p className="text-sm font-semibold text-slate-100 mb-1">{event.name}</p>
                    <p className="text-xs text-emerald-300 font-semibold">🔴 {event.active}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
    )
}