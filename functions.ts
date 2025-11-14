import { InlineKeyboard } from "grammy";
import { branches, episodes } from "./info";
import { episodeMessage } from "./messeges";
import { filterEpisodesType, filterMenuType, showEpisodeType, userChoiceType, videoType } from "./types";

const findBranch = (branch: string, isFiller: boolean) => {
  if (branch === "") {
    return episodes.filter((episode) => isFiller || !episode.isFiller);
  }

  return episodes.filter(
    (episode) =>
      episode.branch.includes(branch) && (isFiller || !episode.isFiller)
  );
};

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

export function buildFilterKeyboard(user: userChoiceType) {
  const keyboard = new InlineKeyboard();

  for (const opt of branches) {
    const selectedMark = user.filter === opt ? "✅" : "";
    keyboard.text(`${selectedMark} ${opt}`, `choose:${opt}`).row();
  }

  keyboard
    .text(
      `${
        user.isFiller
          ? "✅ Смотреть все выпуски"
          : "❌ Опустить незначительные выпуски"
      } `,
      "toggle_extra"
    )
    .row();

  keyboard.text("Подтвердить выбор", "confirm");

  return keyboard;
}

export async function filterEpisodes({ctx, curEpisodes, user}: filterEpisodesType) {
  if (!user) return;

  curEpisodes = findBranch(user.filter, user.isFiller);

  if (curEpisodes.length === 0) {
    await ctx.reply("⚠️ Нет эпизодов с выбранными параметрами.");
    return;
  }

  return {curEpisodes, user}
}

export async function sendFilterMenu({ctx, user} : filterMenuType) {
  const keyboard = buildFilterKeyboard(user);

  await ctx.reply("Выбери ветку:", {
    reply_markup: keyboard,
  });
}

export async function showEpisode({ctx, curEp, user}: showEpisodeType) {
  const keyboard = buildEpisodeKeyboard(curEp);
  const caption = episodeMessage(user, curEp);

  try {
    if (user.lastMessageId) {
      try {
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
      } catch (err) {
        return;
      }
    } else {
      const msg = await ctx.replyWithPhoto(curEp.img, {
        caption,
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      user.lastMessageId = msg.message_id;
    }
  } catch (err) {
    const msg = await ctx.api.editMessageCaption(
      ctx.chat!.id,
      user.lastMessageId,
      {
        caption: "Ждем выхода новых эпизодов 😅",
        reply_markup: keyboard,
      }
    );
    user.lastMessageId = msg.message_id;
  }
}