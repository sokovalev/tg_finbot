import { Bot } from "grammy";
import { env } from "./lib/env";

const bot = new Bot(env.BOT_TOKEN);

bot.command("start", (ctx) => {
  ctx.reply("Hello, world!");
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Bot started as https://t.me/${botInfo.username}`);
  },
});
