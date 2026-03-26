import { useParams } from "react-router";
import { useMemo, useEffect, useState } from "react";
import { hc } from "hono/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { AppType } from "@/../../backend/src/index";
type EventDetails = {
  markets: {
    event: {
      leagueId: string;
      id: string;
      name: string;
      startTime: string;
    };
    odds: {
      id: string;
      name: string;
      value: string;
      marketId: string;
    }[];
    id: string;
    eventId: string;
    marketType: string;
  }[];
}

type BetSelection = {
  oddId: string;
  eventName: string;
  marketType: string;
  oddName: string;
  oddValue: string;
};

function orderOddsforDisplay(odds: EventDetails["markets"][number]["odds"]): EventDetails["markets"][number]["odds"] {
  if (odds.length !== 3) {
    return odds;
  }
  const draw = odds.find((odd) => /draw|引き分け/i.test(odd.name));
  if (!draw) {
    return odds;
  }
  const others = odds.filter((odd) => odd.id !== draw.id);
  if (others.length !== 2) {
    return odds;
  }
  return [others[0], draw, others[1]];
}

export default function League() {
  const { sportId, leagueId } = useParams();
  const [eventDetails, setEventDetails] = useState<EventDetails>();
  const [displayBet, setDisplayBet] = useState(false);
  const [selectedOddIds, setSelectedOddIds] = useState<string[]>([]);
  const [betList, setBetList] = useState<BetSelection[]>([]);
  const [stakeByOddId, setStakeByOddId] = useState<Record<string, string>>({});
  const { user, loading } = useAuthContext();
  console.log("user in League component:", user);
  console.log("loading in League component:", loading);

  const client = useMemo(() => {
    return hc<AppType>(import.meta.env.VITE_BACKEND_URL as string);
  }, []);

  useEffect(() => {
    async function fetchLeagueDetails() {
      if (!sportId || !leagueId) {
        console.error("Missing sportId or leagueId in params");
        return;
      }
      try {
        const res = await client.events.league[':leagueId'].$get({
          param: {
            leagueId: leagueId
          }
        });

        if (!res.ok) {
          console.error("Failed to fetch league details for leagueId:", leagueId);
          return;
        }
        const data = await res.json();
        setEventDetails(data);
      } catch (error) {
        console.error("Error fetching league details:", error);
      }
    }
    fetchLeagueDetails();
  }, [client, sportId, leagueId]);

  const addBet = (eventName: string, marketType: string, odd: EventDetails["markets"][number]["odds"][number]) => {
    setBetList((prev) => {
      if (prev.some((item) => item.oddId === odd.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          oddId: odd.id,
          eventName,
          marketType,
          oddName: odd.name,
          oddValue: odd.value,
        },
      ];
    });

    setSelectedOddIds((prev) => {
      if (prev.includes(odd.id)) {
        return prev;
      }
      return [...prev, odd.id];
    });
  };

  const removeBet = (oddId: string) => {
    setBetList((prev) => prev.filter((item) => item.oddId !== oddId));
    setSelectedOddIds((prev) => prev.filter((id) => id !== oddId));
    setStakeByOddId((prev) => {
      const next = { ...prev };
      delete next[oddId];
      return next;
    });
  };

  const submitBets = async () => {
    if (betList.length === 0 || !user || loading) {
      return;
    }
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        console.error("User is not authenticated");
        return;
      }
      betList.forEach(async (bet) => {
        const oddId = bet.oddId;
        const stake = Number(stakeByOddId[bet.oddId]);
        if (!Number.isFinite(stake) || stake <= 0) {
          console.warn(`Invalid stake for oddId ${oddId}, skipping...`);
          return;
        }
        const res = await client.bets.$post(
          {
            json: {
              oddId,
              amount: stake,
            }
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        )
        if (!res.ok) {
          console.error(`Failed to submit bet for oddId ${oddId}`);
          return;
        }
        console.log(`Bet submitted for oddId ${oddId}`);
      })
    } catch (error) {
      console.error("Error submitting bets:", error);
    }
  }

  return (
        <div className="w-full space-y-6">
            <div className="rounded-2xl border border-amber-100/20 bg-slate-900 p-6 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">League Detail</p>
                <h2 className="mt-2 text-3xl font-semibold text-amber-50 md:text-4xl">{leagueId}</h2>
                {eventDetails && eventDetails.markets.length === 0 && (
                    <p className="mt-2 text-sm text-slate-400">No events available for this league.</p>
                )}
            </div>

            <div
                onClick={() => setDisplayBet(false)}
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${displayBet ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
            />

            <button
                type="button"
                onClick={() => setDisplayBet(true)}
                className="fixed bottom-6 right-6 z-30 rounded-full border border-emerald-300/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg backdrop-blur transition-colors hover:bg-emerald-300/30"
            >
                Bet Slip ({betList.length})
            </button>
            <aside
                className={`fixed right-0 top-0 z-50 h-svh w-full max-w-md border-l border-emerald-200/20 bg-slate-900 p-6 shadow-2xl transition-transform duration-300 ${displayBet ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Your Bets</p>
                    <button
                        type="button"
                        onClick={() => setDisplayBet(false)}
                        className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>
                
                {betList.length > 0 ? (
                    <>
                    <ul className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(100svh - 90px)" }}>
                        {betList.map((bet) => (
                            <li key={bet.oddId} className="rounded-lg border border-slate-700/70 bg-slate-950/50 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-100">{bet.eventName}</p>
                                        <p className="mt-1 text-xs text-slate-400">{bet.marketType} / {bet.oddName}</p>
                                        <p className="mt-1 text-sm font-semibold text-emerald-300">{bet.oddValue}</p>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Enter stake"
                                            value={stakeByOddId[bet.oddId] ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setStakeByOddId((prev) => ({
                                                    ...prev,
                                                    [bet.oddId]: value,
                                                }));
                                            }}
                                            className="mt-2 block w-full rounded-md border border-slate-700 bg-slate-800 px-5 text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        {(() => {
                                            const stake = Number(stakeByOddId[bet.oddId] ?? 0);
                                            const oddValue = Number(bet.oddValue);
                                            if (!Number.isFinite(stake) || stake <= 0 || !Number.isFinite(oddValue) || oddValue <= 0) {
                                                return null;
                                            }
                                            const potentialWin = stake * oddValue;
                                            return (
                                                <p className="mt-2 text-xs font-semibold text-emerald-200">
                                                    Payout: {potentialWin.toFixed(2)}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeBet(bet.oddId)}
                                        className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        onClick={submitBets}
                        className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                        Submit Bets
                    </button>
                    </>
                ) : (
                    <p className="text-sm text-slate-400">No bets selected yet.</p>
                )}
            </aside>

            <div className="rounded-2xl border border-amber-100/20 bg-slate-900 p-6 shadow-lg">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">Events</p>

                {eventDetails ? (
                    <ul className="space-y-3">
                        {eventDetails.markets.map((market) => (
                            <li
                                key={market.id}
                                className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 transition-colors hover:bg-slate-950/80"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-100">{market.event.name}</p>
                                    <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-200">
                                        {market.marketType}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                    {new Date(market.event.startTime).toLocaleString()}
                                </p>

                                <div
                                    className={`mt-3 grid gap-2 ${market.odds.length === 2
                                        ? "sm:grid-cols-2"
                                        : market.odds.length === 3
                                            ? "sm:grid-cols-3"
                                            : "sm:grid-cols-1"
                                        }`}
                                >
                                    {orderOddsforDisplay(market.odds).map((odd) => {
                                        const isSelected = selectedOddIds.includes(odd.id);
                                        return (
                                            <button
                                                type="button"
                                                key={odd.id}
                                                onClick={() => addBet(market.event.name, market.marketType, odd)}
                                                className={`w-full rounded-lg p-3 text-left transition-colors ${isSelected
                                                    ? "border border-amber-300/70 bg-amber-300/30 shadow-[0_0_0_1px_rgba(252,211,77,0.25)]"
                                                    : "border border-slate-700/70 bg-slate-900/70 hover:bg-slate-800/80"
                                                    }`}
                                            >
                                                <p className={`truncate text-xs ${isSelected ? "text-amber-100" : "text-slate-300"}`}>{odd.name}</p>
                                                <p className={`mt-1 text-lg font-semibold ${isSelected ? "text-amber-200" : "text-emerald-300"}`}>{odd.value}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </li>
                        ))}
                        {eventDetails.markets.length === 0 ? (
                            <li className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 text-sm text-slate-400">
                                No events found.
                            </li>
                        ) : null}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 text-sm text-slate-400">
                        Loading events...
                    </div>
                )}
            </div>
        </div >
    )
}
