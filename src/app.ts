import { ClientCredentialsAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubMiddleware } from "@twurple/eventsub";
import express from "express";
import { attemptSubscribe } from "./SubscriptionHandler";
import http from 'http';
import { Server } from 'socket.io';

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
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
}).listen(server);

io.on('connection', async (socket) => {
    console.log('user connected');
    // @ts-ignore
    const user: string = socket?.handshake?.query?.user;
    if (user) {
        const users = await apiClient.users.getUsersByNames([user]);
        if (users.length > 0) {
            const helixUser = users[0];
            const userId = helixUser.id;
            console.log(`Joined socket to room ${userId}`)
            socket.join(userId);
            attemptSubscribe(socket, middleware, userId)
        }
    }
    socket.on('disconnect', () => {
       console.log('user disconnected');
    })
});

middleware.apply(app);

server.listen(process.env.PORT);
