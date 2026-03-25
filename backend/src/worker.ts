import { Cron } from "croner";
import { syncOdds } from "./service/sync";
import { prisma } from "@/lib/prisma";

/** イベント開始時間に応じてリフレッシュ間隔を変える関数 
 * - 開始時間が1時間以上先の場合は1時間ごと
 * - 開始時間が30分以上先の場合は30分ごと
 * - 開始時間が30分未満の場合は10分ごと
 * 開発用のため、実際の運用ではより頻繁に更新
 *
 * @param startTime イベントの開始時間
 * @returns リフレッシュ間隔（ミリ秒）
*/

function getRefreshInterval(startTime: Date): number {
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    if (timeDiff > 3600 * 1000) {
        return 3600 * 1000; // 1時間ごと
    } else if (timeDiff > 1800 * 1000) {
        return 1800 * 1000; // 30分ごと
    }
    return 600 * 1000; // 10分ごと
}

const DEFAULT_REFRESH_INTERVAL_MS = 3600 * 1000;
let lastSyncedAt = 0;

async function getCurrentRefreshIntervalMs() {
    const now = new Date();
    const nextEvent = await prisma.event.findFirst({
        where: {
            startTime: {
                gt: now,
            }
        },
        orderBy: {
            startTime: "asc",
        },
        select: {
            startTime: true,
        },
    });

    if (!nextEvent) {
        return DEFAULT_REFRESH_INTERVAL_MS;
    }

    return getRefreshInterval(nextEvent.startTime);
}

async function runSyncIfDue(trigger: "startup" | "cron") {
    const intervalMs = await getCurrentRefreshIntervalMs();
    const now = Date.now();
    const elapsedMs = now - lastSyncedAt;

    if (trigger !== "startup" && elapsedMs < intervalMs) {
        return;
    }
    console.log(`Running odds sync (${trigger})...`);
    try {
        await syncOdds("baseball_mlb", "eu", "h2h", "pinnacle");
        lastSyncedAt = Date.now();
        console.log(`Odds synced successfully (next interval: ${Math.floor(intervalMs / 60000)} min)`);
    } catch (error) {
        console.error("Error syncing odds:", error);
    }
}

runSyncIfDue("startup");

const job = new Cron("*/1 * * * *", async () => {
    await runSyncIfDue("cron");
});

