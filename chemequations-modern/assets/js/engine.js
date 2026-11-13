/* 查询解析、反应检索与反应类型分析（与原站算法一致） */
(function (root) {
  'use strict';

  var F = root.Formula;
  var C = root.Compounds;
  var B = root.Balancer;

  function key(f) { return String(f).toLowerCase(); }

  function sameMultiset(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    var m = {};
    a.forEach(function (x) { var k = key(x); m[k] = (m[k] || 0) + 1; });
    for (var i = 0; i < b.length; i++) {
      var k2 = key(b[i]);
      if (!m[k2]) return false;
      m[k2]--;
    }
    return true;
  }

  function unique(arr) {
    var seen = {};
    return arr.filter(function (x) { if (seen[key(x)]) return false; seen[key(x)] = true; return true; });
  }

  /* 侧切分：离子电荷中的 + 不是分隔符（Fe:3+、H:+） */
  function splitSide(side) {
    return side.split(/(?<!:\d{0,3})\+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function invalidChar(raw) {
    var s = raw.replace(/->/g, '  ').replace(/→/g, '  ');
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (/[A-Za-z0-9()+=*·.\[\]:\s-]/.test(ch)) continue;
      return ch;
    }
    return null;
  }

  function parseQuery(raw) {
    var s = String(raw || '').trim();
    var bad = invalidChar(s);
    if (bad !== null) return { error: { code: 'badChar', char: bad } };

    var norm = s.replace(/→/g, '->').replace(/·/g, '*').replace(/\./g, '*');
    var eq = norm.indexOf('=');
    var arrow = norm.indexOf('->');
    var sep = -1, sepLen = 0, sepChar = '';
    if (eq >= 0 && (arrow < 0 || eq < arrow)) { sep = eq; sepLen = 1; sepChar = '='; }
    else if (arrow >= 0) { sep = arrow; sepLen = 2; sepChar = '->'; }

    var lhs, rhs;
    if (sep < 0) {
      lhs = norm;
      rhs = '';
    } else {
      lhs = norm.slice(0, sep);
      rhs = norm.slice(sep + sepLen);
      var rest = rhs.replace(/\[/g, '');
      if (rest.indexOf('=') >= 0 || rest.indexOf('->') >= 0) {
        return { error: { code: 'syntax' } };
      }
    }

    if (!lhs.trim()) return { error: { code: 'syntax' } };

    var lhsTokens = splitSide(lhs);
    var rhsTokens = splitSide(rhs);
    var reactants = [], products = [];

    for (var i = 0; i < lhsTokens.length; i++) {
      var token = lhsTokens[i];
      var canonical = F.canonical(token);
      if (!canonical) return { error: { code: 'unknownCompound', token: F.stripCoefficient(token) || token } };
      reactants.push(canonical);
    }
    for (var j = 0; j < rhsTokens.length; j++) {
      var token2 = rhsTokens[j];
      var canonical2 = F.canonical(token2);
      if (!canonical2) return { error: { code: 'unknownCompound', token: F.stripCoefficient(token2) || token2 } };
      products.push(canonical2);
    }

    return {
      raw: s,
      reactants: reactants,
      products: products,
      hasSeparator: sep >= 0,
      sepChar: sepChar,
      hasProducts: products.length > 0
    };
  }

  function compoundOf(f) {
    return C.find(f) || { f: f, zh: f, en: f, st: 's', virtual: true };
  }

  /* 由化学式与电荷推导氧化数（用于未收录物种：MnO4:-、Cr2O7:2-、Cl:- 等） */
  var OX_FIXED = {
    Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1,
    Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2,
    Al: 3, Zn: 2, Ag: 1, F: -1
  };
  var OX_CACHE = {};

  function derivedOx(f) {
    if (f in OX_CACHE) return OX_CACHE[f];
    OX_CACHE[f] = null;
    var p = F.parse(f);
    if (!p || !p.order.length || p.electron) return null;

    var counts = p.counts, order = p.order;
    var charge = p.charge || 0;
    var ox = {}, unknowns = [], sumKnown = 0;

    /* 单原子离子：氧化数即电荷 */
    if (order.length === 1) {
      ox[order[0]] = charge / counts[order[0]];
      OX_CACHE[f] = ox;
      return ox;
    }

    var hasO = counts.O !== undefined, hasH = counts.H !== undefined;
    /* 过氧化物型（金属 + O2，如 BaO2、CaO2）：O 为 -1，避免误判成 O(-2) 产生假氧化还原 */
    var peroxide = counts.O === 2 && order.length === 2 &&
      order.some(function (el) { return el !== 'O' && OX_FIXED[el] !== undefined && el !== 'F'; });
    /* 金属氢化物（NaH、CaH2、NaBH4、LiAlH4）：H 为 -1 */
    var hydride = hasH && !hasO && order.every(function (el) {
      return OX_FIXED[el] !== undefined || el === 'B' || el === 'Al' || el === 'H';
    });

    order.forEach(function (el) {
      if (el === 'O') {
        if (counts.F !== undefined) { unknowns.push(el); return; }
        var ov = peroxide ? -1 : -2;
        ox[el] = ov; sumKnown += ov * counts[el]; return;
      }
      if (el === 'H') {
        if (hydride) { ox[el] = -1; sumKnown += -1 * counts[el]; }
        else { ox[el] = 1; sumKnown += counts[el]; }
        return;
      }
      if (OX_FIXED[el] !== undefined) {
        ox[el] = OX_FIXED[el]; sumKnown += OX_FIXED[el] * counts[el]; return;
      }
      unknowns.push(el);
    });

    if (unknowns.length === 0) {
      /* 全部已知：只有电荷自洽才可用（避免把 H2O2 误判为 H+1/O-2） */
      if (Math.abs(sumKnown - charge) < 1e-9) OX_CACHE[f] = ox;
      return OX_CACHE[f];
    }
    if (unknowns.length !== 1) return null;

    var el = unknowns[0];
    var v = (charge - sumKnown) / counts[el];
    if (!isFinite(v) || v < -4 || v > 8) return null;
    ox[el] = v;
    OX_CACHE[f] = ox;
    return ox;
  }

  function oxOf(f) {
    var c = C.find(f);
    var p = F.parse(f);
    if (!p) return null;
    if (c && c.ox) {
      var ok = true;
      for (var el in p.counts) {
        if (c.ox[el] === undefined) { ok = false; break; }
      }
      if (ok) return c.ox;
    }
    return derivedOx(f);
  }

  /* 惰性配平 + 缓存 */
  var balanceCache = {};
  function balanceFor(r, p) {
    var k = r.join('|') + '=' + p.join('|');
    if (k in balanceCache) return balanceCache[k];
    var coef = B.balance(r, p);
    balanceCache[k] = coef;
    return coef;
  }

  function makeRx(row, coef) {
    var rx = {
      r: row.r.slice(),
      p: row.p.slice(),
      f: row.f || 0,
      aq: row.aq,
      coef: coef,
      nr: row.r.length,
      id: row.id !== undefined ? row.id : null
    };
    /* 行级状态：原站按行存储，全有全无（RowStates 仅收录全已知行） */
    var rowKey = row.r.join('|') + '=' + row.p.join('|');
    var st = root.RowStates ? root.RowStates[rowKey] : null;
    rx.states = st || null;
    rx.showStates = !!st;
    /* 行级条件标注（稀/浓、多量/少量等，来自 data-conditions.js） */
    rx.cond = root.RowConditions ? (root.RowConditions[rowKey] || null) : null;
    rx.eq = eqString(rx, true);
    rx.display = displayString(rx);
    return rx;
  }

  function analyze(rx) {
    var result = {
      acidBase: [],
      redox: null,
      precipitate: [],
      gas: [],
      types: []
    };
    var nr = rx.r.length;
    var states = rx.states;

    var acids = 0, bases = 0;
    rx.r.forEach(function (f) {
      var c = C.find(f);
      if (c && c.a) { result.acidBase.push({ f: f, role: 'acid' }); acids++; }
      if (c && c.b) { result.acidBase.push({ f: f, role: 'base' }); bases++; }
    });
    if (acids && bases) result.types.push('acidBase');
    else result.acidBase = [];

    /* 沉淀/气体块：依赖行级状态数据（原站行为：需水溶液语境） */
    var redox = null, redoxDone = false;
    function redoxOnce() {
      if (!redoxDone) { redox = computeRedox(rx); redoxDone = true; }
      return redox;
    }
    if (states) {
      var aqReactants = [];
      for (var si = 0; si < nr; si++) {
        if (states[si] === 'aq') aqReactants.push(rx.r[si]);
      }
      var aqEls = {};
      aqReactants.forEach(function (f) {
        var p = F.parse(f);
        if (p) Object.keys(p.counts).forEach(function (el) { aqEls[el] = true; });
      });
      rx.p.forEach(function (f, i) {
        var st = states[nr + i];
        if (st === 's' && aqReactants.length) result.precipitate.push(f);
        else if (st === 'g' && f !== 'H2O') result.gas.push(f);
      });
      /* 气体逸出块要求：气体元素来自水溶液反应物，且在氧化还原中存在「被氧化」记录（或反应非氧化还原） */
      if (result.gas.length) {
        result.gas = result.gas.filter(function (f) {
          var p = F.parse(f);
          if (!p) return false;
          var fromAq = Object.keys(p.counts).some(function (el) { return aqEls[el]; });
          if (!fromAq) return false;
          var red = redoxOnce();
          if (!red) return true;
          return red.lines.some(function (ch) { return ch.kind === 'ox' && p.counts[ch.el] !== undefined; });
        });
      }
    }
    if (result.precipitate.length) result.types.push('precipitate');
    if (result.gas.length) result.types.push('gas');

    if (redoxOnce() && redox.lines.length) {
      result.redox = redox;
      result.types.unshift('redox');
    }

    return result;
  }

  /* 按最大余数法把一侧的电子转移量分配为整数，且该侧总和固定为 total */
  function normalizeElectrons(changes, kind, total, rawSum) {
    var list = changes.filter(function (c) { return c.kind === kind; });
    if (!list.length || !(rawSum > 0)) return;
    var acc = 0;
    var parts = list.map(function (c) {
      var exact = c.electrons * total / rawSum;
      var base = Math.floor(exact + 1e-9);
      acc += base;
      return { c: c, base: base, frac: exact - base };
    });
    var left = total - acc;
    parts.slice().sort(function (a, b) { return b.frac - a.frac; }).forEach(function (p) {
      if (left <= 0) return;
      p.base += 1;
      left--;
    });
    /* 每行至少 1 个电子，超出部分从最大行扣回 */
    parts.forEach(function (p) {
      if (p.base < 1) { p.base = 1; }
    });
    var sum = parts.reduce(function (s, p) { return s + p.base; }, 0);
    if (sum !== total) {
      var diff = sum - total;
      var sorted = parts.slice().sort(function (a, b) { return b.base - a.base; });
      for (var i = 0; i < sorted.length && diff !== 0; i++) {
        var d = Math.min(diff, sorted[i].base - 1);
        if (d > 0) { sorted[i].base -= d; diff -= d; }
      }
    }
    parts.forEach(function (p) { p.c.electrons = p.base; });
  }

  function computeRedox(rx) {
    var nr = rx.r.length;
    var coefs = rx.coef;
    var used = [];

    for (var i = 0; i < rx.r.length + rx.p.length; i++) {
      var f = i < nr ? rx.r[i] : rx.p[i - nr];
      var ox = oxOf(f);
      if (!ox) return null;
      used.push({ f: f, ox: ox, coef: coefs ? coefs[i] : 1, parsed: F.parse(f) });
    }

    var oldStates = {}, newStates = {};
    var order = [];
    used.forEach(function (u, idx) {
      var side = idx < nr ? 'old' : 'new';
      var target = side === 'old' ? oldStates : newStates;
      var p = u.parsed;
      p.order.forEach(function (el) {
        if (order.indexOf(el) < 0 && idx < nr) order.push(el);
        var st = u.ox[el];
        var stKey = String(st);
        if (!target[el]) target[el] = {};
        target[el][stKey] = (target[el][stKey] || 0) + p.counts[el] * u.coef;
      });
    });

    var changes = [];
    order.forEach(function (el) {
      var oldMap = oldStates[el] || {};
      var newMap = newStates[el] || {};
      var oldRem = Object.assign({}, oldMap);
      var newRem = Object.assign({}, newMap);
      var st;
      /* 先抵消两侧相同的氧化态；m 为 0 时不能写入，否则 undefined - 0 会生成 NaN 键 */
      for (st in oldMap) {
        var mc = Math.min(oldMap[st], newMap[st] || 0);
        if (mc > 0) {
          oldRem[st] -= mc;
          newRem[st] -= mc;
        }
      }
      for (var os in oldRem) {
        if (!(oldRem[os] > 0)) continue;
        for (var ns in newRem) {
          if (!(newRem[ns] > 0)) continue;
          var atoms = Math.min(oldRem[os], newRem[ns]);
          if (!(atoms > 0)) continue;
          var from = parseFloat(os), to = parseFloat(ns);
          if (!isFinite(from) || !isFinite(to) || from === to) continue;
          var electrons = atoms * Math.abs(to - from);
          if (!(electrons > 0)) continue;
          changes.push({
            el: el,
            from: from,
            to: to,
            atoms: atoms,
            electrons: electrons,
            kind: to > from ? 'ox' : 'red'
          });
          oldRem[os] -= atoms;
          newRem[ns] -= atoms;
        }
      }
    });

    if (!changes.length) return null;

    /* 分数氧化数（Fe3O4、芳烃平均价等）会让逐行取整后失≠得：
       先按原始电子总量定出统一整数总量，再用最大余数法分配到各行 */
    var oxRaw = 0, redRaw = 0;
    changes.forEach(function (c) {
      if (c.kind === 'ox') oxRaw += c.electrons; else redRaw += c.electrons;
    });
    var totalE = Math.round((oxRaw + redRaw) / 2);
    if (totalE > 0) {
      normalizeElectrons(changes, 'ox', totalE, oxRaw);
      normalizeElectrons(changes, 'red', totalE, redRaw);
    }

    var agents = [];
    rx.r.forEach(function (f) {
      var ox = oxOf(f);
      if (!ox) return;
      var roles = [];
      changes.forEach(function (ch) {
        var state = ox[ch.el];
        if (state === undefined) return;
        if (Math.abs(state - ch.from) < 1e-9) {
          if (ch.kind === 'red' && roles.indexOf('oxidizing') < 0) roles.push('oxidizing');
          if (ch.kind === 'ox' && roles.indexOf('reducing') < 0) roles.push('reducing');
        }
      });
      roles.forEach(function (role) { agents.push({ f: f, role: role }); });
    });

    return { lines: changes, agents: agents };
  }

  function eqString(rx, useCoef) {
    var nr = rx.r.length;
    function side(start, end) {
      var out = [];
      for (var i = start; i < end; i++) {
        var f = i < nr ? rx.r[i] : rx.p[i - nr];
        var coef = rx.coef ? rx.coef[i] : 1;
        out.push(useCoef && coef !== 1 ? coef + f : f);
      }
      return out.join(' + ');
    }
    return side(0, nr) + ' = ' + side(nr, nr + rx.p.length);
  }

  function displayString(rx) {
    return eqString(rx, true).replace(' = ', ' → ');
  }

  /* 将物种按用户输入顺序重排（方程页与多解行链接用） */
  function withOrder(rx, queryReactants, queryProducts) {
    var pool = rx.r.slice();
    var idxs = [];
    var newR = queryReactants.map(function (q) {
      var idx = -1;
      for (var i = 0; i < pool.length; i++) {
        if (key(pool[i]) === key(q)) { idx = i; break; }
      }
      if (idx < 0) idx = 0;
      idxs.push(rx.r.indexOf(pool[idx]));
      return pool.splice(idx, 1)[0];
    });
    /* 输入无法覆盖全部反应物时按原顺序补齐索引 */
    for (var ri = idxs.length; ri < rx.r.length; ri++) idxs.push(ri);

    var newP = rx.p.slice();
    var idxsP = [];
    if (queryProducts && queryProducts.length && queryProducts.length === rx.p.length) {
      var poolP = rx.p.slice();
      newP = queryProducts.map(function (q) {
        var idx = -1;
        for (var i2 = 0; i2 < poolP.length; i2++) {
          if (key(poolP[i2]) === key(q)) { idx = i2; break; }
        }
        if (idx < 0) idx = 0;
        idxsP.push(rx.p.indexOf(poolP[idx]));
        return poolP.splice(idx, 1)[0];
      });
    }
    for (var pi = idxsP.length; pi < rx.p.length; pi++) idxsP.push(pi);
    var coefs = newR.map(function (f, i) { return rx.coef ? rx.coef[idxs[i]] : 1; });
    newP.forEach(function (f, i) {
      coefs.push(rx.coef ? rx.coef[rx.nr + idxsP[i]] : 1);
    });
    /* 行状态随物种顺序同步置换 */
    var states = null;
    if (rx.states) {
      states = idxs.map(function (i) { return rx.states[i]; })
        .concat(idxsP.map(function (i) { return rx.states[rx.nr + i]; }));
    }
    var rx2 = {
      r: newR, p: newP, f: rx.f, aq: rx.aq,
      coef: coefs, nr: newR.length,
      states: states,
      showStates: rx.showStates,
      cond: rx.cond || null,
      share: rx.share,
      id: rx.id
    };
    rx2.eq = eqString(rx2, true);
    rx2.display = displayString(rx2);
    return rx2;
  }

  function paginate(rows, offset, limit) {
    offset = Math.max(0, offset || 0);
    limit = limit || 10;
    return {
      limit: limit,
      offset: offset,
      resultCount: rows.length,
      rows: rows.slice(offset, offset + limit)
    };
  }

  /* 初始化：仅建反应物多重集索引（24735 行，毫秒级） */
  function init() {
    this.reactions = root.Reactions.list;
    this.byReactants = {};
    var idx = this.byReactants;
    root.Reactions.list.forEach(function (r, i) {
      /* 稳定编号：用于短链接 ?id=N */
      if (r.id === undefined) r.id = i;
      var k = r.r.map(key).sort().join('+');
      (idx[k] = idx[k] || []).push(i);
    });
    return this.reactions;
  }

  /* 按编号取方程（短链接 ?id=N） */
  function searchById(id) {
    var n = parseInt(id, 10);
    var row = this.reactions ? this.reactions[n] : null;
    if (!row || !isFinite(n)) return { type: 'error', error: { code: 'noResults' }, raw: String(id), byId: true };
    var coef = balanceFor(row.r, row.p);
    if (!coef) return { type: 'error', error: { code: 'noResults' }, raw: String(id), byId: true };
    var rx = makeRx(row, coef);
    return { type: 'equation', reaction: rx, query: { reactants: row.r.slice(), products: [] }, raw: rx.display, byId: true };
  }

  /* 仅反应物查询：多重集匹配 + 频次降序 + 比值 >4 截断 */
  function solutionsFor(reactants) {
    var k = reactants.map(key).sort().join('+');
    var rowIdx = this.byReactants[k] || [];
    var rows = rowIdx.map(function (i) { return this.reactions[i]; }, this);
    /* 份额分母 = 截断前全组频次总和（原站行为） */
    var fullSum = 0;
    rows.forEach(function (row) { fullSum += row.f; });
    /* 相邻比值 prev.f / cur.f > 4 → 截断 */
    var kept = [];
    for (var i = 0; i < rows.length; i++) {
      if (i > 0 && rows[i - 1].f > 4 * rows[i].f) break;
      kept.push(rows[i]);
    }
    /* 转为可显示反应（惰性配平），份额 = f / 全组和 */
    var out = [];
    for (var j = 0; j < kept.length; j++) {
      var row = kept[j];
      var coef = balanceFor(row.r, row.p);
      if (!coef) continue;
      var rx = makeRx(row, coef);
      rx.share = fullSum ? row.f / fullSum * 100 : 0;
      out.push(rx);
    }
    return out;
  }

  function findExact(reactants, products) {
    var k = reactants.map(key).sort().join('+');
    var rowIdx = this.byReactants[k] || [];
    for (var i = 0; i < rowIdx.length; i++) {
      var row = this.reactions[rowIdx[i]];
      if (!sameMultiset(row.p, products)) continue;
      var coef = balanceFor(row.r, row.p);
      if (!coef) continue;
      return makeRx(row, coef);
    }
    return null;
  }

  function synthesize(reactants, products) {
    var coef = balanceFor(reactants, products);
    if (!coef) return null;
    var anyIon = reactants.concat(products).some(function (f) { return F.chargeOf(f) !== 0; });
    return makeRx({ r: reactants, p: products, f: 0, aq: anyIon }, coef);
  }

  function search(raw) {
    if (!raw || !String(raw).trim()) return { type: 'home' };
    var q = parseQuery(raw);
    if (q.error) return { type: 'error', error: q.error, raw: raw };

    /* 单物种、无分隔符 → 化合物页 */
    if (!q.hasProducts && q.reactants.length === 1) {
      var f = q.reactants[0];
      var wiki = root.WikiNames && root.WikiNames[f];
      /* 既无资料收录、又不参与任何反应：视为未收录物质，走「未发现结果」 */
      var known = C.find(f) || wiki;
      var used = root.SpeciesInfo ? root.SpeciesInfo.reactionCount(f) : 0;
      if (!known && !used) return { type: 'error', error: { code: 'noResults' }, raw: raw };
      return { type: 'compound', formula: f, wiki: wiki || null, raw: raw };
    }

    if (!q.hasProducts) {
      /* 仅反应物 → 数据库多重集匹配 */
      var sols = solutionsFor.call(this, q.reactants);
      if (!sols.length) {
        return { type: 'error', error: { code: 'noResults' }, raw: raw };
      }
      if (sols.length === 1) {
        return { type: 'equation', reaction: withOrder(sols[0], q.reactants, q.products), query: q, raw: raw };
      }
      return { type: 'multi', reactants: q.reactants, solutions: sols, query: q, raw: raw };
    }

    /* 带产物：先精确匹配数据库，失败则纯数学配平 */
    var exact = findExact.call(this, q.reactants, q.products);
    if (exact) return { type: 'equation', reaction: withOrder(exact, q.reactants, q.products), query: q, raw: raw };

    var syn = synthesize(q.reactants, q.products);
    if (syn) return { type: 'equation', reaction: syn, query: q, raw: raw, synthetic: true };

    return { type: 'error', error: { code: 'noResults' }, raw: raw };
  }

  /* 相关反应：包含全部指定反应物/产物（方程页侧栏） */
  function related(targets, offset, limit) {
    var rr = (targets.reactants || []).map(key);
    var pp = (targets.products || []).map(key);
    var self = this;
    var rows = this.reactions.filter(function (row) {
      for (var i = 0; i < rr.length; i++) {
        if (!row.r.some(function (f) { return key(f) === rr[i]; })) return false;
      }
      for (var j = 0; j < pp.length; j++) {
        if (!row.p.some(function (f) { return key(f) === pp[j]; })) return false;
      }
      return true;
    }).sort(function (a, b) { return b.f - a.f; });

    var page = paginate(rows, offset, limit);
    page.rows = page.rows.map(function (row) {
      var coef = balanceFor(row.r, row.p);
      return coef ? makeRx(row, coef) : null;
    }).filter(Boolean);
    return page;
  }

  /* 高级搜索 / 按反应物·产物搜索：列出包含全部指定物种的反应 */
  function advanced(targets, offset, limit) {
    var rr = unique(targets.reactants || []).map(key);
    var pp = unique(targets.products || []).map(key);
    var rows = this.reactions.filter(function (row) {
      if (!rr.length && !pp.length) return false;
      for (var i = 0; i < rr.length; i++) {
        if (!row.r.some(function (f) { return key(f) === rr[i]; })) return false;
      }
      for (var j = 0; j < pp.length; j++) {
        if (!row.p.some(function (f) { return key(f) === pp[j]; })) return false;
      }
      return true;
    }).sort(function (a, b) { return b.f - a.f; });

    var page = paginate(rows, offset, limit);
    page.rows = page.rows.map(function (row) {
      var coef = balanceFor(row.r, row.p);
      return coef ? makeRx(row, coef) : null;
    }).filter(Boolean);
    return page;
  }

  root.Engine = {
    init: init,
    search: search,
    searchById: searchById,
    related: related,
    advanced: advanced,
    analyze: analyze,
    solutionsFor: solutionsFor,
    balanceFor: balanceFor,
    withOrder: withOrder,
    eqString: eqString,
    displayString: displayString,
    compoundOf: compoundOf,
    oxOf: oxOf,
    sameMultiset: sameMultiset,
    parseQuery: parseQuery
  };
})(typeof window !== 'undefined' ? window : globalThis);
