import { Cron } from "croner";
import { syncOdds } from "./service/sync";

/** イベント開始時間に応じてリフレッシュ間隔を変える関数 
 * - 開始時間が1時間以上先の場合は1時間ごと
 * - 開始時間が30分以上先の場合は30分ごと
 * - 開始時間が30分未満の場合は10分ごと
 * 開発用のため、実際の運用ではより頻繁に更新
 *
 * @param startTime イベントの開始時間
 * @returns リフレッシュ間隔（ミリ秒）
*/

export function getRefreshInterval(startTime: Date): number {
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    if (timeDiff > 3600 * 1000) {
        return 3600 * 1000; // 1時間ごと
    } else if (timeDiff > 1800 * 1000) {
        return 1800 * 1000; // 30分ごと
    }
    return 600 * 1000; // 10分ごと
}


const job = new Cron("*/1 * * * *", async () => {
    console.log("Running scheduled job to sync odds...");
    try {
        await syncOdds("soccer_epl", "eu", "h2h", "pinnacle");
        console.log("Odds synced successfully");
    } catch (error) {
        console.error("Error syncing odds:", error);
     }
});
