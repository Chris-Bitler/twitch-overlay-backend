import { EventSubMiddleware } from "@twurple/eventsub";
import { Socket } from "socket.io";

export const attemptSubscribe = (socket: Socket, middlewareInstance: EventSubMiddleware, targetUserId: string) => {
    middlewareInstance.subscribeToChannelRaidEventsTo(targetUserId, (event) => {
        console.log(`Raid event: ${targetUserId}`);
        const eventData = {
            raider: event.raidingBroadcasterDisplayName,
            viewers: event.viewers
        };
        socket.to(targetUserId).emit('raid', eventData);
    });
    middlewareInstance.subscribeToChannelCheerEvents(targetUserId, (event) => {
        console.log(`Cheer event: ${targetUserId}`);
        const eventData = {
            cheerer: event.userDisplayName,
            amount: event.bits
        };
        socket.to(targetUserId).emit('cheer', eventData);
    });
    middlewareInstance.subscribeToChannelFollowEvents(targetUserId, (event) => {
        console.log(`Follow event: ${targetUserId}`);
        const eventData = {
            follower: event.userDisplayName
        };
        socket.to(targetUserId).emit('follow', eventData);
    });
    middlewareInstance.subscribeToChannelSubscriptionEvents(targetUserId, (event) => {
        console.log(`Sub event: ${targetUserId}`);
        const eventData = {
            subber: event.userDisplayName
        };
        socket.to(targetUserId).emit('sub', eventData);
    })
    middlewareInstance.subscribeToChannelSubscriptionGiftEvents(targetUserId, (event) => {
        console.log(`Gift sub event: ${targetUserId}`);
        const eventData = {
            gifter: event.gifterDisplayName,
            giftAmount: event.amount,
            cumulativeGiftAmount: event.cumulativeAmount ?? event.amount
        }
        socket.to(targetUserId).emit('gift_sub', eventData);
    })
}