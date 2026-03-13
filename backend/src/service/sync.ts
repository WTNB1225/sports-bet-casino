import { HTTPException } from "hono/http-exception";
import { Prisma } from "../../lib/generated/prisma/client";
import { prisma } from "../../lib/prisma";
import "dotenv/config";

export const syncOdds = async (sportsLeague: string, region: string, market: string, bookmaker: string) => {
    try {
        const res = await fetch(
            `${process.env.BASE_URL}/sports/${sportsLeague}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=${region}&markets=${market}&bookmakers=${bookmaker}`
        );
        if (!res.ok) {
            throw new HTTPException(500, { message: "Failed to fetch odds from external API" });
        }
        const oddsData = await res.json();
        for (const item of oddsData) {
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
                    const market = await tx.market.upsert({
                        where: {
                            id: `${event.id}_${marketData.key}`,
                        },
                        update: {},
                        create: {
                            id: `${event.id}_${marketData.key}`,
                            eventId: event.id,
                            marketType: marketData.key,
                        }
                    });
                    for (const outcome of bookmaker.markets[0].outcomes) {
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
            }

            )
        };
    } catch (error) {
        console.error(error);
        throw new HTTPException(500, { message: "Failed to sync odds" });
    }
}