/* 分子方程式 → 离子方程式转换
 * 规则（中学化学标准）：
 *  - 强酸、强碱、可溶性盐拆为离子；弱酸弱碱、水、氧化物、单质、气体、沉淀保留化学式
 *  - 有行级状态（states）时仅 aq 物种可拆；无状态时按溶解度规则推断，全单质反应不拆
 *  - 微溶物 Ca(OH)2 作反应物（石灰水）可拆，作生成物不拆
 *  - 浓硫酸参与的反应不写离子方程式
 *  - 抵消旁观离子后系数约分为最简整数比，并校验电荷守恒
 */
(function (root) {
  'use strict';

  var F = root.Formula;

  /* 强酸：水溶液中完全电离 */
  var STRONG_ACIDS = {
    HCl: 1, HBr: 1, HI: 1, HNO3: 1, H2SO4: 1,
    HClO4: 1, HClO3: 1, HBrO3: 1, HIO3: 1, HMnO4: 1
  };

  /* 永不拆分的物质（弱电解质/络合分子/水等） */
  var NEVER_SPLIT = {
    H2O: 1, H2O2: 1, NH3: 1, 'NH3*H2O': 1, 'Fe(SCN)3': 1
  };

  /* 阴离子表：base → 电荷（HSO4 为强酸酸式根，拆分后展开为 H+ + SO4） */
  var ANION_DEF = [
    ['Cr2O7', -2], ['S2O3', -2], ['C2O4', -2], ['H2PO4', -1],
    ['MnO4', -1], ['MnO4', -2], ['FeO4', -2],
    ['ClO4', -1], ['ClO3', -1], ['BrO3', -1], ['IO3', -1],
    ['CH3COO', -1], ['HCO3', -1], ['HSO3', -1], ['HSO4', -1],
    ['CO3', -2], ['SO4', -2], ['SO3', -2], ['SiO3', -2], ['CrO4', -2],
    ['HPO4', -2], ['PO4', -3],
    ['NO3', -1], ['NO2', -1],
    ['ClO', -1], ['CN', -1], ['SCN', -1], ['N3', -1],
    ['AlO2', -1], ['ZnO2', -2],
    ['OH', -1], ['F', -1], ['Cl', -1], ['Br', -1], ['I', -1], ['S', -2]
  ];
  var ANIONS = ANION_DEF.map(function (a) {
    var p = F.parse(a[0]);
    return { base: a[0], charge: a[1], counts: p ? p.counts : null };
  }).filter(function (a) { return !!a.counts; });
  /* 长基团优先（Cr2O7 先于 CrO4，S2O3 先于 SO3，HSO4 先于 SO4） */
  ANIONS.sort(function (x, y) {
    if (y.base.length !== x.base.length) return y.base.length - x.base.length;
    return y.charge - x.charge;
  });

  /* 单原子阳离子的可选电荷（多价金属列出常见价） */
  var CATION_CHARGES = {
    H: [1], Li: [1], Na: [1], K: [1], Rb: [1], Cs: [1], Ag: [1], Tl: [1],
    Be: [2], Mg: [2], Ca: [2], Sr: [2], Ba: [2], Ra: [2],
    Zn: [2], Cd: [2], Hg: [1, 2], Pb: [2, 4], Sn: [2, 4],
    Mn: [2], Fe: [2, 3], Co: [2], Ni: [2], Cu: [1, 2], Cr: [2, 3],
    Al: [3], Ga: [3], Bi: [3], Sb: [3, 5], As: [3, 5], La: [3]
  };
  var NH4_COUNTS = { N: 1, H: 4 };

  function subCounts(a, b, n) {
    var out = {};
    for (var k in a) {
      var v = a[k] - (b[k] || 0) * n;
      if (v < 0) return null;
      if (v > 0) out[k] = v;
    }
    return out;
  }

  function isEmpty(o) { for (var k in o) { if (o[k] > 0) return false; } return true; }

  /* 剩余元素 = 单一单原子阳离子 ×m，且 m*z = need */
  function matchMono(rem, need) {
    var keys = [];
    for (var k in rem) { if (rem[k] > 0) keys.push(k); }
    if (!keys.length) return need === 0 ? [] : null;
    if (keys.length !== 1) return null;
    var el = keys[0], m = rem[el];
    var zs = CATION_CHARGES[el];
    if (!zs) return null;
    for (var i = 0; i < zs.length; i++) {
      if (zs[i] * m === need) return [{ base: el, charge: zs[i], m: m }];
    }
    return null;
  }

  /* 剩余元素 = 两种单原子阳离子组合（复盐，如 KAl(SO4)2） */
  function matchPair(rem, need) {
    var keys = [];
    for (var k in rem) { if (rem[k] > 0) keys.push(k); }
    if (keys.length === 0) return need === 0 ? [] : null;
    if (keys.length !== 2) return null;
    var a = keys[0], b = keys[1];
    var za = CATION_CHARGES[a], zb = CATION_CHARGES[b];
    if (!za || !zb) return null;
    for (var i = 0; i < za.length; i++) {
      for (var j = 0; j < zb.length; j++) {
        if (za[i] * rem[a] + zb[j] * rem[b] === need) {
          return [
            { base: a, charge: za[i], m: rem[a] },
            { base: b, charge: zb[j], m: rem[b] }
          ];
        }
      }
    }
    return null;
  }

  /* 阳离子组合匹配：NH4 的倍数 + 单/双金属组合 */
  function matchCations(rem, needPos) {
    for (var m = 0; ; m++) {
      var r2 = m === 0 ? rem : subCounts(rem, NH4_COUNTS, m);
      if (!r2) break;
      var need = needPos - m;
      if (need < 0) break;
      var hit = matchMono(r2, need) || matchPair(r2, need);
      if (hit) {
        return (m ? [{ base: 'NH4', charge: 1, m: m }] : []).concat(hit);
      }
      if (isEmpty(r2)) break;
    }
    return null;
  }

  /* outerCounts 是否为 anionCounts 的整数倍 */
  function multipleOf(outer, inner) {
    var n = null;
    for (var k in outer) {
      if (!inner[k]) return 0;
      var t = outer[k] / inner[k];
      if (t !== Math.floor(t) || t < 1) return 0;
      if (n === null) n = t;
      else if (n !== t) return 0;
    }
    for (var k2 in inner) { if (!outer[k2]) return 0; }
    return n || 0;
  }

  /* 把电中性化合物分解为 阳离子组 + 阴离子组；不可分解返回 null */
  function splitSalt(formula) {
    if (formula.indexOf('*') >= 0) return null; /* 结晶水合物不拆 */

    /* 络合物：[Cu(NH3)4]SO4 → [Cu(NH3)4]:2+ + SO4:2- */
    var lm = formula.match(/^\[([^\]]+)\](.+)$/);
    if (lm) {
      var inner = '[' + lm[1] + ']';
      var oc = F.parse(lm[2]);
      if (!oc || oc.charge !== 0) return null;
      for (var i = 0; i < ANIONS.length; i++) {
        var an = ANIONS[i];
        var n = multipleOf(oc.counts, an.counts);
        if (n) {
          return {
            cations: [{ base: inner, charge: n * (-an.charge), m: 1 }],
            anions: [{ base: an.base, charge: an.charge, m: n }]
          };
        }
      }
      return null;
    }
    if (formula.indexOf('[') >= 0) return null;

    var p = F.parse(formula);
    if (!p || p.charge !== 0) return null;

    for (var i2 = 0; i2 < ANIONS.length; i2++) {
      var an2 = ANIONS[i2];
      var maxN = Infinity;
      for (var el in an2.counts) {
        if (!p.counts[el]) { maxN = 0; break; }
        maxN = Math.min(maxN, Math.floor(p.counts[el] / an2.counts[el]));
      }
      if (maxN === Infinity || maxN <= 0) continue;
      for (var n2 = maxN; n2 >= 1; n2--) {
        var rem = subCounts(p.counts, an2.counts, n2);
        var cats = matchCations(rem, n2 * (-an2.charge));
        if (cats) {
          return { cations: cats, anions: [{ base: an2.base, charge: an2.charge, m: n2 }] };
        }
      }
    }
    return null;
  }

  /* 溶解度规则（中学化学常见范围） */
  function saltSoluble(cats, ans) {
    var allAlkali = cats.every(function (c) {
      return c.base === 'K' || c.base === 'Na' || c.base === 'NH4' || c.base === 'Li';
    });
    if (allAlkali) return true;
    var noBad = function (bad) {
      return cats.every(function (c) { return bad.indexOf(c.base) < 0; });
    };
    return ans.every(function (an) {
      switch (an.base) {
        case 'NO3': case 'NO2': case 'ClO': case 'ClO3': case 'ClO4':
        case 'BrO3': case 'IO3': case 'MnO4': case 'SCN': case 'N3':
          return true;
        case 'HCO3': case 'HSO3': case 'H2PO4': case 'HPO4': case 'HSO4':
          return true; /* 酸式盐大多可溶 */
        case 'CH3COO': return noBad(['Ag']);
        case 'F': return noBad(['Mg', 'Ca', 'Sr', 'Ba', 'Pb', 'Li', 'Al', 'Fe', 'Cr']);
        case 'Cl': return noBad(['Ag', 'Pb', 'Cu', 'Hg', 'Tl']);
        case 'Br': return noBad(['Ag', 'Pb', 'Cu', 'Hg']);
        case 'I': return noBad(['Ag', 'Pb', 'Cu', 'Hg', 'Bi']);
        case 'SO4': return noBad(['Ba', 'Pb', 'Ca', 'Ag', 'Hg', 'Sr']);
        case 'S': return cats.every(function (c) { return ['Mg', 'Ca', 'Sr', 'Ba'].indexOf(c.base) >= 0; });
        case 'OH': return cats.every(function (c) { return ['Ba', 'Sr', 'Ca'].indexOf(c.base) >= 0; });
        case 'CrO4': return noBad(['Ba', 'Pb', 'Ag']);
        case 'Cr2O7': return noBad(['Ba', 'Pb', 'Ag']);
        case 'S2O3': return noBad(['Ba', 'Ag', 'Pb']);
        default: return false; /* CO3/SO3/SiO3/PO4/C2O4 等正盐除碱金属外多难溶 */
      }
    });
  }

  function chargeSuffix(z) {
    var mag = Math.abs(z);
    return ':' + (mag === 1 ? '' : mag) + (z > 0 ? '+' : '-');
  }

  function unit(f, coef) { return [{ f: f, coef: coef }]; }

  /* 拆分单个物种；不可拆时原样返回 */
  function decomposeSpecies(f, coef, side, stEntry) {
    if (NEVER_SPLIT[f]) return unit(f, coef);
    if (f.indexOf(':') >= 0) return unit(f, coef); /* 已是离子 */

    var p0 = F.parse(f);
    if (!p0 || p0.charge !== 0) return unit(f, coef);
    var elems = [];
    for (var k in p0.counts) elems.push(k);
    if (elems.length === 1) return unit(f, coef); /* 单质 */

    /* 有行级状态：仅 aq 可拆（g/s/l 一律保留化学式） */
    if (stEntry && stEntry !== 'aq') return unit(f, coef);
    /* 无状态数据：氧化物保守不拆 */
    if (!stEntry && elems.length === 2 && p0.counts.O) return unit(f, coef);

    var sp = splitSalt(f);
    if (!sp) return unit(f, coef);

    var onlyH = sp.cations.length === 1 && sp.cations[0].base === 'H';
    if (onlyH) {
      if (!STRONG_ACIDS[f]) return unit(f, coef); /* 弱酸不拆 */
    } else if (!saltSoluble(sp.cations, sp.anions)) {
      return unit(f, coef); /* 难溶盐/弱碱不拆 */
    }

    /* 微溶 Ca(OH)2：作生成物不拆 */
    if (f === 'Ca(OH)2' && side === 'p') return unit(f, coef);

    var out = [];
    sp.cations.forEach(function (c) {
      out.push({ f: c.base + chargeSuffix(c.charge), coef: coef * c.m });
    });
    sp.anions.forEach(function (a) {
      if (a.base === 'HSO4') {
        /* 强酸酸式根在水中完全电离 */
        out.push({ f: 'H:+', coef: coef * a.m });
        out.push({ f: 'SO4:2-', coef: coef * a.m });
      } else {
        out.push({ f: a.base + chargeSuffix(a.charge), coef: coef * a.m });
      }
    });
    return out;
  }

  /* 抵消两侧相同离子（旁观离子） */
  function cancelSides(left, right) {
    var accL = {}, accR = {}, i, k;
    for (i = 0; i < left.length; i++) { k = left[i].f; accL[k] = (accL[k] || 0) + left[i].coef; }
    for (i = 0; i < right.length; i++) { k = right[i].f; accR[k] = (accR[k] || 0) + right[i].coef; }
    for (k in accL) {
      if (accR[k]) {
        var m = Math.min(accL[k], accR[k]);
        accL[k] -= m; accR[k] -= m;
      }
    }
    /* 单遍重建：同名物种只保留首次出现位置，系数取聚合值 */
    function rebuild(arr, acc) {
      var seen = {}, out = [];
      for (var i = 0; i < arr.length; i++) {
        var f = arr[i].f;
        if (!seen[f] && acc[f] > 0) {
          seen[f] = true;
          out.push({ f: f, coef: acc[f] });
        }
      }
      return out;
    }
    return { l: rebuild(left, accL), r: rebuild(right, accR) };
  }

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function gcdAll(nums) {
    var g = 0;
    for (var i = 0; i < nums.length; i++) g = gcd(g, nums[i]);
    return g || 1;
  }

  function convert(rx) {
    if (!rx || !rx.r || !rx.p || !rx.coef) return null;
    var all = rx.r.concat(rx.p);
    /* 已含离子物种：本身就是离子方程式 */
    for (var i = 0; i < all.length; i++) {
      if (all[i].indexOf(':') >= 0) return null;
    }
    /* 浓硫酸参与的反应不写离子方程式 */
    if (rx.cond && rx.cond.join(' ').indexOf('浓') >= 0 && rx.r.indexOf('H2SO4') >= 0) return null;
    /* 反应物全为单质：非溶液反应 */
    var allMono = rx.r.every(function (f) {
      var p = F.parse(f);
      return p && p.charge === 0 && Object.keys(p.counts).length === 1;
    });
    if (allMono) return null;
    /* 无权威水溶液标记时的排除：单反应物分解（KMnO4/KClO3/H2O2/CaCO3 受热分解等）不写离子方程式 */
    if (!rx.aq && rx.r.length === 1) return null;

    var nr = rx.r.length;
    var left = [], right = [], changed = false;
    for (var j = 0; j < nr; j++) {
      var d1 = decomposeSpecies(rx.r[j], rx.coef[j], 'r', rx.states ? rx.states[j] : null);
      if (d1.length !== 1 || d1[0].f !== rx.r[j]) changed = true;
      left = left.concat(d1);
    }
    for (var j2 = 0; j2 < rx.p.length; j2++) {
      var d2 = decomposeSpecies(rx.p[j2], rx.coef[nr + j2], 'p', rx.states ? rx.states[nr + j2] : null);
      if (d2.length !== 1 || d2[0].f !== rx.p[j2]) changed = true;
      right = right.concat(d2);
    }
    if (!changed) return null;

    var res = cancelSides(left, right);
    left = res.l; right = res.r;
    if (!left.length || !right.length) return null;

    var g = gcdAll(left.concat(right).map(function (x) { return x.coef; }));
    if (g > 1) {
      left = left.map(function (x) { return { f: x.f, coef: x.coef / g }; });
      right = right.map(function (x) { return { f: x.f, coef: x.coef / g }; });
    }

    /* 电荷守恒校验（理论必过，防御拆分规则缺陷） */
    var q = 0;
    left.forEach(function (x) { q += x.coef * F.chargeOf(x.f); });
    right.forEach(function (x) { q -= x.coef * F.chargeOf(x.f); });
    if (q !== 0) return null;

    return { r: left, p: right };
  }

  var cache = {};
  function convertCached(rx) {
    var k = rx.eq + '|' + (rx.states ? rx.states.join(',') : '');
    if (!(k in cache)) cache[k] = convert(rx);
    return cache[k];
  }

  root.Ionic = { convert: convertCached };
})(typeof window !== 'undefined' ? window : globalThis);
