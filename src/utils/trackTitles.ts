const titleOverrides: Record<string, string> = {
  "a direction without anyone": "没有人的方向",
  abandon: "任性",
  abscondence: "逃亡",
  "bad weather": "坏天气",
  believe: "相信",
  "can't be with you": "不能和你一起",
  "central zone": "中间地带",
  "cloudy day": "天黑黑",
  difference: "不同",
  "does not bother": "懒得去管",
  drag: "累赘",
  encounter: "遇见",
  fear: "害怕",
  fight: "作战",
  finally: "终于",
  forever: "永远",
  great: "很好",
  "great sensation": "超快感",
  "green light": "绿光",
  "i don't love": "我不爱",
  "i wish": "我想",
  kite: "风筝",
  "leaving you on the sunny monday": "星期一天气晴我离开你",
  lingering: "余波荡漾",
  "love certificate": "爱情证书",
  "love dictionary": "爱情字典",
  "love starts from the beginning": "爱从零开始",
  "make peace": "和平",
  "my desired happiness": "我要的幸福",
  natural: "自然",
  "no time": "没时间",
  "olive tree": "橄榄树",
  "once chance": "难得一见",
  perfect: "零缺点",
  practice: "练习",
  quiz: "随堂测验",
  realize: "开始懂了",
  really: "真的",
  "scultped eyebrow": "浓眉毛",
  "sculpted eyebrow": "浓眉毛",
  sensible: "懂事",
  sky: "天空",
  "straight forward": "直来直往",
  "summer as usual": "一样的夏天",
  "that's the way i am": "我是我",
  "the dark day": "天黑黑",
  "under the sun": "太阳底下",
  willfulness: "任性",
  wink: "眼神",
  "you don't really love me": "不是真的爱我",
  "溫柔 #maydayblue20th (feat.孫燕姿)": "温柔 #MaydayBlue20th (feat.孙燕姿)",
};

const traditionalToSimplified: Record<string, string> = {
  愛: "爱",
  來: "来",
  個: "个",
  們: "们",
  內: "内",
  兩: "两",
  區: "区",
  卻: "却",
  唱: "唱",
  單: "单",
  國: "国",
  圍: "围",
  壞: "坏",
  天: "天",
  姿: "姿",
  專: "专",
  島: "岛",
  幾: "几",
  張: "张",
  彎: "弯",
  後: "后",
  從: "从",
  懷: "怀",
  戀: "恋",
  會: "会",
  極: "极",
  樂: "乐",
  樣: "样",
  機: "机",
  歡: "欢",
  氣: "气",
  淚: "泪",
  測: "测",
  溫: "温",
  漸: "渐",
  漩: "漩",
  漢: "汉",
  為: "为",
  無: "无",
  燕: "燕",
  營: "营",
  當: "当",
  發: "发",
  盪: "荡",
  眾: "众",
  禮: "礼",
  種: "种",
  聽: "听",
  與: "与",
  萬: "万",
  著: "着",
  藝: "艺",
  號: "号",
  裡: "里",
  見: "见",
  記: "记",
  詞: "词",
  說: "说",
  課: "课",
  資: "资",
  較: "较",
  這: "这",
  進: "进",
  過: "过",
  還: "还",
  醜: "丑",
  錯: "错",
  銀: "银",
  鐘: "钟",
  關: "关",
  陰: "阴",
  隱: "隐",
  隨: "随",
  電: "电",
  風: "风",
  飄: "飘",
  體: "体",
  魔: "魔",
};

function simplifyChinese(value: string): string {
  return value.replace(/[\u4e00-\u9fff]/g, (char) => traditionalToSimplified[char] ?? char);
}

function normalizeTitleKey(value: string): string {
  return value
    .replace(/^\s*(\d+-)?\d+\s+/, "")
    .replace(/\s+\(remastered\)$/i, "")
    .replace(/\s+\(feat\.\s*sun jing\)$/i, "")
    .trim()
    .toLowerCase();
}

export function localizeTrackTitle(title: string): string {
  const key = normalizeTitleKey(title);
  const mapped = titleOverrides[key];

  if (mapped) {
    if (/that's the way i am/i.test(title)) {
      return "我是我 (feat. 孙靖)";
    }
    return mapped;
  }

  return simplifyChinese(title);
}
