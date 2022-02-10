import { HelixUser } from "@twurple/api";
import { ClientCredentialsAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubListener } from "@twurple/eventsub";
import { ReverseProxyAdapterWithWebsocket } from "./ReverseProxyAdapterWithWebsocket";
require('dotenv').config();

const clientId = process.env.TWITCH_CLIENT_ID!!;
const clientSecret = process.env.TWITCH_CLIENT_SECRET!!;
const eventSubSecret = process.env.EVENTSUB_SECRET!!;

const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

const adapter = new ReverseProxyAdapterWithWebsocket(process.env.HOSTNAME!!, parseInt(process.env.PORT || '3000'));

const listener = new EventSubListener({ apiClient, adapter, secret: eventSubSecret});
listener.listen().then(() => {
    apiClient.users.getUsersByNames(['summit1g']).then((users: HelixUser[]) => {
        const toma = users[0];
        const id = toma.id;
        listener.subscribeToChannelFollowEvents(id, (e) => {
            console.log(`${e.userDisplayName} just followed!`);
        });
    })
});

