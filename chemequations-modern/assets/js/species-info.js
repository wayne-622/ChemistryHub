/* 物质详细资料：分类、摩尔质量、元素组成、溶解性、反应角色、收录反应数 */
(function (root) {
  'use strict';

  var F = root.Formula;
  var C = root.Compounds;

  /* 标准相对原子质量（IUPAC，取常用精度） */
  var AW = (function () {
    var raw = 'H:1.008 He:4.0026 Li:6.94 Be:9.0122 B:10.81 C:12.011 N:14.007 O:15.999 ' +
      'F:18.998 Ne:20.180 Na:22.990 Mg:24.305 Al:26.982 Si:28.085 P:30.974 S:32.06 Cl:35.45 ' +
      'Ar:39.948 K:39.098 Ca:40.078 Sc:44.956 Ti:47.867 V:50.942 Cr:51.996 Mn:54.938 Fe:55.845 ' +
      'Co:58.933 Ni:58.693 Cu:63.546 Zn:65.38 Ga:69.723 Ge:72.630 As:74.922 Se:78.971 Br:79.904 ' +
      'Kr:83.798 Rb:85.468 Sr:87.62 Y:88.906 Zr:91.224 Nb:92.906 Mo:95.95 Tc:98 Ru:101.07 ' +
      'Rh:102.91 Pd:106.42 Ag:107.87 Cd:112.41 In:114.82 Sn:118.71 Sb:121.76 Te:127.60 I:126.90 ' +
      'Xe:131.29 Cs:132.91 Ba:137.33 La:138.91 Ce:140.12 Pr:140.91 Nd:144.24 Pm:145 Sm:150.36 ' +
      'Eu:151.96 Gd:157.25 Tb:158.93 Dy:162.50 Ho:164.93 Er:167.26 Tm:168.93 Yb:173.05 Lu:174.97 ' +
      'Hf:178.49 Ta:180.95 W:183.84 Re:186.21 Os:190.23 Ir:192.22 Pt:195.08 Au:196.97 Hg:200.59 ' +
      'Tl:204.38 Pb:207.2 Bi:208.98 Po:209 At:210 Rn:222 Fr:223 Ra:226 Ac:227 Th:232.04 ' +
      'Pa:231.04 U:238.03 Np:237 Pu:244 Am:243 Cm:247 Bk:247 Cf:251 Es:252 Fm:257 Md:258 ' +
      'No:259 Lr:266 Rf:267 Db:268 Sg:269 Bh:270 Hs:277 Mt:278 Ds:281 Rg:282 Cn:285 Nh:286 ' +
      'Fl:289 Mc:290 Lv:293 Ts:294 Og:294';
    var map = {};
    raw.split(' ').forEach(function (t) {
      var kv = t.split(':');
      if (kv.length === 2) map[kv[0]] = parseFloat(kv[1]);
    });
    return map;
  })();

  var PEROXIDES = { H2O2: 1, Na2O2: 1, K2O2: 1, CaO2: 1, BaO2: 1, MgO2: 1, SrO2: 1 };

  /* 摩尔质量与元素组成（全部元素均有原子量时才返回） */
  function molarMass(formula) {
    var p = F.parse(formula);
    if (!p || p.electron) return null;
    var parts = [];
    var total = 0;
    for (var i = 0; i < p.order.length; i++) {
      var el = p.order[i];
      var aw = AW[el];
      if (aw === undefined) return null;
      var n = p.counts[el];
      var mass = aw * n;
      total += mass;
      parts.push({ el: el, count: n, mass: mass });
    }
    if (!parts.length) return null;
    parts.forEach(function (x) { x.fraction = total ? x.mass / total : 0; });
    return { mass: total, parts: parts };
  }

  /* 物质类别：单质 / 酸 / 碱 / 盐 / 氧化物 / 氢化物 / 过氧化物 / 有机物 / 离子 / 电子 */
  function classify(formula, c) {
    var p = F.parse(formula);
    if (!p) return 'other';
    if (p.electron) return 'electron';
    if (p.charge) return 'ion';
    if (c && c.a) return 'acid';
    if (c && c.b) return 'base';
    var els = p.order;
    if (els.length === 1) return 'element';
    if (PEROXIDES[formula]) return 'peroxide';
    if (els.length === 2 && els.indexOf('O') >= 0) return 'oxide';
    if (els.length === 2 && els.indexOf('H') >= 0) return 'hydride';
    if (els.indexOf('C') >= 0 && els.indexOf('H') >= 0) return 'organic';
    return 'salt';
  }

  /* 物质状态：g/l/s/aq */
  function phaseOf(formula, state, c) {
    if (state) return state;
    return c && c.st ? c.st : '';
  }

  /* 溶解性：仅在有依据时给出 */
  function solubility(formula, c, state) {
    if (c && c.ins) return 'insoluble';
    if (state === 'aq') return 'soluble';
    return '';
  }

  /* 别名（中文 + 英文 + Wiki 其他名称），去重 */
  function aliasesOf(formula, c, wiki) {
    var out = [];
    function push(list) {
      (list || []).forEach(function (x) {
        if (x && out.indexOf(x) < 0) out.push(x);
      });
    }
    if (c) { push(c.al); push(c.ae); }
    if (wiki) { push(wiki.others); }
    return out;
  }

  /* 收录反应数：该物质在数据库中出现于多少个反应（惰性索引，只建一次） */
  var countIndex = null;
  function buildIndex() {
    countIndex = {};
    var list = root.Reactions && root.Reactions.list;
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      var seen = {};
      var all = row.r.concat(row.p);
      for (var j = 0; j < all.length; j++) {
        var f = all[j];
        if (seen[f]) continue;
        seen[f] = 1;
        countIndex[f] = (countIndex[f] || 0) + 1;
      }
    }
  }
  function reactionCount(formula) {
    if (!countIndex) buildIndex();
    return countIndex[formula] || 0;
  }

  /* 汇总一个物质在页面上的全部可展示信息 */
  function describe(formula, opts) {
    opts = opts || {};
    var c = C.find(formula) || null;
    var wiki = (root.WikiNames && root.WikiNames[formula]) || null;
    var st = phaseOf(formula, opts.state, c);
    var mm = molarMass(formula);
    return {
      formula: formula,
      compound: c,
      wiki: wiki,
      category: classify(formula, c),
      phase: st,
      molarMass: mm ? mm.mass : null,
      elements: mm ? mm.parts : null,
      oxidation: c && c.ox ? c.ox : null,
      solubility: solubility(formula, c, st),
      appearance: c && c.ap ? c.ap : '',
      aliases: aliasesOf(formula, c, wiki),
      sysName: wiki && wiki.sys ? wiki.sys : '',
      reactionCount: reactionCount(formula)
    };
  }

  root.SpeciesInfo = {
    AW: AW,
    molarMass: molarMass,
    classify: classify,
    describe: describe,
    reactionCount: reactionCount
  };
})(typeof window !== 'undefined' ? window : globalThis);
