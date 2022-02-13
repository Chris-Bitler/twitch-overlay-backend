import {EventSubStreamOfflineEvent, EventSubStreamOnlineEvent} from "@twurple/eventsub";
import {createClient} from "redis";
import {ApiClient} from "@twurple/api";

export class RedeemStateManager {
    redeemStates: {[key: string]: BroadcasterRedeems} = {};
    apiClient: ApiClient;

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
    }

    userGoesOffline(event: EventSubStreamOfflineEvent) {
        delete this.redeemStates[event.broadcasterId];
    }

    userGoesOnline(event: EventSubStreamOnlineEvent) {
        delete this.redeemStates[event.broadcasterId];
    }

    getRedeemCount(targetUserId: string, rewardId: string): number {
        const redeemState = this.redeemStates[targetUserId];
        if (redeemState) {
            return redeemState.redeemCounters[rewardId];
        }
        return 0;
    }

    async incrementRedeemCount(targetUserId: string, rewardId: string) {
        const redeemState = this.redeemStates[targetUserId];
        if (redeemState) {
            const redeemCounter = redeemState.redeemCounters[rewardId];
            // Assumption that the counter will never be 0 here, only 1 or higher
            if (redeemCounter) {
                redeemState.redeemCounters[rewardId] = redeemCounter + 1;
            } else {
                redeemState.redeemCounters[rewardId] = 1;
            }
        } else {
            const streams = await this.apiClient.streams.getStreams({userId: targetUserId});
            if (streams.data.length > 0) {
                const stream = streams.data[0];
                this.redeemStates[targetUserId] = {
                    lastStartedAt: stream.startDate,
                    redeemCounters: {
                        [rewardId]: 1
                    }
                }
            }

        }
    }

    async reloadRedeemsOnStartup(apiClient: ApiClient) {
        const client = createClient({
            url: process.env.REDIS_URL
        });
        await client.connect();
        const oldState = await client.getDel('redeem_state' as any);
        if (oldState) {
            const jsonState = JSON.parse(oldState!!);
            for (const property of jsonState) {
                const broadcasterRedeemsState = jsonState[property];
                const lastStartedAt = broadcasterRedeemsState.lastStartedAt;
                const streams = await apiClient.streams.getStreams({userId: property});
                if (streams.data.length > 0) {
                    const stream = streams.data[0];
                    // If they are still on the same stream
                    if (+lastStartedAt < +stream.startDate) {
                        this.redeemStates[property] = broadcasterRedeemsState;
                    }
                }
            }
        }
        await client.disconnect();
    }

    async saveRedeemsOnShutdown() {
        const client = createClient({
            url: process.env.REDIS_URL
        });
        await client.connect();
        await client.set('redeem_state' as any, JSON.stringify(this.redeemStates) as any);
    }
}
class BroadcasterRedeems {
    lastStartedAt?: Date;

    // reward id - counter
    redeemCounters: {[key: string]: number} = {};
}