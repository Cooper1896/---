export interface LoreEntry {
  id: string;
  keys: string[];
  content: string;
  constant: boolean;
}

export const builtinLorebook: LoreEntry[] = [
  {
    id: 'new_eridu',
    keys: [],
    content: '背景设定：这里是新艾利都，一座在毁灭世界的灾难“空洞”中幸存下来的奇迹之城。这座城市掌握了与空洞共生的技术，通过开采空洞内的“以太”资源发展出了畸形而繁荣的赛博朋克文明。城市分为安全的街区和危险的外围。',
    constant: true // 始终注入，作为基础世界观
  },
  {
    id: 'hollow',
    keys: ['空洞', 'Hollow', '灾害'],
    content: '空洞设定：空洞是毁灭世界的球状灾害空间，内部空间错乱，伴随强烈的“以太”辐射。普通人进入会迷失并变异为怪物“以骸”。空洞内部存在旧文明的遗迹和珍贵的以太资源。',
    constant: false
  },
  {
    id: 'ether',
    keys: ['以太', 'Ether', '辐射', '变异'],
    content: '以太设定：以太是空洞内特有的物质，既是高价值的能源，也是导致生物变异的致命辐射源。新艾利都的繁荣建立在以太技术的提取和应用上。',
    constant: false
  },
  {
    id: 'proxy',
    keys: ['绳匠', 'Proxy', '法厄同', 'Phaethon'],
    content: '绳匠设定：绳匠是新艾利都的地下职业，他们拥有特殊的“萝卜”（导航数据），能够引导“盗洞客”或代理人在错综复杂的空洞中安全进出。传说中最顶级的绳匠代号为“法厄同”。',
    constant: false
  },
  {
    id: 'bangboo',
    keys: ['邦布', 'Bangboo', '嗯呢'],
    content: '邦布设定：邦布是新艾利都普及的智能小型设备，外形像可爱的吉祥物。它们最初用于协助空洞灾害避难，现在被广泛用于生活辅助、战斗甚至空洞导航。它们通常只能发出“嗯呢”的声音。',
    constant: false
  },
  {
    id: 'cunning_hares',
    keys: ['狡兔屋', '妮可', '安比', '比利', 'Cunning Hares'],
    content: '狡兔屋设定：狡兔屋是一个小型的“万事屋”性质的代理人事务所，由妮可创立。成员包括妮可、安比和比利。他们经常接取各种危险委托，但因为妮可的理财能力极差，事务所始终处于赤字和负债状态。',
    constant: false
  }
];
