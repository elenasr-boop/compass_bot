import { Bot, InlineKeyboard } from "grammy";
import { branches, episodes, findBranch, findMember, userChoiceType, videoType } from './info';
import { helloMesg } from "./messeges";
import "dotenv/config";
import express from 'express';

const bot = new Bot(process.env.BOT_TOKEN!);

const userSettings: { [userId: number]: userChoiceType } = {};
let currentEpisodes: videoType[] = episodes;

async function showEpisode(ctx: any, currentEpisodeIndex: number) {
  const userId = ctx.from!.id;
  const user = userSettings[userId];
  const curEp = currentEpisodes[currentEpisodeIndex];

  const keyboard = buildEpisodeKeyboard(curEp);

  const caption = `${user.filter === "" ? '' : `Вы выбрали смотреть ветку ${user.filter} ${user.isFiller ? "все выпуски" : "только самые важные"}`}
  
<b>🎬 Выпуск ${curEp.number}</b>
${curEp.desc}
<b>👥 Участники:</b>
${curEp.members.join(", ")}
<b>🌿 Ветка:</b> ${curEp.branch.join(", ")}
<b>📺 Смотреть:</b> <a href="${curEp.url}">YouTube</a>${curEp.vkUrl ? `\n<a href="${curEp.vkUrl}">VK Видео</a>` : ""}`;

  try {
    if (user.lastMessageId) {
      await ctx.editMessageMedia(
        {
          type: "photo",
          media: curEp.img,
          caption,
          parse_mode: "HTML",
        },
        {
          reply_markup: keyboard,
        }
      );
    } else {
      const msg = await ctx.replyWithPhoto(curEp.img, {
        caption,
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      user.lastMessageId = msg.message_id;
    }
  } catch (err) {
    const msg = await ctx.api.editMessageCaption(ctx.chat!.id, user.lastMessageId, {
      caption: "Ждем выхода новых эпизодов 😅",
      reply_markup: keyboard,
    });
user.lastMessageId = msg.message_id;
  }
}

async function sendFilterMenu(ctx: any) {
  const user = userSettings[ctx.from.id];
  const keyboard = buildKeyboard(user);

  await ctx.reply("Выбери ветку:", {
    reply_markup: keyboard,
  });
}

async function filterEpisodes(ctx: any) {
  const userId = ctx.from!.id;
  const user = userSettings[userId];

  if (!user) return;

  currentEpisodes = findBranch(user.filter, user.isFiller);

  if (currentEpisodes.length === 0) {
    await ctx.reply("⚠️ Нет эпизодов с выбранными параметрами.");
    return;
  }

  user.currentEpisode = 0;
}

function buildKeyboard(user: userChoiceType) {
  const keyboard = new InlineKeyboard();

  for (const opt of branches) {
    const selectedMark = user.filter === opt ? "✅" : "";
    keyboard.text(`${selectedMark} ${opt}`, `choose:${opt}`).row();
  }

  keyboard.text(
    `${user.isFiller ? "✅ Смотреть все выпуски" : "❌ Опустить незначительные выпуски"} `,
    "toggle_extra"
  ).row();

  keyboard.text("Подтвердить выбор", "confirm");

  return keyboard;
}

function buildEpisodeKeyboard(curEp: videoType) {
  const keyboard = new InlineKeyboard();

  for (const member of curEp.members) {
    keyboard.text(member, `member:${member}`).row();
  }

  keyboard
    .text("⬅️ Предыдущий", "prev")
    .text("Следующий ➡️", "next")
    .row()
    .text("🏠 На главную", "home");

  return keyboard;
}

bot.command("start", async (ctx) => {
  userSettings[ctx.from!.id] = {
    isFiller: true,
    currentEpisode: 0,
    filter: "",
  }

  const msg = await ctx.replyWithPhoto("https://fileshare.kaverafisha.ru/storage/origin/2025/04/10/__d7a6bd2d292160351712ad784bb5eb02.webp", 
    {
      caption: `Приветствую голодного до приключений человека! Для начала ты можешь посмотреть первый выпуск Подземелий Чикен Карри или настроить предпочтения для того, чтобы я подсказал тебе лучший выпуск!\n\nОфициальный телеграм-канал Чикен Карри — @chickencurryshow`,
      reply_markup: new InlineKeyboard()
        .text("О шоу ℹ️", "home")
        .row()
        .text('Начать смотреть ▶️', 'episode')
        .row()
        .text('Настроить предпочтения ⚙️', 'filter'),
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

  try {
    if (user?.lastMessageId) {
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
    } else {
      const msg = await ctx.replyWithPhoto(helloImg, {
        caption: helloMesg,
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      userSettings[userId].lastMessageId = msg.message_id;
    }
  } catch (err) {
    console.error("Ошибка при редактировании сообщения:", err);
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
  await showEpisode(ctx, user.currentEpisode);
});

bot.command("filter", async (ctx) => {
  await sendFilterMenu(ctx);
});

bot.callbackQuery("filter", async (ctx) => {
  await sendFilterMenu(ctx);
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
      reply_markup: buildKeyboard(user),
    });

    await ctx.answerCallbackQuery();
    break;
  }

  case data === "toggle_extra": {
    user.isFiller = !user.isFiller;

    await ctx.editMessageReplyMarkup({
      reply_markup: buildKeyboard(user),
    });

    await ctx.answerCallbackQuery();
    break;
  }

  case data === "confirm": {
    await ctx.answerCallbackQuery();
    await filterEpisodes(ctx);
    user.currentEpisode = 0;
    await showEpisode(ctx, user.currentEpisode);
    break;
  }

  case data === "prev": {
    user.currentEpisode -= 1;
    if (user.currentEpisode < 0) {
      await ctx.reply("Раньше этой ветки не было :(");
      await sendFilterMenu(ctx);
    } else {
      await showEpisode(ctx, user.currentEpisode);
    }
    await ctx.answerCallbackQuery();
    break;
  }

  case data === "next": {
    user.currentEpisode += 1;
    if (user.currentEpisode === currentEpisodes.length) {
      await ctx.reply("Ждем выхода новых эпизодов");
      await sendFilterMenu(ctx);
    } else {
      await showEpisode(ctx, user.currentEpisode);
    }
    await ctx.answerCallbackQuery();
    break;
  }

  case data.startsWith("member:"): {
    const memberName = data.split(":")[1];
    currentEpisodes = episodes.filter((ep) => ep.members.includes(memberName));
    user.currentEpisode = 0;
    await showEpisode(ctx, user.currentEpisode);
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