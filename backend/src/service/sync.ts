import { HTTPException } from "hono/http-exception";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { MarketType as PrismaMarketType } from "@/lib/generated/prisma/client";
import "dotenv/config";

export interface Outcome {
    name: string;
    price: number;
}

export interface Market {
    key: string; // 例: "h2h"
    last_update: string; // ISO 8601 形式
    outcomes: Outcome[];
}

export interface Bookmaker {
    key: string;   // 例: "pinnacle"
    title: string; // 例: "Pinnacle"
    last_update: string;
    markets: Market[];
}

export interface Match {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string; // ISO 8601 形式
    home_team: string;
    away_team: string;
    bookmakers: Bookmaker[];
}

export interface Score {
    name: string;
    score: string; // JSON上は文字列 ("2", "3") なので string
}

export interface MatchResult {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string; // ISO 8601 形式
    completed: boolean;    // 試合が終了したかどうか
    home_team: string;
    away_team: string;
    scores: Score[] | null; // 試合前などは null または空の可能性があるため
    last_update: string;
}

// APIレスポンス全体（配列）として使う場合
export type ResultsResponse = MatchResult[];

export type OddsResponse = Match[];

const updateScores = async (sportsLeague: string) => {
    try {
        const res = await fetch(
            `${process.env.BASE_URL}/sports/${sportsLeague}/scores/?apiKey=${process.env.ODDS_API_KEY}&daysFrom=3`);
        if (!res.ok) {
            throw new HTTPException(500, { message: "Failed to fetch finished events from external API" });
        }
        const resultsData: ResultsResponse = await res.json();
        console.log(resultsData);
        for (const item of resultsData) {
            if (item.completed) continue;
            const homeScoreObj = item.scores?.find(score => score.name === item.home_team);
            const awayScoreObj = item.scores?.find(score => score.name === item.away_team);
            if (!homeScoreObj || !awayScoreObj) {
                console.warn(`Scores not found for event ${item.id}, skipping...`);
                continue;
            }
            const result = await prisma.score.upsert({
                where: {
                    id: item.id,
                },
                update: {
                    homeScore: parseInt(homeScoreObj.score),
                    awayScore: parseInt(awayScoreObj.score),
                    updatedAt: new Date(),
                },
                create: {
                    id: item.id,
                    eventId: item.id,
                    homeScore: parseInt(homeScoreObj.score),
                    awayScore: parseInt(awayScoreObj.score),
                    updatedAt: new Date(),
                }
            })
        }
    } catch (error) {
        throw new HTTPException(500, { message: "Failed to fetch finished events" });
    }
}

export const syncOdds = async (sportsLeague: string, region: string, market: string, bookmaker: string) => {
    try {
        const res = await fetch(
            `${process.env.BASE_URL}/sports/${sportsLeague}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=${region}&markets=${market}&bookmakers=${bookmaker}`
        );
        if (!res.ok) {
            throw new HTTPException(500, { message: "Failed to fetch odds from external API" });
        }
        const oddsData: OddsResponse = await res.json();
        console.log(oddsData)
        for (const item of oddsData) {
            console.log(item.bookmakers)
            console.log(`${item.bookmakers?.[0]?.title} - ${item.home_team} vs ${item.away_team} (${item.commence_time})`);
            if (!item.bookmakers || item.bookmakers.length === 0) {
                console.warn(`No bookmaker data for event ${item.id}, skipping...`);
                continue;
            }
            const sportId = item.sport_key.split("_")[0];
            await prisma.$transaction(async (tx) => {
                const sport = await tx.sport.upsert({
                    where: { id: sportId },
                    update: {},
                    create: {
                        id: sportId,
                        name: sportId,
                    }
                });
                const league = await tx.league.upsert({
                    where: { id: item.sport_key },
                    update: {},
                    create: {
                        id: item.sport_key,
                        name: item.sport_title,
                        sportId: sport.id,
                    }
                });
                const event = await tx.event.upsert({
                    where: { id: item.id },
                    update: {
                        startTime: new Date(item.commence_time),

                    },
                    create: {
                        id: item.id,
                        name: `${item.home_team} vs ${item.away_team}`,
                        leagueId: league.id,
                        startTime: new Date(item.commence_time),
                    }
                });
                const bookmaker = item.bookmakers[0];
                for (const marketData of bookmaker.markets) {
                    if (!marketData.outcomes?.length) {
                        continue;
                    }
                    const market = await tx.market.upsert({
                        where: {
                            id: `${event.id}_${marketData.key}`,
                        },
                        update: {},
                        create: {
                            id: `${event.id}_${marketData.key}`,
                            eventId: event.id,
                            marketType: (marketData.key).toUpperCase() as PrismaMarketType,
                        }
                    });
                    //TODO: outcomeはapi依存, market[0]はh2h指定する場合正しいが、他のmarketの場合は要検討
                    for (const outcome of marketData.outcomes) {
                        await tx.odd.upsert({
                            where: {
                                id: `${event.id}_${marketData.key}_${outcome.name}`,
                            },
                            update: {
                                value: new Prisma.Decimal(outcome.price),
                            },
                            create: {
                                id: `${event.id}_${marketData.key}_${outcome.name}`,
                                marketId: `${event.id}_${marketData.key}`,
                                name: outcome.name,
                                value: new Prisma.Decimal(outcome.price),
                            }
                        });
                    }
                }
                updateScores(sportsLeague);
            }
            )
        };
    } catch (error) {
        console.error(error);
        throw new HTTPException(500, { message: "Failed to sync odds" });
    }
}