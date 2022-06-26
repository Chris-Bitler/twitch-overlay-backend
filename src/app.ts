import { ClientCredentialsAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubMiddleware } from "@twurple/eventsub";
import tmi, {SubMethods, SubUserstate} from 'tmi.js';
import express from "express";
import http from 'http';
import { Server } from 'socket.io';
import {chatHandler, hostHandler, joinedChannels, resubHandler, subHandler} from "./handler/ChatHandler";
import {attemptSubscribe} from "./SubscriptionHandler";
import {UsernameMapper} from "./util/UsernameMapper";

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
        origin: ['https://dev.twitch-overlay-frontend.pages.dev','https://twitch.voidwhisperer.info'],
        methods: ['GET', 'POST']
    }
}).listen(server);

const chatClient = new tmi.Client({
    identity: {
        username: process.env.BOT_NAME,
        password: process.env.BOT_TOKEN
    }
});

const usernameMapper = new UsernameMapper(apiClient);

chatClient.on('message', async (channel, userstate, message, self) => {
    const name = channel.replace('#', '');
    const userId = await usernameMapper.fetchUserId(name);
    if (userId) {
        chatHandler(io, userId, userstate, message, self);
    }
});
chatClient.on('hosted', async (channel, username, viewers) => {
    const name = channel.replace('#', '');
    const userId = await usernameMapper.fetchUserId(name);
    if (userId) {
        hostHandler(io, userId, username, viewers);
    }
});
chatClient.on('subscription', async (channel: string, username: string, methods: SubMethods, message: string, userstate: SubUserstate) => {
    const name = channel.replace('#', '');
    const userId = await usernameMapper.fetchUserId(name);
    if (userId) {
        subHandler(io, userId, username, methods, message, userstate);
    }
});
chatClient.on('resub', async (channel: string, username: string, months: number, message: string, userstate: SubUserstate, methods: SubMethods) => {
    const name = channel.replace('#', '');
    const userId = await usernameMapper.fetchUserId(name);
    if (userId) {
        resubHandler(io, userId, username, methods, message, userstate)
    }
});

io.on('connection', async (socket) => {
    console.log('user connected');
    const user: string | string[] | undefined = socket?.handshake?.query?.user;
    console.log(`Connected to ${user}`);
    if (user) {
        const userString = user as string;
        if (!joinedChannels.includes(userString)) {
            chatClient.join(userString);
            joinedChannels.push(userString);
        }
        const userId = await usernameMapper.fetchUserId(userString, false);
        if (userId) {
            socket.join(userId);
            console.log(`Joined socket to room ${userId}`);
            attemptSubscribe(io, middleware, userId);
        }
    }
});

middleware.apply(app);

chatClient.connect();

server.listen(process.env.PORT, async () => {
    await middleware.markAsReady()
});