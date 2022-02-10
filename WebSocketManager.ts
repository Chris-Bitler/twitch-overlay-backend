import WebSocket from "ws";

export class WebSocketManager {
    private static instance: WebSocketManager;

    static get() {
        if (WebSocketManager.instance === null) {
            WebSocketManager.instance = new WebSocketManager();
        }

        return WebSocketManager.instance;
    }

    handleNewConnection(socket: WebSocket) {}

    handleConnectionClose() {}
}