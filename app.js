const { ClientCredentialsAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { ReverseProxyAdapter, EventSubListener } = require('@twurple/eventsub');
require('dotenv').config();

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const eventSubSecret = process.env.EVENTSUB_SECRET;

const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

const adapter = new ReverseProxyAdapter({
    hostName: process.env.HOSTNAME,
    port: 80
});

const listener = new EventSubListener({ apiClient, adapter, secret: eventSubSecret});
listener.listen().then(() => {
    apiClient.users.getUsersByNames(["voidwhisperer"]).then(users => {
        const toma = users[0];
        const id = toma.id;
        listener.subscribeToChannelFollowEvents(id, (e) => {
            console.log(`${e.userDisplayName} just followed!`);
        });
    })
});

