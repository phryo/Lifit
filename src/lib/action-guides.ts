export const actionGuideGroups = [
  {
    id: "meals",
    title: "食事のアイデア",
    description: "いつもの食卓に取り入れやすいメニュー。",
    items: [
      {
        id: "vegetable-soup",
        title: "野菜たっぷりのスープ",
        description: "にんじん、キャベツ、きのこを使った一品。",
        tag: "おうちごはん",
      },
      {
        id: "tofu-salad",
        title: "豆腐と彩り野菜のサラダ",
        description: "豆腐にトマトや葉野菜を合わせるサラダ。",
        tag: "火を使わない",
      },
      {
        id: "fish-meal",
        title: "焼き魚と小鉢の定食",
        description: "焼き魚、ごはん、野菜の小鉢を組み合わせる食卓。",
        tag: "献立のヒント",
      },
    ],
  },
  {
    id: "exercise",
    title: "運動のアイデア",
    description: "日常のすきま時間に取り入れやすい動き。",
    items: [
      {
        id: "walking",
        title: "近所を歩くウォーキング",
        description: "いつもの道や公園を、自分のペースで歩く。",
        tag: "屋外で",
      },
      {
        id: "shoulder-stretch",
        title: "椅子に座って肩まわりのストレッチ",
        description: "デスクワークの合間に取り入れる動き。",
        tag: "すきま時間に",
      },
      {
        id: "chair-exercise",
        title: "椅子を使った立ち座り運動",
        description: "家の中で取り組める、椅子を使った運動。",
        tag: "おうちで",
      },
    ],
  },
] as const;
