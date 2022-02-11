import WebSocket from "ws";
import {
    EventSubChannelCheerEvent,
    EventSubChannelFollowEvent,
    EventSubChannelRaidEvent,
    EventSubChannelSubscriptionEvent,
    EventSubChannelSubscriptionGiftEvent, EventSubExtensionBitsTransactionCreateEvent
} from "@twurple/eventsub";
import {ApiClient} from "@twurple/api";
import {SubscriptionHandler} from "./SubscriptionHandler";

export class EventHandler {
    private usersHandlerListeningTo: string[] = [];
    private socket: WebSocket | null = null;
    private isAlive: boolean = false;
    private apiClient: ApiClient;
    private subscriptionHandler: SubscriptionHandler;

    constructor(apiClient: ApiClient, subscriptionHandler: SubscriptionHandler) {
        this.apiClient = apiClient;
        this.subscriptionHandler = subscriptionHandler;
    }

    handleWebsocketConnection(socket: WebSocket) {
        this.socket = socket;
        console.log(`Setting up incoming websocket: ${socket}`)
        socket.on('pong', () => {
            this.isAlive = true
        });
        socket.on('message', async (message: string) => {
            const messageObject = JSON.parse(message);
            console.log(`Got message: ${message}`);
            if (messageObject.type === 'ADD_USER') {
                const twitchUser = await this.apiClient.users.getUsersByNames([messageObject.user]);
                if (twitchUser.length > 0) {
                    const id = twitchUser[0].id;
                    this.usersHandlerListeningTo.push(id);
                    this.subscriptionHandler.attemptSubscribe(id);
                }
            }
        });
        const pingInterval = setInterval(() => {
            console.log('Ping interval')
           if (!this.isAlive) this.handleWebsocketConnectionClose(socket);
           this.isAlive = false;
           socket.ping();
        }, 30000);
        socket.on('close', () => {
            this.handleWebsocketConnectionClose(socket);
            clearInterval(pingInterval)
        });
        this.subscriptionHandler.listen(this);
    }

    handleWebsocketConnectionClose(socket: WebSocket) {
        try {
            socket.terminate();
        } catch (ex) {}
        this.subscriptionHandler.removeListener(this);
    }

    handleRaid(event: EventSubChannelRaidEvent) {
        if (this.usersHandlerListeningTo.includes(event.raidedBroadcasterId)) {
            this.send(this.socket!!, {
                type: 'RAID',
                raider: event.raidingBroadcasterDisplayName,
                viewers: event.viewers
            })
        }
    }

    handleSub(event: EventSubChannelSubscriptionEvent) {
        console.log(event.broadcasterId);
        this.usersHandlerListeningTo.forEach((id) => console.log(`-${id}`));
        if(!event.isGift && this.usersHandlerListeningTo.includes(event.broadcasterId)) {
            // TODO: Query sub length here
            this.send(this.socket!!, {
                type: 'SUB',
                subber: event.userDisplayName
            });
        }
    }

    handleGiftSub(event: EventSubChannelSubscriptionGiftEvent) {
        console.log(event.broadcasterId);
        this.usersHandlerListeningTo.forEach((id) => console.log(`-${id}`));
        if (this.usersHandlerListeningTo.includes(event.broadcasterId)) {
            this.send(this.socket!!,{
                type: 'GIFT_SUB',
                gifter: event.gifterDisplayName,
                giftAmount: event.amount,
                cumulativeGiftAmount: event.cumulativeAmount ?? event.amount
            });
        }
    }

    handleFollow(event: EventSubChannelFollowEvent) {
        console.log(event.broadcasterId);
        this.usersHandlerListeningTo.forEach((id) => console.log(`-${id}`));
        if(this.usersHandlerListeningTo.includes(event.broadcasterId)) {
            this.send(this.socket!!,{
                type: 'FOLLOW',
                follower: event.userDisplayName
            })
        }
    }

    handleCheer(event: EventSubChannelCheerEvent) {
        console.log(event.broadcasterId);
        this.usersHandlerListeningTo.forEach((id) => console.log(`-${id}`));
        if(this.usersHandlerListeningTo.includes(event.broadcasterId)) {
            this.send(this.socket!!,{
                type: 'CHEER',
                cheerer: event.userDisplayName,
                amount: event.bits
            })
        }
    }

    handleCheerExtension(event: EventSubExtensionBitsTransactionCreateEvent) {
        console.log(event.broadcasterId);
        this.usersHandlerListeningTo.forEach((id) => console.log(`-${id}`));
        if(this.usersHandlerListeningTo.includes(event.broadcasterId)) {
            this.send(this.socket!!, {
                type: 'CHEER',
                cheerer: event.userDisplayName,
                amount: event.productCost
            })
        }
    }

    private send(socket: WebSocket, message: any) {
        socket?.send(JSON.stringify(message));
    }
}