import { Bot } from "grammy";
import { env } from "./lib/env";
import { LLMCategorizeExpense } from "./services/LLMCategorization/LLMCategorization";

const bot = new Bot(env.BOT_TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    "Отправь расход текстом, например: «Такси 350» или «Пятёрочка 1200»"
  )
);
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (!text) return;

  const categoryInfo = await LLMCategorizeExpense(text);

  if (!categoryInfo) {
    await ctx.reply("Не удалось распознать сообщение");
    return;
  }

  await ctx.reply(`${categoryInfo.category} - ${categoryInfo.amount} руб.`);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Bot started as https://t.me/${botInfo.username}`);
  },
});
