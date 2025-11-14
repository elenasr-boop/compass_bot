import { Bot, InlineKeyboard } from "grammy";
import { episodes } from "./info";
import { helloMesg, startMessage } from "./messeges";
import "dotenv/config";
import express from "express";
import {
  buildFilterKeyboard,
  filterEpisodes,
  sendFilterMenu,
  showEpisode,
} from "./functions";
import { userChoiceType, videoType } from "./types";

const bot = new Bot(process.env.BOT_TOKEN!);

const userSettings: { [userId: number]: userChoiceType } = {};
let currentEpisodes: videoType[] = episodes;

bot.command("start", async (ctx) => {
  userSettings[ctx.from!.id] = {
    isFiller: true,
    currentEpisode: 0,
    filter: "",
  };

  const msg = await ctx.replyWithPhoto(startMessage.img, {
    caption: startMessage.caption,
    reply_markup: new InlineKeyboard()
      .text("О шоу ℹ️", "home")
      .row()
      .text("Начать смотреть ▶️", "episode")
      .row()
      .text("Настроить предпочтения ⚙️", "filter"),
  });
  userSettings[ctx.from!.id].lastMessageId = msg.message_id;
});

bot.callbackQuery("home", async (ctx) => {
  const userId = ctx.from!.id;
  const user = userSettings[userId];
  const helloImg =
    "https://upload.wikimedia.org/wikipedia/ru/5/5f/%D0%9F%D0%BE%D0%B4%D0%B7%D0%B5%D0%BC%D0%B5%D0%BB%D1%8C%D1%8F_%D0%A7%D0%B8%D0%BA%D0%B5%D0%BD_%D0%9A%D0%B0%D1%80%D1%80%D0%B8_%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF.png";

  const keyboard = new InlineKeyboard()
    .text("Вернуться к просмотру эпизода ▶️", "episode")
    .row()
    .text("Настроить предпочтения ⚙️", "filter");

  if (user?.lastMessageId) {
    try {
      await ctx.api.editMessageMedia(
        ctx.chat!.id,
        user.lastMessageId,
        {
          type: "photo",
          media: helloImg,
          caption: helloMesg,
          parse_mode: "HTML",
        },
        {
          reply_markup: keyboard,
        }
      );
    } catch (err) {
      console.error("Ошибка при редактировании сообщения:", err);
      const msg = await ctx.replyWithPhoto(helloImg, {
        caption: helloMesg,
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      userSettings[userId].lastMessageId = msg.message_id;
    }
  } else {
    const msg = await ctx.replyWithPhoto(helloImg, {
      caption: helloMesg,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
    userSettings[userId].lastMessageId = msg.message_id;
  }

  await ctx.answerCallbackQuery();
});

bot.callbackQuery("episode", async (ctx) => {
  const user = userSettings[ctx.from!.id];
  await showEpisode({
    ctx: ctx,
    curEp: currentEpisodes[user.currentEpisode],
    user: userSettings[ctx.from!.id],
  });
});

bot.command("filter", async (ctx) => {
  await sendFilterMenu({ ctx: ctx, user: userSettings[ctx.from!.id] });
});

bot.callbackQuery("filter", async (ctx) => {
  await sendFilterMenu({ ctx: ctx, user: userSettings[ctx.from!.id] });
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data!;
  const userId = ctx.from!.id;
  const user = userSettings[userId];

  if (!user) return;

  switch (true) {
    case data.startsWith("choose:"): {
      const chosen = data.split(":")[1];
      user.filter = user.filter === chosen ? "" : chosen;

      await ctx.editMessageReplyMarkup({
        reply_markup: buildFilterKeyboard(user),
      });

      await ctx.answerCallbackQuery();
      break;
    }

    case data === "toggle_extra": {
      user.isFiller = !user.isFiller;

      await ctx.editMessageReplyMarkup({
        reply_markup: buildFilterKeyboard(user),
      });

      await ctx.answerCallbackQuery();
      break;
    }

    case data === "confirm": {
      await ctx.answerCallbackQuery();
      await filterEpisodes({
        ctx: ctx,
        curEpisodes: currentEpisodes,
        user: userSettings[ctx.from!.id],
      });
      user.currentEpisode = 0;
      await showEpisode({
        ctx: ctx,
        curEp: currentEpisodes[user.currentEpisode],
        user: userSettings[ctx.from!.id],
      });
      break;
    }

    case data === "prev": {
      user.currentEpisode -= 1;
      if (user.currentEpisode < 0) {
        await ctx.reply("Раньше этой ветки не было :(");
        await sendFilterMenu({ ctx: ctx, user: userSettings[ctx.from!.id] });
      } else {
        await showEpisode({
          ctx: ctx,
          curEp: currentEpisodes[user.currentEpisode],
          user: userSettings[ctx.from!.id],
        });
      }
      await ctx.answerCallbackQuery();
      break;
    }

    case data === "next": {
      user.currentEpisode += 1;
      if (user.currentEpisode === currentEpisodes.length) {
        await ctx.reply("Ждем выхода новых эпизодов 🥺");
        await sendFilterMenu({ ctx: ctx, user: userSettings[ctx.from!.id] });
      } else {
        await showEpisode({
          ctx: ctx,
          curEp: currentEpisodes[user.currentEpisode],
          user: userSettings[ctx.from!.id],
        });
      }
      await ctx.answerCallbackQuery();
      break;
    }

    case data.startsWith("member:"): {
      const memberName = data.split(":")[1];
      currentEpisodes = episodes.filter((ep) =>
        ep.members.includes(memberName)
      );
      user.currentEpisode = 0;
      await showEpisode({ctx: ctx, curEp: currentEpisodes[user.currentEpisode], user: userSettings[ctx.from!.id]});
      await ctx.answerCallbackQuery();
      break;
    }

    default: {
      await ctx.answerCallbackQuery();
      break;
    }
  }
});

bot.start();

const app = express();

app.get("/", (_: any, res: any) => {
  res.send("✅ Bot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web service running on port ${PORT}`);
});
