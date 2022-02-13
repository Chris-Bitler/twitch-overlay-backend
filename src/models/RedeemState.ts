import {EventSubStreamOfflineEvent, EventSubStreamOnlineEvent} from "@twurple/eventsub";
import {createClient} from "redis";
import {ApiClient} from "@twurple/api";
import {Server} from "socket.io";

export class RedeemStateManager {
    redeemStates: {[key: string]: BroadcasterRedeems} = {};
    apiClient: ApiClient;
    currentStreamIds: {[key: string]: string} = {};

    // Hacky but the redis client type doesn't actually work very well with TS
    redisClient: any;

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
        this.redisClient = createClient({
            url: process.env.REDIS_URL
        });
    }

    userGoesOffline(socket: Server, event: EventSubStreamOfflineEvent) {
        const rewardIds = Object.getOwnPropertyNames(this.redeemStates[event.broadcasterId]?.redeemCounters || {});
        rewardIds.forEach((rewardId) => {
            socket.to(event.broadcasterId).emit('reward_count', {
                rewardId,
                rewardAmount: 0
            });
        });
        delete this.redeemStates[event.broadcasterId];
    }

    async userGoesOnline(socket: Server, event: EventSubStreamOnlineEvent) {
        this.currentStreamIds[event.broadcasterId] = (await event.getStream()).id
        const rewardIds = Object.getOwnPropertyNames(this.redeemStates[event.broadcasterId]?.redeemCounters || {});
        rewardIds.forEach((rewardId) => {
            socket.to(event.broadcasterId).emit('reward_count', {
                rewardId,
                rewardAmount: 0
            });
        });
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
            const streamId = streams?.data?.[0]?.id || this.currentStreamIds[targetUserId];
            if (streamId) {
                const stream = streams.data[0];
                this.redeemStates[targetUserId] = {
                    streamId: stream.id,
                    redeemCounters: {
                        [rewardId]: 1
                    }
                }
            }
        }

        // TODO: This is pretty inefficient
        await this.redisClient.set('redeem_state' as any, JSON.stringify(this.redeemStates) as any);
    }

    async reloadRedeemsOnStartup(apiClient: ApiClient) {
        if (!this.redisClient.isOpen) {
            await this.redisClient.connect();
        }
        const oldState = process.env.NODE_ENV !== 'development' ? await this.redisClient.getDel('redeem_state' as any) : await this.redisClient.get('redeem_state' as any) ;
        if (oldState) {
            const jsonState = JSON.parse(oldState!!);
            for (const property of Object.getOwnPropertyNames(jsonState)) {
                const broadcasterRedeemsState = jsonState[property];
                const savedStreamId = broadcasterRedeemsState.streamId;
                const streams = await apiClient.streams.getStreams({userId: property});
                if (streams.data.length > 0) {
                    const stream = streams.data[0];
                    // If they are still on the same stream
                    if (savedStreamId === stream.id) {
                        this.redeemStates[property] = broadcasterRedeemsState;
                    }
                }
            }
        }
    }
}

class BroadcasterRedeems {
    streamId?: string;

    // reward id - counter
    redeemCounters: {[key: string]: number} = {};
}