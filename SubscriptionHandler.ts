import { EventSubMiddleware } from "@twurple/eventsub";
import { EventHandler } from "./EventHandler";

export class SubscriptionHandler {
    private middlewareInstance: EventSubMiddleware;
    private listeners: EventHandler[] = [];

    constructor(middleware: EventSubMiddleware) {
        this.middlewareInstance = middleware;
    }

    listen(websocketHandler: EventHandler) {
        this.listeners.push(websocketHandler);
    }

    removeListener(websocketHandler: EventHandler) {
        this.listeners = this.listeners.filter((listener) => listener == websocketHandler);
    }

    attemptSubscribe(targetUserId: string) {
        this.middlewareInstance.subscribeToChannelRaidEventsTo(targetUserId, (event) => {
            console.log(`Raid event: ${targetUserId} - number of websockets: ${this.listeners.length}`);
            this.listeners.forEach((eventHandler) => eventHandler.handleRaid(event));
        });
        this.middlewareInstance.subscribeToChannelCheerEvents(targetUserId, (event) => {
            console.log(`Cheer event: ${targetUserId} - number of websockets: ${this.listeners.length}`);
            this.listeners.forEach((eventHandler) => eventHandler.handleCheer(event));
        });
        this.middlewareInstance.subscribeToChannelFollowEvents(targetUserId, (event) => {
            console.log(`Follow event: ${targetUserId} - number of websockets: ${this.listeners.length}`);
            this.listeners.forEach((eventHandler) => eventHandler.handleFollow(event));
        });
        this.middlewareInstance.subscribeToChannelSubscriptionEvents(targetUserId, (event) => {
            console.log(`Sub event: ${targetUserId} - number of websockets: ${this.listeners.length}`);
            this.listeners.forEach((eventHandler) => eventHandler.handleSub(event));
        })
        this.middlewareInstance.subscribeToChannelSubscriptionGiftEvents(targetUserId, (event) => {
            console.log(`Gift sub event: ${targetUserId} - number of websockets: ${this.listeners.length}`);
            this.listeners.forEach((eventHandler) => eventHandler.handleGiftSub(event));
        })
    }
}