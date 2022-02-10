import { HelixUser } from "@twurple/api";
import { ClientCredentialsAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubListener, EventSubMiddleware } from "@twurple/eventsub";
import { ReverseProxyAdapterWithWebsocket } from "./ReverseProxyAdapterWithWebsocket";
import express from "express";
import ws from "ws";
import {WebSocketManager} from "./WebSocketManager";
import http from "http";

require('dotenv').config();

const clientId = process.env.TWITCH_CLIENT_ID!!;
const clientSecret = process.env.TWITCH_CLIENT_SECRET!!;
const eventSubSecret = process.env.EVENTSUB_SECRET!!;

const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

const middleware = new EventSubMiddleware({
    apiClient,
    hostName: process.env.HOSTNAME!!,
    pathPrefix: "/twitch",
    secret: eventSubSecret,
});

const websocketManager = new WebSocketManager(middleware);

const app = express();
const wsServer = new ws.Server({ noServer: true, path: '/ws'});
wsServer.on('connection', (socket) => {
    websocketManager.handleNewConnection(socket);
});

middleware.apply(app);

const server = app.listen(process.env.PORT!!, async () => {
    await middleware.markAsReady();
    const users = await apiClient.users.getUsersByNames(['summit1g']);
    const user = users[0];
    const id = user.id;
    await middleware.subscribeToChannelFollowEvents(id, (e) => {
            console.log(`${e.userDisplayName} just followed!`);
    });
});

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});

