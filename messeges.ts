import { userChoiceType, videoType } from "./types";

export const helloImg =
  "https://upload.wikimedia.org/wikipedia/ru/5/5f/%D0%9F%D0%BE%D0%B4%D0%B7%D0%B5%D0%BC%D0%B5%D0%BB%D1%8C%D1%8F_%D0%A7%D0%B8%D0%BA%D0%B5%D0%BD_%D0%9A%D0%B0%D1%80%D1%80%D0%B8_%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF.png";

type startMessageType = {
  img: string;
  caption: string;
};

export const startMessage: startMessageType = {
  img: "https://fileshare.kaverafisha.ru/storage/origin/2025/04/10/__d7a6bd2d292160351712ad784bb5eb02.webp",
  caption: `Приветствую голодного до приключений человека! Для начала ты можешь посмотреть первый выпуск Подземелий Чикен Карри или настроить предпочтения для того, чтобы я подсказал тебе лучший выпуск!\n\nОфициальный телеграм-канал Чикен Карри — @chickencurryshow`,
};

export const helloMesg = `Подземелья Чикен Карри — российское юмористическое шоу на YouTube, где знаменитости играют в фэнтезийную ролевую игру, основанную на Dungeons & Dragons. 

Его авторами являются несравненные Григорий Шатохин и Вадим Серезнёв, а бессменным мастером игры - Александр Бреганов https://t.me/no_roleplaying.

Постоянные участники, всегда выдающие крутую игру - Александр Гудков https://www.instagram.com/gudokgudok/ и Большой Русский Босс https://www.instagram.com/the_boss_hhf/.

<b>Youtube</b> - https://www.youtube.com/@chickencurryshow
<b>VK</b> - https://vkvideo.ru/@chickencurry
<b>Telegram</b> - @chickencurryshow
<b>Inst</b> - https://www.instagram.com/chickencurryshow 
<b>TikTok</b> - https://www.tiktok.com/@chickencurryshow`;

export function episodeMessage(user: userChoiceType, curEp: videoType) {
  return `${
    user.filter === ""
      ? ""
      : `Вы выбрали смотреть ветку ${user.filter} ${
          user.isFiller ? "все выпуски" : "только самые важные"
        }`
  }
  
<b>🎬 Выпуск ${curEp.number}</b>
${curEp.desc}
<b>👥 Участники:</b>
${curEp.members.join(", ")}
<b>🌿 Ветка:</b> ${curEp.branch.join(", ")}
<b>📺 Смотреть:</b> <a href="${curEp.url}">YouTube</a>${
    curEp.vkUrl ? `\n<a href="${curEp.vkUrl}">VK Видео</a>` : ""
  }`;
}
