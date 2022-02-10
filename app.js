const fs = require('fs');
const { ClientCredentialsAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { DirectConnectionAdapter, EventSubListener } = require('@twurple/eventsub');

const env = require('dotenv').config();

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const eventSubSecret = process.env.EVENTSUB_SECRET;

const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

const adapter = new DirectConnectionAdapter({
    hostName: "24.5.140.162:443",
    sslCert: {
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    }
});

const listener = new EventSubListener({ apiClient, adapter , secret: eventSubSecret});
listener.listen(3000).then(() => {
    apiClient.users.getUsersByNames(["voidwhisperer"]).then(users => {
        const toma = users[0];
        const id = toma.id;
        listener.subscribeToChannelFollowEvents(id, (e) => {
            console.log(`${e.userDisplayName} just followed!`);
        });
    })
});

