import { HTTPException } from "hono/http-exception";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { MarketType as PrismaMarketType } from "@/lib/generated/prisma/client";
import { EventStatus as PrismaEventStatus } from "@/lib/generated/prisma/client";
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

const getEventStatus = (event: MatchResult) => {
    if (event.completed) {
        return PrismaEventStatus.FINISHED;
    }
    const currentTime = new Date();
    const commenceTime = new Date(event.commence_time);
    if (currentTime > commenceTime) {
        return PrismaEventStatus.LIVE;
    }
    return PrismaEventStatus.SCHEDULED;
};

const toPrismaMarketType = (marketKey: string): PrismaMarketType | null => {
    switch (marketKey) {
        case "h2h":
            return PrismaMarketType.H2H;
        case "totals":
            return PrismaMarketType.TOTALS;
        case "spreads":
            return PrismaMarketType.SPREADS;
        default:
            return null;
    }
};

const updateScores = async (sportsLeague: string) => {
    try {
        const res = await fetch(
            `${process.env.BASE_URL}/sports/${sportsLeague}/scores/?apiKey=${process.env.ODDS_API_KEY}&daysFrom=3`);
        if (!res.ok) {
            throw new HTTPException(500, { message: "Failed to fetch finished events from external API" });
        }
        const resultsData: ResultsResponse = await res.json();

        await prisma.$transaction(
            resultsData.map((item) => {
                const eventStatus = getEventStatus(item);

                const homeScoreObj = item.scores?.find(s => s.name === item.home_team);
                const awayScoreObj = item.scores?.find(s => s.name === item.away_team);

                const eventUpsert = prisma.event.upsert({
                    where: { id: item.id },
                    update: {
                        status: eventStatus,
                        statusUpdatedAt: new Date(),
                        lastSeenAt: new Date(),
                        ...(item.completed ? { endedAt: new Date(item.last_update) } : {}),
                    },
                    create: {
                        id: item.id,
                        name: `${item.home_team} vs ${item.away_team}`,
                        leagueId: item.sport_key,
                        startTime: new Date(item.commence_time),
                        status: eventStatus,
                        statusUpdatedAt: new Date(),
                        lastSeenAt: new Date(),
                        ...(item.completed ? { endedAt: new Date(item.last_update) } : {}),
                    }
                });

                if (homeScoreObj && awayScoreObj) {
                    const scoreUpsert = prisma.score.upsert({
                        where: { id: item.id },
                        update: {
                            homeScore: Number(homeScoreObj.score) || 0,
                            awayScore: Number(awayScoreObj.score) || 0,
                            updatedAt: new Date(),
                        },
                        create: {
                            id: item.id,
                            eventId: item.id,
                            homeScore: Number(homeScoreObj.score) || 0,
                            awayScore: Number(awayScoreObj.score) || 0,
                            updatedAt: new Date(),
                        }
                    });
                    return [eventUpsert, scoreUpsert];
                }

                return [eventUpsert];
            }).flat()
        );
    } catch (error) {
        throw new HTTPException(500, { message: "Failed to fetch finished events" });
    }
}

// TODO: DBのデータを追加 joinを１回のみ
export const updateBetsStatus = async () => {
    try {
        const bets = await prisma.event.findMany({
            where: {
                status: PrismaEventStatus.FINISHED || PrismaEventStatus.CANCELED || PrismaEventStatus.POSTPONED,
            },
            include: {
                markets: {
                    include: {
                        odds: {
                            include: {
                                bets: true,
                            },
                        },
                    },
                },
            },
        });
        console.log(bets);
    } catch (error) {
        throw new HTTPException(500, { message: "Faild to update bet result" });
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
        console.log(oddsData);
        const operations: Prisma.PrismaPromise<any>[] = [];

        for (const item of oddsData) {
            if (!item.bookmakers || item.bookmakers.length === 0) {
                console.warn(`No bookmaker data for event ${item.id}, skipping...`);
                continue;
            }

            const sportId = item.sport_key.split("_")[0];
            const eventStartTime = new Date(item.commence_time);
            const now = new Date();

            operations.push(
                prisma.sport.upsert({
                    where: { id: sportId },
                    update: {},
                    create: { id: sportId, name: sportId }
                })
            );

            operations.push(
                prisma.league.upsert({
                    where: { id: item.sport_key },
                    update: {},
                    create: {
                        id: item.sport_key,
                        name: item.sport_title,
                        sportId: sportId,
                    }
                })
            );

            operations.push(
                prisma.event.upsert({
                    where: { id: item.id },
                    update: {
                        startTime: eventStartTime,
                        status: getEventStatus({
                            id: item.id,
                            sport_key: item.sport_key,
                            sport_title: item.sport_title,
                            commence_time: item.commence_time,
                            completed: false,
                            home_team: item.home_team,
                            away_team: item.away_team,
                            scores: null,
                            last_update: item.bookmakers[0].last_update,
                        }), 
                        statusUpdatedAt: now,
                        lastSeenAt: now,
                    },
                    create: {
                        id: item.id,
                        name: `${item.home_team} vs ${item.away_team}`,
                        leagueId: item.sport_key,
                        startTime: eventStartTime,
                        status: eventStartTime <= now ? 'LIVE' : 'SCHEDULED',
                        statusUpdatedAt: now,
                        lastSeenAt: now,
                    }
                })
            );

            const bookmaker = item.bookmakers[0];
            for (const marketData of bookmaker.markets) {
                if (!marketData.outcomes?.length) continue;
                const prismaMarketType = toPrismaMarketType(marketData.key);
                if (!prismaMarketType) continue;
                const marketId = `${item.id}_${marketData.key}`;
                operations.push(
                    prisma.market.upsert({
                        where: { id: marketId },
                        update: {},
                        create: {
                            id: marketId,
                            eventId: item.id,
                            marketType: prismaMarketType,
                        }
                    })
                );
                for (const outcome of marketData.outcomes) {
                    operations.push(
                        prisma.odd.upsert({
                            where: { id: `${marketId}_${outcome.name}` },
                            update: {
                                value: new Prisma.Decimal(outcome.price),
                            },
                            create: {
                                id: `${marketId}_${outcome.name}`,
                                marketId: marketId,
                                name: outcome.name,
                                value: new Prisma.Decimal(outcome.price),
                            }
                        })
                    );
                }
            }
        }
        console.log(`Starting transaction for ${operations.length} operations...`);
        await prisma.$transaction(operations);
        console.log("Sync completed successfully.");
        await updateScores(sportsLeague);
    } catch (error) {
        console.error(error);
        throw new HTTPException(500, { message: "Failed to sync odds" });
    }
}
