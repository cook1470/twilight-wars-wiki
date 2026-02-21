export default {
  title: "光暈戰記 Wiki",
  description: "非官方《光暈戰記》純淨知識庫",
  base: '/twilight-wars-wiki/',
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://cook1470.github.io/twilight-wars-wiki/'
  },
  head: [
    ['style', {}, `
      .vp-doc p { 
        text-indent: 2em; 
        margin-top: 1.5em; 
        margin-bottom: 1.5em;
        line-height: 1.8;
      }
      .vp-doc h1, .vp-doc h2, .vp-doc h3, .vp-doc h4, .vp-doc h5, .vp-doc h6 {
        text-indent: 0;
      }
      .vp-doc li p {
        text-indent: 0;
        margin: 0;
      }
      .vp-doc blockquote p {
        text-indent: 0;
      }
    `],
    ['meta', { name: 'keywords', content: '光暈戰記, Twilight Wars, 皇家騎士團, 天影十字軍, 第三勢力, Wiki' }],
    ['meta', { name: 'author', content: 'Cook' }]
  ],
  themeConfig: {
    nav: [
      { text: '首頁', link: '/' },
      { text: '陣營', link: '/lore/factions/skydow-warriors' },
      { text: '人物', link: '/lore/characters/index' },
      { text: '任務', link: '/missions/index' },
      { text: '武裝庫', link: '/armory/melee/index' },
      { text: '貢獻者', link: '/credits' }
    ],
    sidebar: [
      {
        text: '基本資訊',
        items: [
          { text: '首頁', link: '/' },
          { text: '貢獻者名單', link: '/credits' }
        ]
      },
      {
        text: '世界觀與陣營',
        items: [
          { text: '天影十字軍 (Skydow Warriors)', link: '/lore/factions/skydow-warriors' },
          { text: '皇家騎士團 (Royal Knights)', link: '/lore/factions/royal-knights' },
          { text: '第三勢力 (The Third Force)', link: '/lore/factions/the-third-force' },
        ]
      },
      {
        text: '人物誌 (Characters)',
        items: [
          { text: '人物概覽', link: '/lore/characters/index' },
          { text: '天影十字軍人物', link: '/lore/characters/skydow-warriors' },
          { text: '皇家騎士團人物', link: '/lore/characters/royal-knights' },
          { text: '第三勢力人物', link: '/lore/characters/third-force' },
          { text: '中立與平民', link: '/lore/characters/neutral' },
          { text: '其他與生物', link: '/lore/characters/others' }
        ]
      },
      {
        text: '任務模式：天影十字軍',
        collapsed: true,
        items: [
          { text: '第一部：入門教學', link: '/missions/skydow/seasons1/光暈戰記入門教學' },
          { text: '第一部：初影破頂修羅', link: '/missions/skydow/seasons1/初影破頂修羅' },
          { text: '第一部：艾爾瑪的紛亂', link: '/missions/skydow/seasons1/艾爾瑪的紛亂' },
          { text: '第一部：地火靈魂的傳說', link: '/missions/skydow/seasons1/地火靈魂的傳說' },
          { text: '第一部 : 噬魂秘藥', link: '/missions/skydow/seasons1/噬魂秘藥' },
          { text: '第二部：俠影之亂', link: '/missions/skydow/seasons2/俠影之亂' },
          { text: '第二部：風月寶鏡', link: '/missions/skydow/seasons2/風月寶鏡' },
          { text: '第二部：龍魅奇謀', link: '/missions/skydow/seasons2/龍魅奇謀' }
        ]
      },
      {
        text: '任務模式：皇家騎士團',
        collapsed: true,
        items: [
          { text: '第一部：入門教學', link: '/missions/royal/seasons1/光暈戰記入門教學' },
          { text: '第一部：皇家新生訓練', link: '/missions/royal/seasons1/皇家新生訓練' },
          { text: '第一部：阿薩斯危城急報', link: '/missions/royal/seasons1/阿薩斯危城急報' },
          { text: '第一部：冰劍檔案', link: '/missions/royal/seasons1/冰劍檔案' },
          { text: '第一部：紅三角戰役', link: '/missions/royal/seasons1/紅三角戰役' },
          { text: '第二部：重回藍星島', link: '/missions/royal/seasons2/重回藍星島' },
          { text: '第二部：鎮靈騎士', link: '/missions/royal/seasons2/鎮靈騎士' },
          { text: '第二部：赤焰王女', link: '/missions/royal/seasons2/赤焰王女' }
        ]
      },
      {
        text: '任務模式：第三勢力',
        collapsed: true,
        items: [
          { text: '第一部：入門教學', link: '/missions/third/seasons1/光暈戰記入門教學' },
          { text: '第一部：傭兵團資格戰', link: '/missions/third/seasons1/傭兵團資格戰' },
          { text: '第一部：暗殺多倫大公', link: '/missions/third/seasons1/暗殺多倫大公' },
          { text: '第一部：綁架阿曼達博士', link: '/missions/third/seasons1/綁架阿曼達博士' },
          { text: '第一部：黑色追殺令', link: '/missions/third/seasons1/黑色追殺令' },
          { text: '第二部：鬼城懺七', link: '/missions/third/seasons2/鬼城懺七' },
          { text: '第二部：盜體合靈', link: '/missions/third/seasons2/盜體合靈' },
          { text: '第二部：斷魂殘影', link: '/missions/third/seasons2/斷魂殘影' }
        ]
      },
      {
        text: '武裝庫 (Armory)',
        items: [
          { text: '近身武器', link: '/armory/melee/index' },
          { text: '遠程武器', link: '/armory/ranged/index' },
          { text: '傳說武裝 (本靈系列)', link: '/legendary/blades/index' },
          { text: '技能秘笈', link: '/armory/manuals' }
        ]
      },
      {
        text: '道具與裝備 (Items)',
        items: [
          { text: '投擲物與陷阱', link: '/items/throwables/index' },
          { text: '支援道具與藥劑', link: '/items/support/index' },
          { text: '護甲與防具', link: '/items/armor/index' },
          { text: '彈藥與容器', link: '/items/ammo/index' }
        ]
      }
    ]
  }
}
