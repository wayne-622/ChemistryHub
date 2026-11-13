/* 化学式解析与渲染（支持离子电荷 :2-、方括号络合物、电子 e:-） */
(function (root) {
  'use strict';

  var ELEMENTS = new Set(('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn ' +
    'Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu ' +
    'Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm ' +
    'Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split(' '));

  function normalize(s) {
    return String(s || '').replace(/\s+/g, '').replace(/·/g, '*').replace(/−/g, '-');
  }

  /* 电荷后缀："SO4:2-" → 基座 "SO4"、电荷 -2、后缀 "2-"；"OH:-" 电荷 -1 */
  var CHARGE_RE = /^(.*):(\d*)([+-])$/;

  function splitCharge(s) {
    var m = s.match(CHARGE_RE);
    if (!m) return { base: s, charge: 0, suffix: '' };
    var mag = m[2] ? parseInt(m[2], 10) : 1;
    return { base: m[1], charge: m[3] === '+' ? mag : -mag, suffix: m[2] + m[3] };
  }

  function readNumber(s, i) {
    var start = i;
    while (i < s.length && s[i] >= '0' && s[i] <= '9') i++;
    return { value: i > start ? parseInt(s.slice(start, i), 10) : null, next: i };
  }

  /* 解析括号（圆/方）、元素与数字，返回元素计数 */
  function parseGroup(s) {
    var i = 0;

    function walk(stop) {
      var counts = {};
      var order = [];

      function add(src, mult) {
        for (var k in src) {
          counts[k] = (counts[k] || 0) + src[k] * mult;
          if (order.indexOf(k) < 0) order.push(k);
        }
      }

      while (i < s.length) {
        var ch = s[i];
        if (stop && ch === stop) { i++; return { counts: counts, order: order }; }
        if (ch === '(' || ch === '[') {
          var close = ch === '(' ? ')' : ']';
          i++;
          var inner = walk(close);
          if (!inner) return null;
          var num = readNumber(s, i); i = num.next;
          add(inner.counts, num.value || 1);
        } else if (/[A-Z]/.test(ch)) {
          var sym = ch;
          if (i + 1 < s.length && /[a-z]/.test(s[i + 1])) { sym += s[i + 1]; i += 2; }
          else i += 1;
          if (!ELEMENTS.has(sym)) return null;
          var n = readNumber(s, i); i = n.next;
          counts[sym] = (counts[sym] || 0) + (n.value || 1);
          if (order.indexOf(sym) < 0) order.push(sym);
        } else {
          return null;
        }
      }
      return stop ? null : { counts: counts, order: order };
    }

    return walk(null);
  }

  function parse(formula) {
    var s = normalize(formula);
    if (!s) return null;
    var sc = splitCharge(s);
    /* 电子：e / e:- */
    if (/^e$/i.test(sc.base)) {
      return { counts: {}, order: [], charge: sc.charge || -1, electron: true };
    }
    if (!sc.base) return null;
    var segments = sc.base.split('*');
    var total = {}, order = [];
    for (var k = 0; k < segments.length; k++) {
      var seg = segments[k];
      if (!seg) return null;
      var multiplier = 1;
      var lead = seg.match(/^(\d+)(.+)$/);
      if (lead) { multiplier = parseInt(lead[1], 10); seg = lead[2]; }
      var parsed = parseGroup(seg);
      if (!parsed) return null;
      for (var el in parsed.counts) {
        total[el] = (total[el] || 0) + parsed.counts[el] * multiplier;
        if (order.indexOf(el) < 0) order.push(el);
      }
    }
    return { counts: total, order: order, charge: sc.charge };
  }

  /* 去掉查询中化合物前的系数 */
  function stripCoefficient(token) {
    var s = normalize(token);
    return s.replace(/^(\d+)(?=[A-Za-z(\[])/, '');
  }

  /* 元素符号大小写规范化（保留括号、方括号、水合号、数字） */
  function normalizeBase(s) {
    var out = '';
    var i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (ch === '*' || ch === '(' || ch === ')' || ch === '[' || ch === ']' || (ch >= '0' && ch <= '9')) {
        out += ch;
        i++;
        continue;
      }
      if (!/[A-Za-z]/.test(ch)) return null;
      if (/[A-Z]/.test(ch)) {
        var two = ch + (i + 1 < s.length && /[a-z]/.test(s[i + 1]) ? s[i + 1] : '');
        if (two.length === 2 && ELEMENTS.has(two)) { out += two; i += 2; continue; }
        if (ELEMENTS.has(ch)) { out += ch; i += 1; continue; }
        return null;
      }
      var twoLower = ch.toUpperCase() + (i + 1 < s.length && /[a-z]/.test(s[i + 1]) ? s[i + 1] : '');
      if (twoLower.length === 2 && ELEMENTS.has(twoLower) && i + 1 < s.length && /[a-z]/.test(s[i + 1])) {
        out += twoLower; i += 2; continue;
      }
      var oneLower = ch.toUpperCase();
      if (ELEMENTS.has(oneLower)) { out += oneLower; i += 1; continue; }
      return null;
    }
    return out;
  }

  /* 将用户输入规范成标准化学式（离子、络合物、电子均可） */
  function canonical(token) {
    var s = stripCoefficient(token);
    if (!s) return null;
    var sc = splitCharge(s);
    if (/^e$/i.test(sc.base)) return 'e:-';

    if (!sc.suffix) {
      var known = root.Compounds && root.Compounds.find(sc.base);
      if (known) return known.f;
    }

    var base = normalizeBase(sc.base);
    if (!base) return null;
    var full = base + (sc.suffix ? ':' + sc.suffix : '');
    if (!parse(full)) return null;
    return full;
  }

  /* 物种所带电荷数 */
  function chargeOf(formula) {
    var p = parse(formula);
    return p ? (p.charge || 0) : 0;
  }

  function toFraction(x, maxDen) {
    maxDen = maxDen || 12;
    if (Number.isInteger(x)) return { n: x, d: 1 };
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var bestN = 1, bestD = 1, bestErr = Infinity;
    for (var d = 1; d <= maxDen; d++) {
      var n = Math.round(x * d);
      var err = Math.abs(x - n / d);
      if (err < bestErr) { bestErr = err; bestN = n; bestD = d; if (err < 1e-9) break; }
    }
    return { n: sign * bestN, d: bestD };
  }

  /* 氧化数显示：0、+1、-2、+2/3（阿拉伯数字，带正负号） */
  function oxidationLabel(value) {
    if (value === null || value === undefined) return '';
    if (value === 0) return '0';
    var f = toFraction(value);
    var a = String(Math.abs(f.n));
    if (f.d !== 1) a += '/' + f.d;
    return (f.n < 0 ? '-' : '+') + a;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 渲染化学式：元素加粗、数字下标、括号保留、电荷上标 */
  function render(formula, opts) {
    opts = opts || {};
    var s = normalize(formula);
    var sc = splitCharge(s);
    var isElectron = /^e$/i.test(sc.base);
    var out = '';
    var i = 0;
    var segmentStart = true;

    if (isElectron) {
      out += '<span class="el">e</span>';
    } else {
      while (i < sc.base.length) {
        var ch = sc.base[i];
        if (ch === '*') {
          out += '<span class="sep">·</span>';
          i++; segmentStart = true; continue;
        }
        if (ch === '(' || ch === ')' || ch === '[' || ch === ']') {
          out += escapeHtml(ch);
          i++; segmentStart = false; continue;
        }
        if (ch >= '0' && ch <= '9') {
          var start = i;
          while (i < sc.base.length && sc.base[i] >= '0' && sc.base[i] <= '9') i++;
          var num = sc.base.slice(start, i);
          if (segmentStart) out += '<span class="hydrate">' + num + '</span>';
          else out += '<sub>' + num + '</sub>';
          segmentStart = false; continue;
        }
        if (/[A-Za-z]/.test(ch)) {
          var sym = ch;
          if (i + 1 < sc.base.length && /[a-z]/.test(sc.base[i + 1])) { sym += sc.base[i + 1]; i += 2; } else { i++; }
          if (opts.ox && opts.ox[sym] !== undefined) {
            /* 氧化数标注在元素正下方 */
            var dir = opts.oxKind && opts.oxKind[sym];
            var arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '';
            out += '<span class="el-ox' + (dir ? ' ' + dir : '') + '">' +
              '<span class="el" data-el="' + escapeHtml(sym) + '">' + escapeHtml(sym) + '</span>' +
              '<span class="ox">' + oxidationLabel(opts.ox[sym]) + arrow + '</span>' +
              '</span>';
          } else {
            out += '<span class="el" data-el="' + escapeHtml(sym) + '">' + escapeHtml(sym) + '</span>';
          }
          segmentStart = false; continue;
        }
        out += escapeHtml(ch);
        i++;
      }
    }

    if (sc.suffix) {
      var mag = sc.suffix.slice(0, -1);
      var sign = sc.suffix.slice(-1);
      out += '<sup class="charge">' + mag + sign + '</sup>';
    }
    return out;
  }

  /* 渲染一个反应物种（系数 + 化学式 + 状态） */
  function renderSpecies(formula, opts) {
    opts = opts || {};
    var html = '<span class="species">';
    if (opts.coef && opts.coef !== 1) {
      html += '<span class="coef" aria-hidden="true">' + opts.coef + '</span>';
    }
    html += '<span class="formula">' + render(formula, opts) + '</span>';
    if (opts.state) html += '<span class="state" data-st="' + escapeHtml(opts.state) + '">(' + opts.state + ')</span>';
    html += '</span>';
    return html;
  }

  root.Formula = {
    ELEMENTS: ELEMENTS,
    normalize: normalize,
    parse: parse,
    canonical: canonical,
    stripCoefficient: stripCoefficient,
    chargeOf: chargeOf,
    render: render,
    renderSpecies: renderSpecies,
    oxidationLabel: oxidationLabel,
    escapeHtml: escapeHtml
  };
})(typeof window !== 'undefined' ? window : globalThis);
