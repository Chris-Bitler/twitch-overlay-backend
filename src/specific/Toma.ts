import {Server, Socket} from "socket.io";
import {EventSubChannelRedemptionAddEvent, EventSubMiddleware} from "@twurple/eventsub";

const HAMSTER_REWARD = 'da358733-7c27-4c79-aa6a-7545919f67de';
const TOMA_ID = '24007676';

export const setup = (io: Server, middleware: EventSubMiddleware) => {
    middleware.subscribeToChannelRedemptionAddEventsForReward(TOMA_ID, HAMSTER_REWARD, (event) => {
       checkIfShouldShowHamster(io, event);
    });
}
const checkIfShouldShowHamster = (io: Server, event: EventSubChannelRedemptionAddEvent) => {
    if (event.broadcasterId === TOMA_ID && event.rewardId === HAMSTER_REWARD) {
        io.to(TOMA_ID).emit('hamster', {
            redeemer: event.userId,
            id: event.id
        });
    }
};