/* 元素周期表核心数据（前 36 号 + 常见元素 + 主族） */
/* 用于化合物性质推断引擎 */
(function (root) {
  'use strict';
  var P = {
    /* 格式：符号 → { zh, name, state: g/l/s, appearance, density: g/cm3, mp: °C, bp: °C,
       ox: [常见氧化态], en: 电负性, class: metal/nonmetal/metalloid/noble, periodic: s/p/d/f } */
    H:  { zh: '氢',   name: 'Hydrogen',  state: 'g', appearance: '无色无味气体',          density: 0.00009, mp: -259.1, bp: -252.9, ox: [-1, 1], en: 2.20, class: 'nonmetal' },
    He: { zh: '氦',   name: 'Helium',    state: 'g', appearance: '无色无味惰性气体',      density: 0.00018, mp: -272.2, bp: -268.9, ox: [0],     en: 0,    class: 'noble' },
    Li: { zh: '锂',   name: 'Lithium',   state: 's', appearance: '银白色软金属',          density: 0.53,    mp: 180.5,  bp: 1342,   ox: [1],     en: 0.98, class: 'metal' },
    Be: { zh: '铍',   name: 'Beryllium',  state: 's', appearance: '钢灰色轻金属',          density: 1.85,    mp: 1287,   bp: 2469,   ox: [2],     en: 1.57, class: 'metal' },
    B:  { zh: '硼',   name: 'Boron',     state: 's', appearance: '黑色（无定形）或银灰色晶体', density: 2.34, mp: 2076, bp: 3927, ox: [3], en: 2.04, class: 'metalloid' },
    C:  { zh: '碳',   name: 'Carbon',    state: 's', appearance: '黑色固体（石墨/金刚石）', density: 2.26,    mp: 3550,   bp: 4027,   ox: [-4,2,4],en: 2.55, class: 'nonmetal' },
    N:  { zh: '氮',   name: 'Nitrogen',  state: 'g', appearance: '无色无味气体',          density: 0.00125, mp: -210.0, bp: -195.8, ox: [-3,1,2,3,4,5], en: 3.04, class: 'nonmetal' },
    O:  { zh: '氧',   name: 'Oxygen',    state: 'g', appearance: '无色无味气体',          density: 0.00143, mp: -218.8, bp: -182.9, ox: [-2,-1,2], en: 3.44, class: 'nonmetal' },
    F:  { zh: '氟',   name: 'Fluorine',  state: 'g', appearance: '淡黄色剧毒气体',        density: 0.00170, mp: -219.6, bp: -188.1, ox: [-1],    en: 3.98, class: 'nonmetal' },
    Ne: { zh: '氖',   name: 'Neon',      state: 'g', appearance: '无色惰性气体',          density: 0.00090, mp: -248.6, bp: -246.1, ox: [0],     en: 0,    class: 'noble' },
    Na: { zh: '钠',   name: 'Sodium',    state: 's', appearance: '银白色软金属',          density: 0.97,    mp: 97.7,   bp: 883,    ox: [1],     en: 0.93, class: 'metal' },
    Mg: { zh: '镁',   name: 'Magnesium', state: 's', appearance: '银白色轻金属',          density: 1.74,    mp: 650,    bp: 1090,   ox: [2],     en: 1.31, class: 'metal' },
    Al: { zh: '铝',   name: 'Aluminum',  state: 's', appearance: '银白色轻金属',          density: 2.70,    mp: 660,    bp: 2519,   ox: [3],     en: 1.61, class: 'metal' },
    Si: { zh: '硅',   name: 'Silicon',   state: 's', appearance: '灰黑色有金属光泽晶体',  density: 2.33,    mp: 1414,   bp: 3265,   ox: [-4,4],  en: 1.90, class: 'metalloid' },
    P:  { zh: '磷',   name: 'Phosphorus',state: 's', appearance: '红磷（红棕色）/白磷（白色固体）', density: 1.82, mp: 44.1, bp: 280.5, ox: [-3,3,5], en: 2.19, class: 'nonmetal' },
    S:  { zh: '硫',   name: 'Sulfur',    state: 's', appearance: '淡黄色固体',            density: 2.07,    mp: 115.2,  bp: 444.6,  ox: [-2,2,4,6], en: 2.58, class: 'nonmetal' },
    Cl: { zh: '氯',   name: 'Chlorine',  state: 'g', appearance: '黄绿色有毒气体',        density: 0.00321, mp: -101.5, bp: -34.0,  ox: [-1,1,3,5,7], en: 3.16, class: 'nonmetal' },
    Ar: { zh: '氩',   name: 'Argon',     state: 'g', appearance: '无色惰性气体',          density: 0.00178, mp: -189.3, bp: -185.9, ox: [0],     en: 0,    class: 'noble' },
    K:  { zh: '钾',   name: 'Potassium', state: 's', appearance: '银白色软金属',          density: 0.86,    mp: 63.4,   bp: 759,    ox: [1],     en: 0.82, class: 'metal' },
    Ca: { zh: '钙',   name: 'Calcium',   state: 's', appearance: '银白色金属',            density: 1.55,    mp: 842,    bp: 1484,   ox: [2],     en: 1.00, class: 'metal' },
    Sc: { zh: '钪',   name: 'Scandium',  state: 's', appearance: '银白色金属',            density: 2.99,    mp: 1541,   bp: 2836,   ox: [3],     en: 1.36, class: 'metal' },
    Ti: { zh: '钛',   name: 'Titanium',  state: 's', appearance: '银灰色金属',            density: 4.51,    mp: 1668,   bp: 3287,   ox: [3,4],   en: 1.54, class: 'metal' },
    V:  { zh: '钒',   name: 'Vanadium',  state: 's', appearance: '银灰色金属',            density: 6.11,    mp: 1910,   bp: 3407,   ox: [2,3,4,5], en: 1.63, class: 'metal' },
    Cr: { zh: '铬',   name: 'Chromium',  state: 's', appearance: '银灰色硬金属',          density: 7.15,    mp: 1907,   bp: 2671,   ox: [2,3,6], en: 1.66, class: 'metal' },
    Mn: { zh: '锰',   name: 'Manganese', state: 's', appearance: '银白色脆金属',          density: 7.21,    mp: 1246,   bp: 2061,   ox: [2,3,4,6,7], en: 1.55, class: 'metal' },
    Fe: { zh: '铁',   name: 'Iron',      state: 's', appearance: '银灰色金属',            density: 7.87,    mp: 1538,   bp: 2862,   ox: [2,3],   en: 1.83, class: 'metal' },
    Co: { zh: '钴',   name: 'Cobalt',    state: 's', appearance: '银灰色金属',            density: 8.90,    mp: 1495,   bp: 2927,   ox: [2,3],   en: 1.88, class: 'metal' },
    Ni: { zh: '镍',   name: 'Nickel',    state: 's', appearance: '银白色金属',            density: 8.91,    mp: 1455,   bp: 2913,   ox: [2,3],   en: 1.91, class: 'metal' },
    Cu: { zh: '铜',   name: 'Copper',    state: 's', appearance: '紫红色金属',            density: 8.96,    mp: 1085,   bp: 2562,   ox: [1,2],   en: 1.90, class: 'metal' },
    Zn: { zh: '锌',   name: 'Zinc',      state: 's', appearance: '银白色金属',            density: 7.14,    mp: 419.5,  bp: 907,    ox: [2],     en: 1.65, class: 'metal' },
    Ga: { zh: '镓',   name: 'Gallium',   state: 's', appearance: '银白色软金属',          density: 5.91,    mp: 29.8,   bp: 2204,   ox: [3],     en: 1.81, class: 'metal' },
    Ge: { zh: '锗',   name: 'Germanium', state: 's', appearance: '灰白色有金属光泽晶体',  density: 5.32,    mp: 938.3,  bp: 2833,   ox: [2,4],   en: 2.01, class: 'metalloid' },
    As: { zh: '砷',   name: 'Arsenic',   state: 's', appearance: '灰黑色有金属光泽固体',  density: 5.73,    mp: 817, bp: 614, ox: [-3,3,5], en: 2.18, class: 'metalloid' },
    Se: { zh: '硒',   name: 'Selenium',  state: 's', appearance: '红灰色（灰硒）或红色固体', density: 4.82, mp: 221, bp: 685, ox: [-2,4,6], en: 2.55, class: 'nonmetal' },
    Br: { zh: '溴',   name: 'Bromine',   state: 'l', appearance: '深红棕色发烟液体',      density: 3.10,    mp: -7.2,   bp: 58.8,   ox: [-1,1,3,5,7], en: 2.96, class: 'nonmetal' },
    Kr: { zh: '氪',   name: 'Krypton',   state: 'g', appearance: '无色惰性气体',          density: 0.00374, mp: -157.4, bp: -153.4, ox: [0,2],   en: 3.00, class: 'noble' },
    Rb: { zh: '铷',   name: 'Rubidium',  state: 's', appearance: '银白色软金属',          density: 1.53,    mp: 39.3,   bp: 688,    ox: [1],     en: 0.82, class: 'metal' },
    Sr: { zh: '锶',   name: 'Strontium', state: 's', appearance: '银白色金属',            density: 2.63,    mp: 777,    bp: 1382,   ox: [2],     en: 0.95, class: 'metal' },
    Ag: { zh: '银',   name: 'Silver',    state: 's', appearance: '银白色贵金属',          density: 10.49,   mp: 961.8,  bp: 2162,   ox: [1,2],   en: 1.93, class: 'metal' },
    Cd: { zh: '镉',   name: 'Cadmium',   state: 's', appearance: '银灰色软金属',          density: 8.65,    mp: 321.1,  bp: 767,    ox: [2],     en: 1.69, class: 'metal' },
    Sn: { zh: '锡',   name: 'Tin',       state: 's', appearance: '银白色软金属',          density: 7.31,    mp: 231.9,  bp: 2602,   ox: [2,4],   en: 1.96, class: 'metal' },
    Sb: { zh: '锑',   name: 'Antimony',  state: 's', appearance: '银白色有金属光泽固体',  density: 6.68,    mp: 630.6,  bp: 1587,   ox: [-3,3,5], en: 2.05, class: 'metalloid' },
    I:  { zh: '碘',   name: 'Iodine',    state: 's', appearance: '紫黑色固体，易升华',    density: 4.93,    mp: 113.7,  bp: 184.3,  ox: [-1,1,3,5,7], en: 2.66, class: 'nonmetal' },
    Xe: { zh: '氙',   name: 'Xenon',     state: 'g', appearance: '无色惰性气体',          density: 0.00589, mp: -111.8, bp: -108.1, ox: [0,2,4,6], en: 2.60, class: 'noble' },
    Cs: { zh: '铯',   name: 'Cesium',    state: 's', appearance: '金黄色软金属',          density: 1.87,    mp: 28.4,   bp: 671,    ox: [1],     en: 0.79, class: 'metal' },
    Ba: { zh: '钡',   name: 'Barium',    state: 's', appearance: '银白色金属',            density: 3.62,    mp: 727,    bp: 1897,   ox: [2],     en: 0.89, class: 'metal' },
    Pt: { zh: '铂',   name: 'Platinum',  state: 's', appearance: '银白色贵金属',          density: 21.45,   mp: 1768,   bp: 3825,   ox: [2,4],   en: 2.28, class: 'metal' },
    Au: { zh: '金',   name: 'Gold',      state: 's', appearance: '金黄色贵金属',          density: 19.30,   mp: 1064,   bp: 2856,   ox: [1,3],   en: 2.54, class: 'metal' },
    Pb: { zh: '铅',   name: 'Lead',      state: 's', appearance: '银灰色软金属',          density: 11.34,   mp: 327.5,  bp: 1749,   ox: [2,4],   en: 1.87, class: 'metal' },
    Bi: { zh: '铋',   name: 'Bismuth',   state: 's', appearance: '银白色带粉红光泽金属',  density: 9.78,    mp: 271.4,  bp: 1564,   ox: [3,5],   en: 2.02, class: 'metal' },
    U:  { zh: '铀',   name: 'Uranium',   state: 's', appearance: '银灰色放射性金属',      density: 18.95,   mp: 1135,   bp: 4131,   ox: [3,4,5,6], en: 1.38, class: 'metal' },
    Mo: { zh: '钼',   name: 'Molybdenum',state: 's', appearance: '银灰色金属',            density: 10.22,   mp: 2623,   bp: 4639,   ox: [2,3,4,5,6], en: 2.16, class: 'metal' },
    W:  { zh: '钨',   name: 'Tungsten',  state: 's', appearance: '银灰色金属',            density: 19.30,   mp: 3422,   bp: 5555,   ox: [2,4,5,6], en: 2.36, class: 'metal' },
    Re: { zh: '铼',   name: 'Rhenium',   state: 's', appearance: '银白色金属',            density: 21.02,   mp: 3186,   bp: 5596,   ox: [-1,2,3,4,6,7], en: 1.9, class: 'metal' },
    Zr: { zh: '锆',   name: 'Zirconium', state: 's', appearance: '银灰色金属',            density: 6.52,    mp: 1855,   bp: 4409,   ox: [2,3,4], en: 1.33, class: 'metal' },
    In: { zh: '铟',   name: 'Indium',    state: 's', appearance: '银白色软金属',          density: 7.31,    mp: 156.6,  bp: 2072,   ox: [1,2,3], en: 1.78, class: 'metal' },
    Ta: { zh: '钽',   name: 'Tantalum',  state: 's', appearance: '银白色金属',            density: 16.65,   mp: 3017,   bp: 5458,   ox: [3,4,5], en: 1.5, class: 'metal' },
    Pd: { zh: '钯',   name: 'Palladium', state: 's', appearance: '银白色贵金属',          density: 12.02,   mp: 1554,   bp: 2963,   ox: [0,2,4], en: 2.2, class: 'metal' },
    Tl: { zh: '铊',   name: 'Thallium',  state: 's', appearance: '银白色软金属',          density: 11.85,   mp: 304,    bp: 1473,   ox: [1,3],   en: 1.62, class: 'metal' },
    Te: { zh: '碲',   name: 'Tellurium', state: 's', appearance: '银白色有金属光泽固体',  density: 6.23,    mp: 449.5,  bp: 988,    ox: [-2,4,6],en: 2.1, class: 'metalloid' },
    Y:  { zh: '钇',   name: 'Yttrium',   state: 's', appearance: '银灰色金属',            density: 4.47,    mp: 1522,   bp: 3345,   ox: [3],     en: 1.22, class: 'metal' },
    Ce: { zh: '铈',   name: 'Cerium',    state: 's', appearance: '银灰色金属',            density: 6.77,    mp: 798,    bp: 3443,   ox: [3,4],   en: 1.12, class: 'metal' },
    Ti: { zh: '钛',   name: 'Titanium',  state: 's', appearance: '银灰色金属',            density: 4.51,    mp: 1668,   bp: 3287,   ox: [3,4],   en: 1.54, class: 'metal' },
    V:  { zh: '钒',   name: 'Vanadium',  state: 's', appearance: '银灰色金属',            density: 6.11,    mp: 1910,   bp: 3407,   ox: [2,3,4,5], en: 1.63, class: 'metal' },
    Cr: { zh: '铬',   name: 'Chromium',  state: 's', appearance: '银灰色硬金属',          density: 7.15,    mp: 1907,   bp: 2671,   ox: [2,3,6], en: 1.66, class: 'metal' }
  };

  /* 分类帮助 */
  var ALKALI = { Li:1, Na:1, K:1, Rb:1, Cs:1 };
  var ALK_EARTH = { Be:1, Mg:1, Ca:1, Sr:1, Ba:1 };
  var HALOGENS = { F:1, Cl:1, Br:1, I:1 };
  var NOBLES = { He:1, Ne:1, Ar:1, Kr:1, Xe:1 };

  root.Periodic = { P: P, ALKALI: ALKALI, ALK_EARTH: ALK_EARTH, HALOGENS: HALOGENS, NOBLES: NOBLES };
})(typeof window !== 'undefined' ? window : globalThis);
