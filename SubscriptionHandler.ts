import {EventSubMiddleware, EventSubSubscription} from "@twurple/eventsub";
import {EventSubBase} from "@twurple/eventsub/lib/EventSubBase";
import { EventHandler } from "./EventHandler";
import {EventNameToPrefixMapper} from "./EventNameToPrefixMapper";

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
            this.listeners.forEach((eventHandler) => eventHandler.handleRaid(event));
        });
        this.middlewareInstance.subscribeToChannelCheerEvents(targetUserId, (event) => {
            this.listeners.forEach((eventHandler) => eventHandler.handleCheer(event));
        });
        this.middlewareInstance.subscribeToChannelFollowEvents(targetUserId, (event) => {
            this.listeners.forEach((eventHandler) => eventHandler.handleFollow(event));
        });
        this.middlewareInstance.subscribeToChannelSubscriptionEvents(targetUserId, (event) => {
            this.listeners.forEach((eventHandler) => eventHandler.handleSub(event));
        })
        this.middlewareInstance.subscribeToChannelSubscriptionGiftEvents(targetUserId, (event) => {
            this.listeners.forEach((eventHandler) => eventHandler.handleGiftSub(event));
        })
        this.middlewareInstance.subscribeToExtensionBitsTransactionCreateEvents(targetUserId, (event) => {
            this.listeners.forEach((eventHandler) => eventHandler.handleCheerExtension(event));
        })
    }
}