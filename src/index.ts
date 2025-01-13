import 'dotenv/config';
import { Bot } from "./entities/Bot.ts";

if (process.env.TELEGRAM_BOT_TOKEN && process.env.WISH_LIST_PATH) {
    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN, process.env.WISH_LIST_PATH);
    bot.start();
    console.log('Bot started');
} else {
    console.error("TELEGRAM_BOT_TOKEN is not defined in the environment variables.");
}
