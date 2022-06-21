import {
    EventSubChannelCheerEvent,
    EventSubChannelFollowEvent,
    EventSubChannelRaidEvent,
    EventSubChannelRedemptionAddEvent,
    EventSubChannelSubscriptionEvent,
    EventSubChannelSubscriptionGiftEvent,
    EventSubChannelSubscriptionMessageEvent,
    EventSubMiddleware, EventSubSubscription
} from "@twurple/eventsub";
import { Server } from "socket.io";

export const attemptSubscribe = (socket: Server, middlewareInstance: EventSubMiddleware, targetUserId: string) => {
    middlewareInstance.subscribeToChannelRaidEventsTo(targetUserId, (event: EventSubChannelRaidEvent) => {
        console.log(`Raid event: ${targetUserId}`);
        const eventData = {
            raider: event.raidingBroadcasterDisplayName,
            viewers: event.viewers
        };
        socket.to(targetUserId).emit('raid', eventData);
    }).then((sub: EventSubSubscription) => console.log(sub.getCliTestCommand()));
    middlewareInstance.subscribeToChannelCheerEvents(targetUserId, (event: EventSubChannelCheerEvent) => {
        console.log(`Cheer event: ${targetUserId}`);
        const eventData = {
            cheerer: event.userDisplayName,
            amount: event.bits,
            message: event.message,
        };
        socket.to(targetUserId).emit('cheer', eventData);
    });
    middlewareInstance.subscribeToChannelFollowEvents(targetUserId, (event: EventSubChannelFollowEvent) => {
        console.log(`Follow event: ${targetUserId}`);
        const eventData = {
            follower: event.userDisplayName
        };
        socket.to(targetUserId).emit('follow', eventData);
    }).then((sub: EventSubSubscription) => console.log(sub.getCliTestCommand()));
    middlewareInstance.subscribeToChannelSubscriptionEvents(targetUserId, (event: EventSubChannelSubscriptionEvent) => {
        console.log(`Sub event: ${targetUserId}`);
        if (!event.isGift) {
            const eventData = {
                subber: event.userDisplayName
            };
            socket.to(targetUserId).emit('sub', eventData);
        }
    }).then((sub: EventSubSubscription) => console.log(sub.getCliTestCommand()));
    middlewareInstance.subscribeToChannelSubscriptionMessageEvents(targetUserId, (event: EventSubChannelSubscriptionMessageEvent) => {
        console.log(`Resub event: ${targetUserId}`);
        const eventData = {
            subber: event.userDisplayName
        };
        socket.to(targetUserId).emit('sub', eventData);
    }).then((sub: EventSubSubscription) => console.log(sub.getCliTestCommand()));
    middlewareInstance.subscribeToChannelSubscriptionGiftEvents(targetUserId, (event: EventSubChannelSubscriptionGiftEvent) => {
        console.log(`Gift sub event: ${targetUserId}`);
        const eventData = {
            gifter: event.gifterDisplayName,
            giftAmount: event.amount,
            cumulativeGiftAmount: event.cumulativeAmount ?? event.amount
        }
        socket.to(targetUserId).emit('gift_sub', eventData);
    }).then((sub: EventSubSubscription) => console.log(sub.getCliTestCommand()));
    middlewareInstance.subscribeToChannelRedemptionAddEvents(targetUserId, (event: EventSubChannelRedemptionAddEvent) => {
        console.log(`Redeem event: ${targetUserId}`);
        const eventData = {
            redeemer: event.userDisplayName,
            title: event.rewardTitle,
            id: event.rewardId,
        };
        socket.to(targetUserId).emit('redeem', eventData);
    }).then((sub: EventSubSubscription) => console.log(sub.getCliTestCommand()));
}