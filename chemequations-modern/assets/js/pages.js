/* 页面渲染层：将 Engine 返回值转为 DOM 字符串 */
(function (root) {
  'use strict';
  var E = root.Engine;
  var F = root.Formula;
  var C = root.Compounds;
  var T = root.i18n;
  var S = root.SpeciesInfo;

  function h(tag, attrs, html) {
    if (attrs === undefined) attrs = {};
    var a = '';
    Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) return;
      if (attrs[k] === true) { a += ' ' + k; return; }
      a += ' ' + k + '="' + F.escapeHtml(attrs[k]) + '"';
    });
    return '<' + tag + a + '>' + (html === undefined ? '' : html) + '</' + tag + '>';
  }

  function speciesHTML(formula, coef, opts) {
    opts = opts || {};
    var c = C.find(formula);
    var ox = opts.showOx && c && c.ox ? c.ox : null;
    var kinds = {};
    if (ox && opts.changed) {
      Object.keys(ox).forEach(function (el) { if (opts.changed[el]) kinds[el] = opts.changed[el]; });
    }
    return F.renderSpecies(formula, { coef: coef, state: opts.state || '', ox: ox, oxKind: kinds });
  }

  /* 短链接：数据库行用 index.html?id=N，其余退回 index.html?s=...
     必须显式带 index.html，否则在 advanced.html / saved.html 上相对路径不会跳转首页 */
  function homePrefix() {
    return (typeof location !== 'undefined' && /(advanced|saved)\.html$/i.test(location.pathname))
      ? 'index.html' : '';
  }

  function eqHref(rx) {
    var basePath = homePrefix();
    return rx && rx.id !== null && rx.id !== undefined
      ? basePath + '?id=' + rx.id
      : basePath + '?s=' + encodeURIComponent((rx && rx.display) || '');
  }

  function queryHref(q) {
    return homePrefix() + '?s=' + encodeURIComponent(q);
  }

  /* 由氧化还原行生成「元素 → 变化方向」映射 */
  function changeMapOf(redox) {
    var map = {};
    if (!redox) return map;
    redox.lines.forEach(function (ch) { map[ch.el] = ch.kind === 'ox' ? 'up' : 'down'; });
    return map;
  }

  function equationHTML(rx, opts) {
    opts = opts || {};
    var nr = rx.r.length;
    var l, r;
    if (opts.ionicData) {
      /* 离子方程式视图：不带氧化数与状态标注 */
      l = opts.ionicData.r.map(function (x) {
        return F.renderSpecies(x.f, { coef: x.coef });
      }).join('<span class="plus">+</span>');
      r = opts.ionicData.p.map(function (x) {
        return F.renderSpecies(x.f, { coef: x.coef });
      }).join('<span class="plus">+</span>');
    } else {
      var states = rx.states || [];
      var so = { showOx: opts.showOx, changed: opts.changed };
      l = rx.r.map(function (f, i) {
        return speciesHTML(f, rx.coef[i], { state: states[i], showOx: so.showOx, changed: so.changed });
      }).join('<span class="plus">+</span>');
      r = rx.p.map(function (f, i) {
        return speciesHTML(f, rx.coef[nr + i], { state: states[nr + i], showOx: so.showOx, changed: so.changed });
      }).join('<span class="plus">+</span>');
    }
    return h('div', { class: 'equation-main' },
      h('div', { class: 'eq-side eq-lhs' }, l) +
      '<span class="eq-arrow" aria-hidden="true">→</span>' +
      h('div', { class: 'eq-side eq-rhs' }, r)
    );
  }

  function linkToEq(rx, label) {
    return h('a', { href: eqHref(rx), class: 'eq-link' }, label);
  }

  /* 行级条件徽章：稀/浓、多量/少量等（data-conditions.js 提供） */
  function condBadgesHTML(rx) {
    if (!rx || !rx.cond || !rx.cond.length) return '';
    return h('span', { class: 'cond-badges' }, rx.cond.map(function (c) {
      return h('span', { class: 'cond-badge' }, F.escapeHtml(c));
    }).join(''));
  }

  function compoundLinkHTML(formula, zhOnly) {
    var c = C.find(formula);
    var label = zhOnly ? (c && c.zh) || formula : formula;
    return h('a', { href: queryHref(formula), class: 'cmp-link' }, label);
  }

  /* ----- 酸碱 ----- */
  function renderAcidBaseBlock(rx, rq) {
    var parts = [];
    rq.forEach(function (item) {
      var c = C.find(item.f);
      var label = h('em', {}, compoundLinkHTML(item.f, true));
      var role = item.role === 'acid' ? T.t('acidBaseNeutralizeA') || '酸' : (T.t('acidBaseNeutralizeB') || '碱');
      parts.push(label + ' 是<strong>' + role + '</strong>');
    });
    var sentence = T.t('acidBaseNeutralize') + ' ' + parts.join(', ') + '.';
    return h('div', { class: 'block block-acidbase' },
      h('h3', {}, T.t('acidBaseTitle')) + h('p', { class: 'lead' }, sentence)
    );
  }

  /* ----- 氧化还原 ----- */
  function renderRedoxBlock(rx, redox) {
    var items = redox.lines.map(function (ch) {
      var up = ch.kind === 'ox';
      var detail = up
        ? T.render(T.t('electronLoss'), { n: ch.electrons })
        : T.render(T.t('electronGain'), { n: ch.electrons });
      return h('div', { class: 'redox-item ' + (up ? 'up' : 'down') },
        h('span', { class: 'rx-el' }, ch.el) +
        h('span', { class: 'rx-flow' },
          h('span', { class: 'rx-state' }, F.oxidationLabel(ch.from)) +
          h('span', { class: 'rx-arrow' }, up ? '↑' : '↓') +
          h('span', { class: 'rx-state' }, F.oxidationLabel(ch.to))
        ) +
        h('span', { class: 'rx-meta' }, T.render(T.t('atomsCount'), { n: ch.atoms })) +
        h('span', { class: 'rx-e' }, detail) +
        h('span', { class: 'rx-badge' }, up ? T.t('oxidized') : T.t('reduced'))
      );
    }).join('');

    var agentsHTML = '';
    if (redox.agents.length) {
      var chips = redox.agents.map(function (a) {
        var oxid = a.role === 'oxidizing';
        return h('span', { class: 'agent-chip ' + (oxid ? 'oxidizing' : 'reducing') },
          compoundLinkHTML(a.f, true) +
          h('span', { class: 'agent-role' }, oxid ? T.t('oxidizingAgent') : T.t('reducingAgent'))
        );
      }).join('');
      agentsHTML = h('div', { class: 'agent-row' }, chips);
    }
    return h('div', { class: 'block block-redox' },
      h('h3', {}, T.t('redoxTitle')) +
      h('p', { class: 'lead' }, T.render(T.t('redoxIntro'))) +
      h('div', { class: 'redox-list' }, items) +
      agentsHTML
    );
  }

  /* ----- 沉淀 ----- */
  function renderPrecipitateBlock(fs) {
    var names = fs.map(function (f) { return compoundLinkHTML(f, true); });
    return h('div', { class: 'block block-precipitate' },
      h('h3', {}, T.t('precipitateTitle')) +
      h('p', {}, T.render(T.t('precipitateIntro')) + ' ' + names.map(function (n) {
        return T.render(T.t('precipitateX'), { name: n });
      }).join(' ') + ' ')
    );
  }

  /* ----- 气体 ----- */
  function renderGasBlock(fs) {
    var names = fs.map(function (f) { return compoundLinkHTML(f, true); });
    return h('div', { class: 'block block-gas' },
      h('h3', {}, T.t('gasTitle')) +
      h('p', {}, T.render(T.t('gasIntro')) + ' ' + names.map(function (n) {
        return T.render(T.t('gasX'), { name: n });
      }).join(' ') + ' ')
    );
  }

  /* ----- 物质详细解析 ----- */
  function propRow(label, value) {
    return h('div', { class: 'sc-prop' },
      h('dt', {}, label) + h('dd', {}, value)
    );
  }

  var CAT_LABELS = {
    element: 'catElement', acid: 'catAcid', base: 'catBase', salt: 'catSalt',
    oxide: 'catOxide', hydride: 'catHydride', peroxide: 'catPeroxide',
    organic: 'catOrganic', ion: 'catIon', electron: 'catElectron', other: 'catOther'
  };
  var PHASE_LABELS = { g: 'phaseGas', l: 'phaseLiquid', s: 'phaseSolid', aq: 'phaseAq' };
  var ROLE_LABELS = {
    acid: 'roleAcid', base: 'roleBase', oxidizing: 'oxidizingAgent',
    reducing: 'reducingAgent', precipitate: 'rolePrecipitate', gas: 'roleGas'
  };

  function compositionHTML(elements) {
    if (!elements || !elements.length) return '';
    return elements.map(function (e) {
      var count = e.count > 1 ? '<sub>' + e.count + '</sub>' : '';
      return h('span', { class: 'cmp-item' },
        h('span', { class: 'cmp-el' }, e.el + count) +
        h('span', { class: 'cmp-pct' }, (e.fraction * 100).toFixed(2) + '%')
      );
    }).join('');
  }

  function oxidationHTML(info, changed) {
    if (!info.oxidation) return '';
    return Object.keys(info.oxidation).map(function (el) {
      var ch = changed && changed[el];
      var dir = ch ? (ch.kind === 'ox' ? 'up' : 'down') : '';
      var flow = ch
        ? F.oxidationLabel(ch.from) + ' → ' + F.oxidationLabel(ch.to)
        : F.oxidationLabel(info.oxidation[el]);
      return h('span', { class: 'ox-chip' + (dir ? ' ' + dir : '') },
        h('span', { class: 'chip-el' }, el) +
        h('span', { class: 'chip-flow' }, flow) +
        (ch ? h('span', { class: 'chip-dir' }, dir === 'up' ? '↑' : '↓') : '')
      );
    }).join('');
  }

  function roleChipsHTML(formula, analysis) {
    var roles = [];
    function add(r) { if (roles.indexOf(r) < 0) roles.push(r); }
    if (analysis) {
      analysis.acidBase.forEach(function (it) { if (it.f === formula) add(it.role); });
      if (analysis.redox) {
        analysis.redox.agents.forEach(function (a) { if (a.f === formula) add(a.role); });
      }
      if (analysis.precipitate.indexOf(formula) >= 0) add('precipitate');
      if (analysis.gas.indexOf(formula) >= 0) add('gas');
    }
    if (!roles.length) return h('span', { class: 'muted' }, '—');
    return roles.map(function (r) {
      return h('span', { class: 'role-chip ' + r }, T.t(ROLE_LABELS[r]) || r);
    }).join('');
  }

  /* ----- 物种卡片（反应物/产物列表） ----- */
  function renderSpeciesList(title, formulas, coefs, offset, showOx, states, redox, analysis) {
    var items = formulas.map(function (f, i) {
      var coef = coefs ? coefs[offset + i] : 1;
      var st = states ? (states[offset + i] || '') : '';
      var info = S.describe(f, { state: st });
      var c = info.compound;
      var zh = c ? (c.zh || f) : f;
      var wiki = root.WikiNames && root.WikiNames[f];
      if (wiki && wiki.zh) zh = wiki.zh;
      var en = c ? (c.en || f) : f;

      /* 价态变化：只标记本物种内真正发生变化的元素 */
      var changed = {};
      if (redox) {
        var pf = F.parse(f);
        redox.lines.forEach(function (ch) {
          if (pf && pf.counts[ch.el] !== undefined) changed[ch.el] = ch;
        });
      }

      var rows = [];
      rows.push(propRow(T.t('category'),
        h('span', { class: 'sc-tag cat-' + info.category }, T.t(CAT_LABELS[info.category] || 'catOther'))));
      if (info.phase) {
        rows.push(propRow(T.t('phase'),
          h('span', { class: 'sc-tag' }, T.t(PHASE_LABELS[info.phase] || '') || info.phase)));
      }
      if (info.molarMass !== null) {
        rows.push(propRow(T.t('molarMass'),
          h('span', { class: 'val-strong' }, info.molarMass.toFixed(2) + ' g/mol')));
      }
      if (info.elements && info.elements.length) {
        rows.push(propRow(T.t('composition'), h('span', { class: 'cmp-wrap' }, compositionHTML(info.elements))));
      }
      if (info.oxidation && (showOx || Object.keys(changed).length)) {
        rows.push(propRow(T.t('oxidationNumbers'), h('span', { class: 'ox-chips' }, oxidationHTML(info, changed))));
      }
      if (info.solubility) {
        rows.push(propRow(T.t('solubility'),
          info.solubility === 'insoluble' ? T.t('insoluble') : T.t('soluble')));
      }
      if (info.appearance) rows.push(propRow(T.t('appearance'), info.appearance));
      if (info.aliases.length) rows.push(propRow(T.t('otherNames'), info.aliases.join('、')));
      rows.push(propRow(T.t('reactionRole'), h('span', { class: 'role-chips' }, roleChipsHTML(f, analysis))));
      rows.push(propRow(T.t('relatedCount'),
        h('a', { class: 'sc-more', href: queryHref(f) }, info.reactionCount + ' ' + T.t('reactionsUnit') + ' →')));

      return h('li', { class: 'species-card' + (Object.keys(changed).length ? ' is-changed' : '') },
        h('div', { class: 'sc-head' },
          h('div', { class: 'sc-formula' }, F.renderSpecies(f, { coef: coef, state: st })) +
          h('div', { class: 'sc-names' },
            h('div', { class: 'sc-zh' }, zh) +
            h('div', { class: 'sc-en' }, en)
          )
        ) +
        h('dl', { class: 'sc-props' }, rows.join(''))
      );
    }).join('');
    return h('section', { class: 'species-list' },
      h('h2', {}, title) + h('ul', { class: 'species-grid' }, items)
    );
  }

  /* 分页页码窗口：首尾页 + 当前页附近，支持任意多页 */
  function pageItems(current, totalPages) {
    var items = [];
    if (totalPages <= 9) {
      for (var i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    items.push(1);
    var start = Math.max(2, current - 2);
    var end = Math.min(totalPages - 1, current + 2);
    if (start > 2) items.push('…');
    for (var j = start; j <= end; j++) items.push(j);
    if (end < totalPages - 1) items.push('…');
    items.push(totalPages);
    return items;
  }

  /* ----- 相关反应（分页） ----- */
  function renderRelatedBox(targets, kind, title, limit, offset) {
    limit = limit || 10;
    offset = offset || 0;
    var data = E.related(targets, offset, limit);
    if (!data.rows.length) return '';
    var rows = data.rows.map(function (rx, i) {
      return h('li', {},
        h('span', { class: 'idx' }, data.offset + i + 1) +
        linkToEq(rx, F.escapeHtml(rx.display)) +
        condBadgesHTML(rx)
      );
    }).join('');

    var total = data.resultCount;
    var pages = Math.ceil(total / limit);
    var currentPage = Math.floor(offset / limit) + 1;
    var pagination = '';
    if (pages > 1) {
      var pgs = [];
      pageItems(currentPage, pages).forEach(function (p) {
        if (p === '…') { pgs.push(h('li', { class: 'dots' }, h('span', {}, '…'))); return; }
        pgs.push(h('li', { class: p === currentPage ? 'active' : '' },
          h('a', { href: '#', 'data-offset': (p - 1) * limit, 'data-kind': kind }, p)));
      });
      pagination = h('ul', { class: 'pagination' }, pgs.join(''));
    }

    return h('section', { class: 'related-box', 'data-kind': kind },
      h('h3', {}, title) +
      h('ol', { class: 'related-list' }, rows) +
      pagination
    );
  }

  /* ----- 收藏与历史独立页面：两列卡片列表 + 页面内搜索 ----- */
  function savedCard(label, q, removeAttr) {
    var attrs = { type: 'button', class: 'saved-del', title: '✕', 'aria-label': '✕' };
    attrs[removeAttr] = q;
    return h('li', { class: 'saved-card' },
      h('a', { class: 'saved-link', href: queryHref(q) }, F.escapeHtml(label)) +
      h('button', attrs, '✕')
    );
  }

  function renderSavedBody(tab, q) {
    var needle = String(q || '').trim().toLowerCase();
    function match(s) { return !needle || String(s).toLowerCase().indexOf(needle) >= 0; }

    if (tab === 'fav') {
      var favs = root.Favorites ? root.Favorites.list() : [];
      var shown = favs.filter(function (it) { return match(it.display || it.q); });
      return h('div', { class: 'saved-body', id: 'saved-body' },
        h('div', { class: 'saved-toolbar' },
          h('span', { class: 'saved-count' }, shown.length + ' / ' + favs.length + ' ' + T.t('shelfUnit')) +
          (favs.length ? h('button', { type: 'button', class: 'saved-clear', 'data-fav-clear': '1' }, T.t('favClear')) : '')
        ) +
        (shown.length
          ? h('ul', { class: 'saved-grid' }, shown.map(function (it) {
              return savedCard(it.display || it.q, it.q, 'data-fav-remove');
            }).join(''))
          : h('p', { class: 'saved-empty' }, needle ? T.t('savedNoMatch') : T.t('shelfEmptyFav')))
      );
    }

    var hist = root.SearchHistory ? root.SearchHistory.list() : [];
    var shownH = hist.filter(match);
    return h('div', { class: 'saved-body', id: 'saved-body' },
      h('div', { class: 'saved-toolbar' },
        h('span', { class: 'saved-count' }, shownH.length + ' / ' + hist.length + ' ' + T.t('shelfUnit')) +
        (hist.length ? h('button', { type: 'button', class: 'saved-clear', 'data-history-clear': '1' }, T.t('historyClear')) : '')
      ) +
      (shownH.length
        ? h('ul', { class: 'saved-grid' }, shownH.map(function (s) {
            return savedCard(s, s, 'data-history-remove');
          }).join(''))
        : h('p', { class: 'saved-empty' }, needle ? T.t('savedNoMatch') : T.t('shelfEmptyHistory')))
    );
  }

  function renderSavedPage(tab, q) {
    tab = tab === 'fav' ? 'fav' : 'history';
    q = q || '';
    var hist = root.SearchHistory ? root.SearchHistory.list() : [];
    var favs = root.Favorites ? root.Favorites.list() : [];

    function tabLink(kind, label, count) {
      return h('a', {
        class: 'saved-tab' + (tab === kind ? ' is-active' : ''),
        href: 'saved.html?tab=' + kind,
        'data-saved-tab': kind
      }, label + (count ? ' (' + count + ')' : ''));
    }

    return h('section', { class: 'saved-page' },
      h('div', { class: 'saved-head' },
        h('h1', {}, '★ ' + T.t('savedTitle')) +
        h('p', { class: 'saved-sub' }, T.t('savedSub'))
      ) +
      h('div', { class: 'saved-bar' },
        h('div', { class: 'saved-tabs' },
          tabLink('history', '🕘 ' + T.t('historyTitle'), hist.length) +
          tabLink('fav', '★ ' + T.t('favTitle'), favs.length)
        ) +
        h('div', { class: 'saved-search' },
          h('span', { class: 'search-field' },
            h('input', {
              id: 'saved-q', type: 'text', autocomplete: 'off', spellcheck: 'false',
              placeholder: T.t('savedSearchPlaceholder'), value: q
            }) +
            h('button', { type: 'button', class: 'search-clear', 'data-saved-clear-q': '1', hidden: q ? null : true }, '✕')
          )
        )
      ) +
      renderSavedBody(tab, q)
    );
  }

  /* 收藏按钮（方程式结果页） */
  function favQuery(rx) {
    return rx.r.join(' + ') + ' = ' + rx.p.join(' + ');
  }

  function renderFavButton(rx) {
    var q = favQuery(rx);
    var on = !!(root.Favorites && root.Favorites.has(q));
    return h('button', {
      type: 'button',
      class: 'btn btn-fav' + (on ? ' is-fav' : ''),
      'data-fav-toggle': '',
      'data-fav-q': q,
      'data-fav-display': rx.display,
      'data-fav-id': rx.id !== null && rx.id !== undefined ? rx.id : null
    }, (on ? '★ ' : '☆ ') + (on ? T.t('favAdded') : T.t('favAdd')));
  }

  function renderHome() {
    var b = T.t('brand');
    var parts = String(b).split(' ');
    var first = parts.shift() || '';
    var rest = parts.join(' ');
    function chipsFor(list) {
      return (list || []).map(function (ex) {
        return h('a', { class: 'chip', href: queryHref(ex) }, F.escapeHtml(ex));
      }).join('');
    }
    return h('section', { class: 'hero' },
      h('span', { class: 'hero-rule', 'aria-hidden': 'true' }, '') +
      h('h1', {},
        h('span', { class: 't-solid' }, F.escapeHtml(first)) +
        (rest ? h('span', { class: 't-hollow' }, ' ' + F.escapeHtml(rest)) : '')
      ) +
      h('form', {
        class: 'hero-search',
        role: 'search',
        onsubmit: "if(this.s.value.trim()){location.href='index.html?s='+encodeURIComponent(this.s.value.trim());return false;}"
      },
        h('span', { class: 'search-field' },
          h('input', {
            id: 'hero-q', name: 's', type: 'text', autocomplete: 'off', spellcheck: 'false',
            'data-ac': 'true', placeholder: T.t('searchPlaceholder')
          }, '') +
          h('button', {
            type: 'button', class: 'search-clear',
            'aria-label': T.t('clearSearch'), title: T.t('clearSearch'), hidden: true
          }, '✕')
        ) +
        h('button', { type: 'submit' }, '🔍 ' + T.t('search'))
      ) +
      h('p', { class: 'hero-hint' }, T.t('heroHint')) +
      h('p', { class: 'hero-tip' }, T.t('examplesTitle')) +
      h('div', { class: 'hero-cols' },
        h('div', { class: 'hero-col' },
          h('h2', { class: 'hero-col-title' }, T.t('examplesEq')) +
          h('div', { class: 'chips' }, chipsFor(T.t('examples'), 'eq'))
        ) +
        h('div', { class: 'hero-col' },
          h('h2', { class: 'hero-col-title' }, T.t('examplesSubstance')) +
          h('div', { class: 'chips' }, chipsFor(T.t('substances'), 'sub'))
        )
      )
    );
  }

  /* ----- 方程式结果页 ----- */
  function renderEquation(rx, state) {
    state = state || { showOx: false };
    var analysis = E.analyze(rx);
    var changed = changeMapOf(analysis.redox);
    /* 离子方程式：可转换时才提供开关 */
    var ionicAvail = root.Ionic ? !!root.Ionic.convert(rx) : false;
    var ionicData = (state.ionic && ionicAvail) ? root.Ionic.convert(rx) : null;
    var blocks = '';
    if (analysis.acidBase.length) blocks += renderAcidBaseBlock(rx, analysis.acidBase);
    if (analysis.redox) blocks += renderRedoxBlock(rx, analysis.redox);
    if (analysis.precipitate.length) blocks += renderPrecipitateBlock(analysis.precipitate);
    if (analysis.gas.length) blocks += renderGasBlock(analysis.gas);

    // 相关反应
    var nr = rx.r.length;
    var relatedL = renderRelatedBox({ reactants: rx.r, products: [] }, 'r', T.t('relatedReactants'));
    var relatedP = renderRelatedBox({ reactants: [], products: rx.p }, 'p', T.t('relatedProducts'));
    var relatedB = renderRelatedBox({ reactants: rx.r, products: rx.p }, 'rp', T.t('relatedBoth'));

    var showOxToggle = h('label', { class: 'toggle-ox' },
      h('input', { type: 'checkbox', 'data-toggle-ox': '', checked: state.showOx ? true : null }) +
      h('span', {}, state.showOx ? T.t('oxidationHide') : T.t('oxidationShow'))
    );

    var ionicToggle = ionicAvail ? h('label', { class: 'toggle-ox toggle-ionic' },
      h('input', { type: 'checkbox', 'data-toggle-ionic': '', checked: state.ionic ? true : null }) +
      h('span', {}, state.ionic ? T.t('ionicHide') : T.t('ionicShow'))
    ) : '';

    var idBadge = rx.id !== null && rx.id !== undefined
      ? h('span', { class: 'id-badge', title: T.t('equationId') }, '#' + rx.id)
      : '';

    return h('section', { class: 'result-header' },
      h('div', { class: 'eq-large-wrap' }, equationHTML(rx, { showOx: state.showOx && !ionicData, changed: changed, ionicData: ionicData })) +
      h('div', { class: 'meta-row' },
        idBadge +
        condBadgesHTML(rx) +
        showOxToggle +
        ionicToggle +
        renderFavButton(rx) +
        h('button', { class: 'btn btn-link', 'data-copy': '', 'data-id': rx.id !== null && rx.id !== undefined ? rx.id : null, 'data-raw': rx.display }, '🔗 ' + T.t('copyLink'))
      )
    ) +
    (blocks ? h('section', { class: 'analysis-blocks' }, blocks) : '') +
    h('div', { class: 'species-wrap' },
      renderSpeciesList(T.t('reactants'), rx.r, rx.coef, 0, state.showOx, rx.states, analysis.redox, analysis) +
      renderSpeciesList(T.t('products'), rx.p, rx.coef, nr, state.showOx, rx.states, analysis.redox, analysis)
    ) +
    (relatedL || relatedP || relatedB ? h('section', { class: 'related-grid' }, relatedL + relatedP + relatedB) : '');
  }

  /* ----- 多解（与原站一致：caption + 份额分数 + 渐隐行） ----- */
  function renderMulti(reactants, sols) {
    var lhs = reactants.map(function (f) { return F.renderSpecies(f, {}); }).join('<span class="plus">+</span>');
    var rows = sols.map(function (rx) {
      var ordered = E.withOrder(rx, reactants);
      var share = rx.share || 0;
      var opacity = Math.min(1, 0.4 + 0.006 * share);
      var fontSize = 95 + 0.1 * share;
      var s10 = Math.round(share * 10) / 10;
      var scoreTxt = s10 === 0 ? '0' : s10.toFixed(1);
      var inner = ordered.r.map(function (f, k) {
        return F.renderSpecies(f, { coef: ordered.coef[k] });
      }).join('<span class="plus">+</span>') +
        '<span class="eq-arrow" aria-hidden="true">→</span>' +
        ordered.p.map(function (f, k) {
          return F.renderSpecies(f, { coef: ordered.coef[ordered.nr + k] });
        }).join('<span class="plus">+</span>');
      return h('tr', { style: 'opacity:' + opacity + ';font-size:' + fontSize + '%' },
        h('td', { class: 'idx' }, h('small', {}, '›')) +
        h('td', {}, h('a', { href: eqHref(rx), class: 'eq-link' }, inner) + condBadgesHTML(rx)) +
        h('td', { class: 'score' }, h('small', {}, scoreTxt))
      );
    }).join('');
    return h('section', { class: 'multi' },
      h('div', { class: 'eq-large-wrap' }, lhs + '<span class="eq-arrow" aria-hidden="true">→</span><span class="q-mark">?</span>') +
      h('table', { class: 'table-multi' },
        h('caption', {}, T.t('moreSolutions')) +
        h('thead', {}, h('tr', {},
          h('th', {}, '') + h('th', {}, T.t('equationCol') || '方程式') + h('th', {}, T.t('score') || '分数'))) +
        h('tbody', {}, rows))
    );
  }

  /* ----- 化合物（与原站一致：有名称显示名称面板，否则未发现结果；均附相关反应） ----- */
  /* 化合物属性行（化合物页与未收录物质共用） */
  function compoundPropRows(info) {
    var rows = [];
    rows.push(propRow(T.t('category'),
      h('span', { class: 'sc-tag cat-' + info.category }, T.t(CAT_LABELS[info.category] || 'catOther'))));
    if (info.phase) {
      rows.push(propRow(T.t('phase'), h('span', { class: 'sc-tag' }, T.t(PHASE_LABELS[info.phase] || '') || info.phase)));
    }
    if (info.molarMass !== null) {
      rows.push(propRow(T.t('molarMass'), h('span', { class: 'val-strong' }, info.molarMass.toFixed(2) + ' g/mol')));
    }
    if (info.elements && info.elements.length) {
      rows.push(propRow(T.t('composition'), h('span', { class: 'cmp-wrap' }, compositionHTML(info.elements))));
    }
    if (info.oxidation) {
      rows.push(propRow(T.t('oxidationNumbers'), h('span', { class: 'ox-chips' }, oxidationHTML(info, {}))));
    }
    if (info.solubility) {
      rows.push(propRow(T.t('solubility'),
        info.solubility === 'insoluble' ? T.t('insoluble') : T.t('soluble')));
    }
    if (info.appearance) rows.push(propRow(T.t('appearance'), info.appearance));
    if (info.aliases.length) rows.push(propRow(T.t('otherNames'), info.aliases.join('、')));
    rows.push(propRow(T.t('relatedCount'), info.reactionCount + ' ' + T.t('reactionsUnit')));
    return rows;
  }

  /* ----- 漂白性说明（data-bleach.js 提供） ----- */
  /* ----- 物质百科卡片（对齐截图样式：类别标签 + 中文名 + 化学式 + 物理性质 + 化学性质） ----- */
  function renderEncyclopediaCard(formula) {
    var E = root.Encyclopedia;
    if (!E) return '';
    var e = E.get(formula);
    if (!e) return '';
    var c = C.find(formula);
    var wiki = (root.WikiNames && root.WikiNames[formula]) || null;
    var zh = (c && c.zh) || (wiki && wiki.zh) || formula;
    var category = '';
    if (c) {
      if (c.a && c.b) category = '两性物质';
      else if (c.a) category = '酸';
      else if (c.b) category = '碱';
      else if (c.ins) category = '沉淀';
      else {
        var cat = S.classify(formula, c);
        category = T.t(CAT_LABELS[cat] || 'catOther') || '';
      }
    }
    var p = F.parse(formula);
    if (!category && p) {
      if (p.order.length === 1) category = '单质';
      else if (p.electron) category = '电子';
      else if (p.charge) category = '离子';
      else category = '化合物';
    }
    var catTag = category ? h('span', { class: 'ency-category' }, F.escapeHtml(category)) : '';
    var subtitle = h('span', { class: 'ency-subtitle' }, F.render(formula));
    var levelTag = e.lv ? h('span', { class: 'ency-level' }, F.escapeHtml(e.lv)) : '';
    function row(label, text) {
      if (!text) return '';
      return h('div', { class: 'ency-row' },
        h('div', { class: 'ency-label' }, label) +
        h('div', { class: 'ency-text' }, F.escapeHtml(text))
      );
    }
    var tipsHTML = '';
    if (e.tips && e.tips.length) {
      tipsHTML = h('div', { class: 'ency-row' },
        h('div', { class: 'ency-label' }, '学习要点') +
        h('ul', { class: 'ency-tips' }, e.tips.map(function (t) {
          return h('li', {}, F.escapeHtml(t));
        }).join(''))
      );
    }
    return h('section', { class: 'ency-card' },
      h('div', { class: 'ency-header' },
        catTag +
        h('h2', { class: 'ency-name' }, F.escapeHtml(zh)) +
        subtitle +
        levelTag
      ) +
      h('div', { class: 'ency-body' },
        row('概述', e.ov) +
        row('物理性质', e.phys || '暂无资料。') +
        row('化学性质', e.chem || '暂无资料。') +
        row('制备方法', e.prep) +
        row('主要用途', e.use) +
        row('安全与储存', e.safe) +
        tipsHTML +
        row('大学拓展', e.ext) +
        row('反应收录', e.stats)
      )
    );
  }

  function renderBleachBlock(formula) {
    var B = root.BleachInfo && root.BleachInfo[formula];
    if (!B) return '';
    var items = (B.items || []).map(function (it) {
      return h('li', {}, F.escapeHtml(it));
    }).join('');
    return h('section', { class: 'block block-bleach' },
      h('h3', {}, T.t('bleachTitle')) +
      h('p', { class: 'lead' },
        h('span', { class: 'bleach-tag' }, F.escapeHtml(B.label)) +
        ' ' + F.escapeHtml(B.note)
      ) +
      h('ul', { class: 'bleach-items' }, items) +
      (B.warn ? h('p', { class: 'bleach-warn' }, '⚠ ' + F.escapeHtml(B.warn)) : '')
    );
  }

  function renderCompound(formula, wiki) {
    wiki = wiki || (root.WikiNames && root.WikiNames[formula]) || null;
    var info = S.describe(formula);
    var c = info.compound;
    var zn = c ? (c.zh || '') : '';
    var en = c ? (c.en || '') : '';
    var forms = root.SpeciesForms ? root.SpeciesForms.others(formula) : [];
    var canon = root.SpeciesForms ? root.SpeciesForms.canonical(formula) : formula;
    var formsHTML = forms.length
      ? h('div', { class: 'form-alias' },
        h('span', { class: 'form-alias-label' }, '同种物质的其他写法：') +
        forms.map(function (f) {
          return h('a', {
            class: 'form-chip' + (f === canon ? ' form-chip-main' : ''),
            href: queryHref(f),
            title: f === canon ? '标准写法' : '查看该写法'
          }, F.render(f));
        }).join('')
      )
      : '';

    var head = h('section', { class: 'compound' + (wiki ? '' : ' compound-plain') },
      h('div', { class: 'eq-large-wrap' },
        h('span', { class: 'species' },
          h('span', { class: 'formula' }, F.render(formula))
        )
      ) +
      h('div', { class: 'compound-meta' },
        (zn ? h('h1', {}, zn) : '') +
        (en ? h('div', { class: 'en-name' }, en) : '') +
        (wiki ? h('ul', { class: 'name-list' },
          (wiki.sys ? h('li', {}, T.t('systemName') + ': ' + h('em', {}, wiki.sys)) : '') +
          (wiki.others && wiki.others.length
            ? h('li', {}, T.t('otherNames') + ': ' + wiki.others.map(function (o) { return h('em', {}, o); }).join(', '))
            : '')
        ) : '') +
        formsHTML +
        h('dl', { class: 'sc-props compound-props' }, compoundPropRows(info).join(''))
      )
    );

    var relR = renderRelatedBox({ reactants: [formula], products: [] }, 'r', T.t('relatedReactants'));
    var relP = renderRelatedBox({ reactants: [], products: [formula] }, 'p', T.t('relatedProducts'));
    var rels = relR + relP;

    /* 未收录该物质的独立资料：不再报错，改为给出相似/相关结果 */
    var bleachBlock = renderBleachBlock(formula);
    var encCard = renderEncyclopediaCard(formula);
    if (!wiki) {
      if (!rels) {
        return encCard + bleachBlock + head + h('section', { class: 'empty-results' },
          h('h2', {}, T.t('noSimilarResults')) +
          h('p', { class: 'muted' }, T.t('noSimilarResultsHint'))
        );
      }
      return encCard + bleachBlock + head + h('section', { class: 'similar-results' },
        h('div', { class: 'similar-head' },
          h('h2', {}, T.t('similarResults')) +
          h('p', { class: 'muted' }, T.t('similarResultsHint'))
        ) +
        h('div', { class: 'related-grid' }, rels)
      );
    }
    return encCard + bleachBlock + head + (rels ? h('section', { class: 'related-grid' }, rels) : '');
  }

  /* ----- 错误 ----- */
  function renderError(err, raw) {
    var title = T.t('errorTitle');
    var body = '';
    var canCustom = false;
    switch (err && err.code) {
      case 'badChar':
        body = h('p', {}, T.t('errorBadChar') + ': ' + h('code', {}, F.escapeHtml(err.char)) + '.') + h('p', {}, T.t('errorBadCharHint'));
        break;
      case 'syntax':
        body = h('p', {}, T.t('errorSyntax') + '.') + h('p', {}, T.t('errorSyntaxHint'));
        break;
      case 'unknownCompound':
        body = h('p', {}, T.t('errorUnknownCompound') + ': ' + h('strong', {}, F.escapeHtml(err.token || '')) + '.') + h('p', {}, T.t('errorUnknownCompoundHint'));
        break;
      case 'noResults':
        body = h('p', {}, T.t('errorNoResults') + '.') + h('p', {}, T.t('errorNoResultsHint'));
        canCustom = true;
        break;
      default:
        body = h('p', {}, 'Unknown error');
    }
    var actions = h('a', { class: 'btn btn-primary', href: 'index.html' }, '← ' + T.t('backHome'));
    /* 搜不出结果时：提供「添加到自定义搜索」入口，把搜索词带到高级搜索页预填 */
    if (canCustom && raw) {
      actions += ' ' + h('a', { class: 'btn btn-ghost', href: 'advanced.html?r=' + encodeURIComponent(raw) }, '＋ ' + T.t('addToAdvanced'));
    }
    return h('section', { class: 'error-box' },
      h('h2', {}, '⚠️ ' + title) + body +
      h('div', { class: 'actions' }, actions)
    );
  }

  /* ----- 高级搜索 ----- */
  function renderAdvancedForm() {
    return h('section', { class: 'advanced' },
      h('h1', {}, T.t('advancedTitle')) +
      h('p', { class: 'muted' }, T.t('advancedHint')) +
      h('form', { id: 'adv-form', class: 'adv-form' },
        h('div', { class: 'adv-col' },
          h('label', {}, T.t('reactantsIncl')) +
          h('div', { class: 'adv-rows', 'data-kind': 'r' },
            h('div', { class: 'adv-row' },
              h('input', { class: 'adv-input', name: 'reactant', type: 'text', placeholder: T.t('reactantPlaceholders') }) +
              h('button', { type: 'button', class: 'adv-del', disabled: '' }, '✕')) +
            h('div', { class: 'adv-row' },
              h('input', { class: 'adv-input', name: 'reactant', type: 'text', placeholder: T.t('reactantPlaceholders') }) +
              h('button', { type: 'button', class: 'adv-del', disabled: '' }, '✕'))
          ) +
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-add': 'r' }, '＋ ' + T.t('addReactant'))
        ) +
        h('div', { class: 'adv-col' },
          h('label', {}, T.t('productsIncl')) +
          h('div', { class: 'adv-rows', 'data-kind': 'p' },
            h('div', { class: 'adv-row' },
              h('input', { class: 'adv-input', name: 'product', type: 'text', placeholder: T.t('productPlaceholders') }) +
              h('button', { type: 'button', class: 'adv-del', disabled: '' }, '✕'))
          ) +
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-add': 'p' }, '＋ ' + T.t('addProduct'))
        ) +
        h('div', { class: 'adv-submit' }, h('button', { type: 'submit', class: 'btn btn-primary' }, '🔍 ' + T.t('searchButton')))
      ) +
      h('div', { id: 'adv-result' }, '')
    );
  }

  function renderAdvancedResult(data) {
    if (!data || !data.rows.length) {
      return h('p', { class: 'muted' }, T.t('noRelated') + '.');
    }
    var rows = data.rows.map(function (rx, i) {
      return h('tr', {},
        h('td', { class: 'idx' }, data.offset + i + 1) +
        h('td', {}, h('a', { href: eqHref(rx), class: 'eq-link' }, F.escapeHtml(rx.display)))
      );
    }).join('');

    var total = data.resultCount;
    var limit = data.limit;
    var pages = Math.ceil(total / limit);
    var currentPage = Math.floor(data.offset / limit) + 1;
    var pagination = '';
    if (pages > 1) {
      var pgs = [];
      pageItems(currentPage, pages).forEach(function (p) {
        if (p === '…') { pgs.push(h('li', { class: 'dots' }, h('span', {}, '…'))); return; }
        pgs.push(h('li', { class: p === currentPage ? 'active' : '' },
          h('a', { href: '#', 'data-page': (p - 1) * limit }, p)));
      });
      pagination = h('ul', { class: 'pagination' }, pgs.join(''));
    }

    return h('div', { class: 'adv-result-wrap' },
      h('table', { class: 'table-multi' },
        h('thead', {}, h('tr', {}, h('th', {}, '#') + h('th', {}, T.t('solutionsPlural')))) +
        h('tbody', {}, rows)
      ) + pagination +
      h('p', { class: 'muted' }, total + ' / ' + (T.t('page') || '') + ' ' + currentPage)
    );
  }

  root.Pages = {
    h: h, equationHTML: equationHTML,
    renderHome: renderHome,
    renderEquation: renderEquation,
    renderMulti: renderMulti,
    renderCompound: renderCompound,
    renderError: renderError,
    renderRelatedBox: renderRelatedBox,
    renderAdvancedForm: renderAdvancedForm,
    renderAdvancedResult: renderAdvancedResult,
    renderSavedPage: renderSavedPage,
    renderSavedBody: renderSavedBody
  };
})(typeof window !== 'undefined' ? window : globalThis);
