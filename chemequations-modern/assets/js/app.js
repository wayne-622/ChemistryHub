/* 入口：路由、状态、事件绑定 */
(function (root) {
  'use strict';
  var E = root.Engine;
  var T = root.i18n;
  var P = root.Pages;
  var F = root.Formula;
  var A = root.Autocomplete;

  var state = {
    showOx: false,
    ionic: false,        /* 离子方程式视图 */
    lastSearch: '',
    savedTab: 'history', /* 收藏与历史页当前标签 */
    savedQuery: ''       /* 收藏与历史页列表内搜索词 */
  };

  /* 查询结果缓存：翻页/切换氧化数时避免重复解析与匹配 */
  var cache = { raw: null, result: null };
  function searchCached(raw) {
    if (cache.raw === raw) return cache.result;
    var r = E.search(raw);
    cache.raw = raw;
    cache.result = r;
    return r;
  }

  function renderHome() {
    document.title = T.t('brand');
    document.body.classList.add('is-home');
    mount('main', P.renderHome());
    initHeroSearch();
  }

  function mount(selector, html) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = html;
    el.classList.add('fade-in');
  }

  function runQuery(raw) {
    raw = String(raw || '').trim();
    if (!raw) { renderHome(); bindGlobal(); return; }

    var result = searchCached(raw);
    showResult(result, raw);
  }

  function runById(id) {
    var result = E.searchById(id);
    showResult(result, result.raw !== undefined ? result.raw : String(id));
  }

  /* 统一渲染 + 写入地址栏（数据库方程优先使用 ?id=N 短链接） */
  function showResult(result, raw) {
    state.lastSearch = raw;

    /* 记录搜索历史（首页不算） */
    if (result.type !== 'home' && raw && root.SearchHistory) {
      root.SearchHistory.add(raw);
      updateHeaderBadges();
    }

    try {
      var url = new URL(window.location.href);
      url.search = '';
      var pathname = url.pathname;
      /* 如果当前在 advanced.html，替换 URL 也要回到 index.html */
      if (/advanced\.html$/i.test(pathname)) {
        pathname = pathname.replace(/advanced\.html$/i, 'index.html');
      }
      var target = pathname;
      if (result.type === 'equation' && result.reaction.id !== null && result.reaction.id !== undefined) {
        target += '?id=' + result.reaction.id;
      } else if (result.type !== 'home') {
        target += '?s=' + encodeURIComponent(raw);
      }
      window.history.replaceState({}, '', target);
    } catch (e) {}

    var qEl = document.getElementById('q');
    if (qEl && raw) {
      qEl.value = raw;
      qEl.dispatchEvent(new Event('input'));
    }

    if (result.type === 'home') { renderHome(); bindGlobal(); return; }

    document.body.classList.remove('is-home');

    document.title = raw + ' — ' + T.t('brand');

    if (result.type === 'error') mount('main', P.renderError(result.error, result.raw));
    else if (result.type === 'compound') mount('main', P.renderCompound(result.formula, result.wiki));
    else if (result.type === 'multi') mount('main', P.renderMulti(result.reactants, result.solutions));
    else if (result.type === 'equation') mount('main', P.renderEquation(result.reaction, { showOx: state.showOx, ionic: state.ionic }));
    addBackHome();
    bindGlobal();
    bindResult();
  }

  /* 结果页顶部插入「回到首页」入口 */
  function addBackHome() {
    var mainEl = document.getElementById('main');
    if (!mainEl || mainEl.querySelector('.back-home-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'back-home-bar';
    var a = document.createElement('a');
    a.className = 'back-home';
    a.href = 'index.html';
    a.textContent = '← ' + T.t('backHome');
    bar.appendChild(a);
    mainEl.insertBefore(bar, mainEl.firstChild);
  }

  function initHeaderSearch() {
    var q = document.getElementById('q');
    if (!q) return;
    // 填回 query param
    try {
      var url = new URL(window.location.href);
      var s = url.searchParams.get('s');
      if (s) q.value = s;
    } catch (e) {}
    A.setup(q);

    // 清空按钮：有内容时显示
    var clearBtn = q.form ? q.form.querySelector('.search-clear') : document.querySelector('.search-clear');
    if (clearBtn) {
      var syncClear = function () { clearBtn.hidden = !q.value; };
      q.addEventListener('input', syncClear);
      clearBtn.addEventListener('click', function () {
        q.value = '';
        syncClear();
        q.focus();
      });
      syncClear();
    }
  }

  function initHeroSearch() {
    var q = document.getElementById('hero-q');
    if (!q || q.dataset.bound === '1') return;
    q.dataset.bound = '1';
    A.setup(q);
    var clearBtn = q.form ? q.form.querySelector('.search-clear') : null;
    if (!clearBtn) return;
    var syncClear = function () { clearBtn.hidden = !q.value; };
    q.addEventListener('input', syncClear);
    clearBtn.addEventListener('click', function () {
      q.value = '';
      syncClear();
      q.focus();
    });
    syncClear();
  }

  /* 顶栏入口按钮上的计数徽标 */
  function setBadge(id, n) {
    var el = document.getElementById(id);
    if (!el) return;
    if (n > 0) {
      el.textContent = n > 99 ? '99+' : String(n);
      el.hidden = false;
    } else {
      el.textContent = '';
      el.hidden = true;
    }
  }

  function updateHeaderBadges() {
    setBadge('hd-hist-count', root.SearchHistory ? root.SearchHistory.list().length : 0);
    setBadge('hd-fav-count', root.Favorites ? root.Favorites.list().length : 0);
  }

  /* 结果页收藏按钮：document 级委托，只绑一次 */
  var favToggleBound = false;
  function bindFavToggle() {
    if (favToggleBound || !root.Favorites) return;
    favToggleBound = true;
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var tg = e.target.closest('[data-fav-toggle]');
      if (!tg) return;
      e.preventDefault();
      var idRaw = tg.getAttribute('data-fav-id');
      var on = root.Favorites.toggle({
        q: tg.getAttribute('data-fav-q'),
        display: tg.getAttribute('data-fav-display'),
        id: idRaw === null || idRaw === '' ? null : parseInt(idRaw, 10)
      });
      tg.classList.toggle('is-fav', on);
      tg.textContent = (on ? '★ ' : '☆ ') + (on ? T.t('favAdded') : T.t('favAdd'));
      updateHeaderBadges();
    });
  }

  /* ----- 收藏与历史独立页面 ----- */
  function renderSaved() {
    var tab = 'history', q = '';
    try {
      var url = new URL(window.location.href);
      var t = url.searchParams.get('tab');
      if (t === 'fav' || t === 'history') tab = t;
      q = url.searchParams.get('q') || '';
    } catch (e) {}
    state.savedTab = tab;
    state.savedQuery = q;
    document.title = T.t('savedTitle') + ' · ' + T.t('brand');
    mount('main', P.renderSavedPage(tab, q));
    syncSavedUrl();
  }

  function syncSavedUrl() {
    try {
      var u = new URL(window.location.href);
      var target = u.pathname + '?tab=' + state.savedTab +
        (state.savedQuery ? '&q=' + encodeURIComponent(state.savedQuery) : '');
      window.history.replaceState({}, '', target);
    } catch (e) {}
  }

  /* 只重渲染列表，保留搜索框焦点 */
  function rerenderSavedBody() {
    var body = document.getElementById('saved-body');
    if (!body) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = P.renderSavedBody(state.savedTab, state.savedQuery);
    var next = tmp.firstElementChild;
    if (next) body.parentNode.replaceChild(next, body);
  }

  var savedBound = false;
  function bindSaved() {
    if (savedBound) return;
    savedBound = true;

    /* 列表内搜索 */
    document.addEventListener('input', function (e) {
      if (!e.target || e.target.id !== 'saved-q') return;
      state.savedQuery = e.target.value;
      var clearBtn = document.querySelector('[data-saved-clear-q]');
      if (clearBtn) clearBtn.hidden = !e.target.value;
      rerenderSavedBody();
      syncSavedUrl();
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;

      /* 切换标签 */
      var tab = e.target.closest('[data-saved-tab]');
      if (tab) {
        e.preventDefault();
        var kind = tab.getAttribute('data-saved-tab');
        if (kind === state.savedTab) return;
        state.savedTab = kind;
        state.savedQuery = '';
        var mainEl = document.getElementById('main');
        if (mainEl) mainEl.innerHTML = P.renderSavedPage(kind, '');
        syncSavedUrl();
        return;
      }

      /* 清空搜索框 */
      var clrQ = e.target.closest('[data-saved-clear-q]');
      if (clrQ) {
        e.preventDefault();
        var input = document.getElementById('saved-q');
        if (input) { input.value = ''; input.focus(); }
        state.savedQuery = '';
        clrQ.hidden = true;
        rerenderSavedBody();
        syncSavedUrl();
        return;
      }

      /* 删除单条 / 清空全部 */
      var hDel = e.target.closest('[data-history-remove]');
      var hClr = e.target.closest('[data-history-clear]');
      var fDel = e.target.closest('[data-fav-remove]');
      var fClr = e.target.closest('[data-fav-clear]');
      if (!hDel && !hClr && !fDel && !fClr) return;
      e.preventDefault();
      if (hDel) root.SearchHistory.remove(hDel.getAttribute('data-history-remove'));
      else if (hClr) root.SearchHistory.clear();
      else if (fDel) root.Favorites.remove(fDel.getAttribute('data-fav-remove'));
      else if (fClr) root.Favorites.clear();
      /* 删除后同步更新标签上的计数 */
      var mainEl2 = document.getElementById('main');
      if (mainEl2) mainEl2.innerHTML = P.renderSavedPage(state.savedTab, state.savedQuery);
      var q2 = document.getElementById('saved-q');
      if (q2) q2.value = state.savedQuery;
      updateHeaderBadges();
    });
  }

  function bindGlobal() {
    // 复制短链接
    document.querySelectorAll('[data-copy]').forEach(function (el) {
      if (el.dataset.bound === '1') return;
      el.dataset.bound = '1';
      el.addEventListener('click', function () {
        var id = el.dataset.id;
        var base = location.href.split('#')[0].split('?')[0];
        var text;
        if (id !== undefined && id !== '') {
          text = base + '?id=' + id;
        } else {
          text = base + '?s=' + encodeURIComponent(el.dataset.raw || '');
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        var prev = el.dataset.label || el.textContent;
        el.dataset.label = prev;
        el.textContent = '✓ ' + T.t('copied');
        setTimeout(function () { el.textContent = prev; }, 1500);
      });
    });
  }

  /* 根据当前查询推导相关反应的分页目标物种 */
  function targetsFor(kind) {
    var result = searchCached(state.lastSearch);
    if (!result) return { reactants: [], products: [] };
    var rs = [], ps = [];
    if (result.type === 'equation') { rs = result.reaction.r; ps = result.reaction.p; }
    else if (result.type === 'compound') {
      if (kind === 'p') ps = [result.formula]; else rs = [result.formula];
    } else return { reactants: [], products: [] };
    if (kind === 'r') return { reactants: rs, products: [] };
    if (kind === 'p') return { reactants: [], products: ps };
    return { reactants: rs, products: ps };
  }

  function bindResult() {
    // 氧化数切换
    var toggle = document.querySelector('[data-toggle-ox]');
    if (toggle && toggle.dataset.bound !== '1') {
      toggle.dataset.bound = '1';
      toggle.addEventListener('change', function () {
        state.showOx = toggle.checked;
        runQuery(state.lastSearch);
      });
    }
    // 离子方程式切换
    var toggleIonic = document.querySelector('[data-toggle-ionic]');
    if (toggleIonic && toggleIonic.dataset.bound !== '1') {
      toggleIonic.dataset.bound = '1';
      toggleIonic.addEventListener('change', function () {
        state.ionic = toggleIonic.checked;
        runQuery(state.lastSearch);
      });
    }
    // 相关反应分页
    document.querySelectorAll('.related-box').forEach(bindPagination);
  }

  function bindPagination(box) {
    box.querySelectorAll('.pagination a[data-offset]').forEach(function (link) {
      if (link.dataset.bound === '1') return;
      link.dataset.bound = '1';
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var kind = link.dataset.kind;
        var offset = parseInt(link.dataset.offset, 10);
        var titleMap = {
          r: T.t('relatedReactants'),
          p: T.t('relatedProducts'),
          rp: T.t('relatedBoth')
        };
        var newHTML = P.renderRelatedBox(targetsFor(kind), kind, titleMap[kind], 10, offset);
        if (!newHTML || !box.parentNode) return;
        var tmp = document.createElement('div');
        tmp.innerHTML = newHTML;
        var newBox = tmp.firstElementChild;
        if (newBox) {
          box.parentNode.replaceChild(newBox, box);
          bindPagination(newBox);
        }
      });
    });
  }

  function initAdvanced() {
    var form = document.getElementById('adv-form');
    if (!form) return;

    // 2 行反应物 + 0 行产物的初始布局通过 HTML 完成
    // 为每个现有 row 绑定删除按钮
    form.querySelectorAll('.adv-rows').forEach(function (rowsEl) {
      bindAdvRows(rowsEl);
    });

    form.querySelectorAll('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.dataset.add;
        var rowsEl = document.querySelector('.adv-rows[data-kind="' + kind + '"]');
        if (!rowsEl) return;
        var row = document.createElement('div');
        row.className = 'adv-row';
        var ph = kind === 'r' ? T.t('reactantPlaceholders') : T.t('productPlaceholders');
        var nm = kind === 'r' ? 'reactant' : 'product';
        row.innerHTML = '<input class="adv-input" name="' + nm + '" type="text" placeholder="' + ph + '"><button type="button" class="adv-del">✕</button>';
        rowsEl.appendChild(row);
        // 绑定新 row 的 autocomplete + 删除
        var input = row.querySelector('input');
        A.setup(input);
        var del = row.querySelector('.adv-del');
        del.addEventListener('click', function () {
          row.parentNode.removeChild(row);
        });
        updateDelButtons(rowsEl);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var rs = [];
      var ps = [];
      form.querySelectorAll('input[name="reactant"]').forEach(function (i) {
        var v = i.value.trim(); if (v) rs.push(v);
      });
      form.querySelectorAll('input[name="product"]').forEach(function (i) {
        var v2 = i.value.trim(); if (v2) ps.push(v2);
      });
      if (!rs.length && !ps.length) return;

      // 规范化
      var normR = rs.map(function (s) { return F.canonical(s); }).filter(Boolean);
      var normP = ps.map(function (s) { return F.canonical(s); }).filter(Boolean);
      if (!normR.length && !normP.length) return;

      var data = E.advanced({ reactants: normR, products: normP }, 0, 10);
      document.getElementById('adv-result').innerHTML = P.renderAdvancedResult(data);
      bindAdvPagination(normR, normP);
      document.getElementById('adv-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // 为已有的初始 input 绑定 autocomplete
    form.querySelectorAll('input.adv-input').forEach(function (el) {
      A.setup(el);
    });
    // 为已有的初始 del 按钮绑定删除
    form.querySelectorAll('.adv-rows').forEach(updateDelButtons);

    /* 预填 URL 参数：?r=反应物（多个用逗号/加号分隔）&p=产物
       放在所有绑定之后，因为可能需要 click 「添加」按钮补行 */
    try {
      var url = new URL(window.location.href);
      var preR = (url.searchParams.get('r') || '').trim();
      var preP = (url.searchParams.get('p') || '').trim();
      /* 如果 r 是完整方程式（含 = 或 →），拆成反应物/产物两侧 */
      if (preR && !preP && /[=→⟶]/.test(preR)) {
        var parts = preR.split(/[=→⟶]/);
        preR = (parts[0] || '').trim();
        preP = parts.slice(1).join('=').trim();
      }
      if (preR || preP) {
        var fill = function (name, values) {
          if (!values.length) return;
          var inputs = form.querySelectorAll('input[name="' + name + '"]');
          values.forEach(function (v, i) {
            var input = inputs[i];
            if (!input) {
              /* 行不够时模拟点击「添加」按钮 */
              var kind = name === 'reactant' ? 'r' : 'p';
              var addBtn = form.querySelector('[data-add="' + kind + '"]');
              if (addBtn) addBtn.click();
              inputs = form.querySelectorAll('input[name="' + name + '"]');
              input = inputs[i];
            }
            if (input) input.value = v;
          });
        };
        fill('reactant', preR.split(/[,，+＋]/).map(function (s) { return s.trim(); }).filter(Boolean));
        fill('product', preP.split(/[,，+＋]/).map(function (s) { return s.trim(); }).filter(Boolean));
      }
    } catch (e) {}
  }

  function bindAdvRows(rowsEl) {
    rowsEl.addEventListener('click', function (e) {
      if (!e.target.classList.contains('adv-del')) return;
      var rows = rowsEl.querySelectorAll('.adv-row');
      if (rows.length <= 1) return;
      var row = e.target.closest('.adv-row');
      if (row) row.parentNode.removeChild(row);
      updateDelButtons(rowsEl);
    });
    updateDelButtons(rowsEl);
  }
  function updateDelButtons(rowsEl) {
    var rows = rowsEl.querySelectorAll('.adv-row');
    rows.forEach(function (r, i) {
      var d = r.querySelector('.adv-del');
      if (!d) return;
      d.disabled = rows.length <= 1;
    });
  }

  function bindAdvPagination(reactants, products) {
    document.querySelectorAll('#adv-result .pagination a[data-page]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var off = parseInt(a.dataset.page, 10);
        var data = E.advanced({ reactants: reactants, products: products }, off, 10);
        document.getElementById('adv-result').innerHTML = P.renderAdvancedResult(data);
        bindAdvPagination(reactants, products);
      });
    });
  }

  function initI18nUI() {
    // 翻译 data-t 属性
    document.querySelectorAll('[data-t]').forEach(function (el) {
      var key = el.dataset.t;
      if (T.has(key)) el.textContent = T.t(key);
    });
    document.documentElement.setAttribute('lang', 'zh');
  }

  function boot() {
    try { E.init(); } catch (err) { console.error('engine init failed', err); }

    var path = location.pathname;
    var isAdv = /advanced/i.test(path) || location.hash === '#advanced';
    var isSaved = /saved/i.test(path);
    document.documentElement.classList.toggle('page-advanced', isAdv);
    document.documentElement.classList.toggle('page-saved', isSaved);

    initHeaderSearch();
    initI18nUI();
    updateHeaderBadges();
    bindFavToggle();
    bindSaved();

    /* 收藏与历史页：只处理 tab / q 参数，不参与方程式查询 */
    if (isSaved) {
      renderSaved();
      bindGlobal();
      return;
    }

    /* 无论在哪个页面，只要 URL 带 ?id= 或 ?s= 就跳转到 index.html 处理 */
    try {
      var url = new URL(window.location.href);
      var id = url.searchParams.get('id');
      var s = url.searchParams.get('s');
      if (isAdv && (id !== null && id !== '' || s)) {
        /* advanced.html 上带查询参数 → 直接跳到 index.html 处理 */
        window.location.replace('index.html' + url.search);
        return;
      }
      if (id !== null && id !== '') { runById(id); return; }
      if (s) { runQuery(s); return; }
    } catch (e) {}

    if (isAdv) {
      var mainEl = document.getElementById('main');
      if (mainEl) mainEl.innerHTML = P.renderAdvancedForm();
      initAdvanced();
      bindGlobal();
      return;
    }

    renderHome();
    bindGlobal();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  window.addEventListener('popstate', function () {
    try {
      var url = new URL(window.location.href);
      var id = url.searchParams.get('id');
      var s = url.searchParams.get('s');
      if (id !== null && id !== '') runById(id);
      else if (s) runQuery(s);
      else { renderHome(); bindGlobal(); }
    } catch (e) { renderHome(); }
  });
})(window);
