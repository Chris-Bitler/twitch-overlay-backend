import {ConnectionAdapter} from "@twurple/eventsub";
import http from 'http';
import ws from 'ws';
import express from 'express';
import {WebSocketManager} from "./WebSocketManager";

export class ReverseProxyAdapterWithWebsocket extends ConnectionAdapter {
    hostname: string;
    port: number;

    constructor(hostname: string, port: number = 3000) {
        super();
        this.hostname = hostname;
        this.port = port;
    }

    get listenUsingSsl(): boolean {
        return false;
    }

    createHttpServer(): http.Server {
        const app = express();
        const wsServer = new ws.Server({ noServer: true, path: '/ws'});
        wsServer.on('connection', (socket) => {
            WebSocketManager.get().handleNewConnection(socket);
        });
        const server = http.createServer(app);
        server.on('upgrade', (request, socket, head) => {
           wsServer.handleUpgrade(request, socket, head, socket => {
               wsServer.emit('connection', socket, request);
           });
        });

        return server;
    }

    getHostName(): Promise<string> {
        return Promise.resolve(this.hostname);
    }

}