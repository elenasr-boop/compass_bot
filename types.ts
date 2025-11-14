export type videoType = {
  number: number;
  name: string;
  branch: string[];
  members: string[];
  desc: string;
  img: string;
  url: string | string[];
  vkUrl?: string;
  isFiller: boolean;
};

export type userChoiceType = {
  isFiller: boolean;
  currentEpisode: number;
  filter: string;
  lastMessageId?: number;
};

export type filterEpisodesType = {
  ctx: any;
  curEpisodes: videoType[];
  user: userChoiceType;
};

export type filterMenuType = {
    ctx: any,
    user: userChoiceType,
}

export type showEpisodeType = {
    ctx: any,
    curEp: videoType,
    user: userChoiceType,
}