export type Tweet = {
  id: string;
  text: string;
};

export type MerchantPosition = {
  id?: number;
  ticker: string;
  direction: "short" | "long";
  size: "small" | "medium" | "large";
  horizon: "8h" | "16h" | "20h";
};

export type VeniceResponse = {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type TweetData = {
  id: string;
  edit_history_tweet_ids: string[];
  text: string;
};

export type MetaData = {
  newest_id: string;
  oldest_id: string;
  result_count: number;
};

export type TwitterSearchResponse = {
  data: TweetData[];
  meta: MetaData;
};
