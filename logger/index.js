import { bot } from "../bot.js";
import { DateTime } from "luxon";


const dataBot = {
    loggerId: '@aptekaparser'
}

const DEBUG = true;

const logger = {
    now: DateTime.now().toFormat('yy-MM-dd HH:mm:ss'),

    async createNewLog(channelId, description) {
        let res;
        try {
            res = await bot.sendMessage(channelId, description, { parse_mode: 'Markdown' });
        } catch (err) {
            console.log(`🚩 ${this.now} Impossible to create log: ${err}`);
        }
        if (res) {
            return res;
        }
        return;
    },

    async info(desc) {
        const channel = dataBot.loggerId || -1;
        const log = `🏂 ${this.now} ${desc}`;
        const res = await this.createNewLog(channel, log);
        if (res && DEBUG) {
            console.log(`🏂 ${this.now} ${desc}`);
        }
    },

    async warn(desc) {
        const channel = dataBot.loggerId || -1;
        const log = `🎈 ${this.now} ${desc}`;
        const res = await this.createNewLog(channel, log);
        if (res && DEBUG) {
            console.log(log);
        }
    },

    async error(desc) {
        const channel = dataBot.loggerId || -1;
        const log = `🚩 ${this.now} ${desc}`;
        console.log(channel, log);
        const res = await this.createNewLog(channel, log);
        if (res) {
            console.log(log);
        }
    },
}

export { logger };