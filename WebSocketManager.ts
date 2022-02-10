import WebSocket from "ws";
import {EventSubMiddleware} from "@twurple/eventsub";

export class WebSocketManager {
    private expressMiddleware: EventSubMiddleware;

    constructor(middleware: EventSubMiddleware) {
        this.expressMiddleware = middleware;
    }

    handleNewConnection(socket: WebSocket) {}

    handleConnectionClose() {}
}