import { useParams } from "react-router";
import { useMemo, useEffect, useState } from "react";
import { hc } from "hono/client";
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
    },[client, sportId, leagueId]);

    return (
        <div className="w-full space-y-6">
            <div className="rounded-2xl border border-amber-100/20 bg-slate-900 p-6 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">League Detail</p>
                <h2 className="mt-2 text-3xl font-semibold text-amber-50 md:text-4xl">{leagueId}</h2>
                {eventDetails && eventDetails.markets.length > 0 ? (
                    <p className="mt-2 text-sm text-slate-300">League: {eventDetails.markets[0].event.leagueId}</p>
                ) : (
                    <p className="mt-2 text-sm text-slate-400">Loading league details...</p>
                )}
            </div>

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

                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    {orderOddsforDisplay(market.odds).map((odd) => (
                                        <button
                                            type="button"
                                            key={odd.id}
                                            className="w-full rounded-lg border border-slate-700/70 bg-slate-900/70 p-3 text-left transition-colors hover:bg-slate-800/80"
                                        >
                                            <p className="truncate text-xs text-slate-300">{odd.name}</p>
                                            <p className="mt-1 text-lg font-semibold text-emerald-300">{odd.value}</p>
                                        </button>
                                    ))}
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
        </div>
    )
}