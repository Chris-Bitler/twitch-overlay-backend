import tmi, {SubMethods, SubUserstate} from 'tmi.js';
import { Server } from "socket.io"

export const joinedChannels: string[] = [];

export const chatHandler = (io: Server, channel: string, userstate: tmi.Userstate, message: string, self: boolean) => {
    console.log(`${channel.replace('#', '')}: ${userstate.username}: ${message}`);
    console.log(io.listenerCount);
    io.to(channel.replace('#', '')).emit('chat', {
        channel,
        username: userstate?.username,
        isMod: userstate?.mod,
        isFirst: userstate['first-msg'],
        message
    });
}

export const hostHandler = (io: Server, channel: string, username: string, viewers: number) => {
    console.log(`${channel.replace('#', '')} being hosted for ${viewers} ${username}`);
    console.log(io.listenerCount);
    io.to(channel.replace('#', '')).emit('hosted', {
        channel,
        username,
        viewers
    });
}

export const subHandler = (io: Server, channel: string, username: string, methods: SubMethods, message: string, userstate: SubUserstate) => {
    console.log(`${channel.replace('#', '')} was subbed to by ${username}`);
    console.log(io.listenerCount);
    io.to(channel.replace('#', '')).emit('tmi_subbed', {
        channel,
        username,
        message
    });
}

export const resubHandler = (io: Server, channel: string, username: string, methods: SubMethods, message: string, userstate: SubUserstate) => {
    console.log(`${channel.replace('#', '')} was resubbed to by ${username}`);
    console.log(io.listenerCount);
    io.to(channel.replace('#', '')).emit('tmi_resubbed', {
        channel,
        username,
        message
    });
}