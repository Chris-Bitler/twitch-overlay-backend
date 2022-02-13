import { ClientCredentialsAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubMiddleware } from "@twurple/eventsub";
import express from "express";
import { attemptSubscribe } from "./SubscriptionHandler";
import http from 'http';
import { Server } from 'socket.io';
import {RedeemStateManager} from "./models/RedeemState";

require('dotenv').config();

const clientId = process.env.TWITCH_CLIENT_ID!!;
const clientSecret = process.env.TWITCH_CLIENT_SECRET!!;
const eventSubSecret = process.env.EVENTSUB_SECRET!!;

const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });
const app = express();

const middleware = new EventSubMiddleware({
    apiClient,
    hostName: process.env.HOSTNAME!!,
    pathPrefix: "/twitch",
    secret: eventSubSecret,
});

const server = http.createServer(app);

const io = new Server({
    cors: {
        origin: ['https://twitch.voidwhisperer.info', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
}).listen(server);

const redeemStateManager = new RedeemStateManager(apiClient);
redeemStateManager.reloadRedeemsOnStartup(apiClient);

process.on('exit', () => {
    redeemStateManager.saveRedeemsOnShutdown();
});

io.on('connection', async (socket) => {
    console.log('user connected');
    // @ts-ignore
    const user: string = socket?.handshake?.query?.user;
    const rewardId: string | string[] | undefined = socket?.handshake?.query?.rewardId;
    if (user) {
        const users = await apiClient.users.getUsersByNames([user]);
        if (users.length > 0) {
            const helixUser = users[0];
            const userId = helixUser.id;
            console.log(`Joined socket to room ${userId}`)
            socket.join(userId);
            attemptSubscribe(io, middleware, redeemStateManager, userId, rewardId as string ?? '');
            if (rewardId) {
                setTimeout(() => {
                    const eventData = {
                        rewardAmount: redeemStateManager.getRedeemCount(userId, rewardId as string),
                        rewardId: rewardId as string
                    };
                    console.log(`sent ${rewardId}`);
                    socket.to(userId).emit('reward_count', eventData);
                }, 1000);
            }
        }
    }
    socket.on('disconnect', () => {
       console.log('user disconnected');
    });
});

middleware.apply(app);

server.listen(process.env.PORT, async () => {
    await middleware.markAsReady()
});