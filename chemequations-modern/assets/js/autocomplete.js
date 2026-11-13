/* 本地自动补全：光标处 token 前缀 → 匹配化合物/离子（按全局频次排序） */
(function (root) {
  'use strict';

  function buildIndex() {
    var index = [];
    var seen = {};
    function add(token, label) {
      if (!token) return;
      var k = token.toLowerCase();
      if (seen[k]) return;
      seen[k] = true;
      index.push({ token: token, label: label });
    }
    if (root.Reactions && root.Reactions.species) {
      root.Reactions.species.forEach(function (s) {
        var f = s[0];
        var wiki = root.WikiNames && root.WikiNames[f];
        var c = root.Compounds && root.Compounds.find(f);
        var zh = (wiki && wiki.zh) || (c && (c.zh || c.en)) || '';
        add(f, zh ? f + ' — ' + zh : f);
      });
    } else if (root.Compounds) {
      root.Compounds.list.forEach(function (c) {
        add(c.f, c.f + ' — ' + (c.zh || c.en));
      });
    }
    return index;
  }

  var indexCache = null;
  function index() {
    if (!indexCache) indexCache = buildIndex();
    return indexCache;
  }

  /* '+' 是电荷后缀（形如 :3+ / :+）还是分隔符 */
  function isChargePlus(value, idx) {
    var j = idx;
    while (j > 0 && value[j - 1] >= '0' && value[j - 1] <= '9') j--;
    return j > 0 && value[j - 1] === ':';
  }

  /* 取光标位置所在的 token（按 ' + = -> →' 分割，离子电荷不切分）及其前缀 */
  function currentToken(inputEl) {
    var value = inputEl.value;
    var pos = inputEl.selectionStart;
    if (pos === null) pos = value.length;
    var start = pos;
    while (start > 0) {
      var c = value[start - 1];
      if (c === ' ' || c === '=' || c === '>' || c === '→' || c === '\r' || c === '\n') break;
      if (c === '+' && !isChargePlus(value, start - 1)) break;
      start--;
    }
    var end = pos;
    while (end < value.length) {
      var c2 = value[end];
      if (c2 === ' ' || c2 === '=' || c2 === '>' || c2 === '→' || c2 === '\r' || c2 === '\n') break;
      if (c2 === '+' && !isChargePlus(value, end)) break;
      if (c2 === '-' && end + 1 < value.length && value[end + 1] === '>') break;
      end++;
    }
    return {
      prefix: value.slice(start, pos),
      token: value.slice(start, end),
      start: start,
      end: end,
      before: value.slice(0, start),
      after: value.slice(end)
    };
  }

  function renderMatches(prefix) {
    if (!prefix || prefix.length < 1) return [];
    var q = prefix.toLowerCase();
    var all = index();
    var out = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].token.toLowerCase().indexOf(q) !== 0) continue;
      out.push(all[i]);
      if (out.length >= 10) break;
    }
    // 若前缀是中文，也按中文名/英文名子串匹配
    if (!out.length && /[^\x00-\xff]/.test(prefix)) {
      var q2 = prefix.toLowerCase();
      for (var j = 0; j < all.length && out.length < 10; j++) {
        if (all[j].label.toLowerCase().indexOf(q2) >= 0) out.push(all[j]);
      }
    }
    return out;
  }

  function setup(inputEl, opts) {
    opts = opts || {};
    var list = null;
    var active = -1;
    var hideTimer = null;

    function show() {
      // 关闭已有
      hide(true);
      // 仅在输入框获得焦点时展示，避免初始化时被动弹出
      if (document.activeElement !== inputEl) return;
      var info = currentToken(inputEl);
      var matches = renderMatches(info.prefix);
      if (!matches.length) { hide(); return; }

      list = document.createElement('ul');
      list.className = 'autocomplete-list';
      matches.forEach(function (m, i) {
        var li = document.createElement('li');
        li.dataset.value = m.token;
        li.dataset.replace = info.before + m.token + info.after;
        li.textContent = m.label;
        li.addEventListener('mousedown', function (ev) {
          ev.preventDefault(); // 不抢焦点
          choose(i);
        });
        list.appendChild(li);
      });

      // 定位：紧贴输入框
      inputEl.parentNode.style.position = 'relative';
      inputEl.parentNode.appendChild(list);
      var rect = inputEl.getBoundingClientRect();
      list.style.top = (rect.bottom - rect.top + 4) + 'px';
      list.style.left = '0';
      list.style.width = Math.max(rect.width, 260) + 'px';
      active = -1;
    }

    function hide(immediate) {
      if (list && list.parentNode) { list.parentNode.removeChild(list); }
      list = null; active = -1;
      if (!immediate) {
        hideTimer = setTimeout(function () {
          hide(true);
        }, 120);
      }
    }

    function choose(i) {
      if (!list) return;
      var lis = list.children;
      if (i < 0 || i >= lis.length) i = 0;
      var li = lis[i];
      var replace = li.dataset.replace;
      inputEl.value = replace;
      hide(true);
      if (opts.onChoose) opts.onChoose(replace);
      try { inputEl.focus(); } catch (e) {}
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function move(dir) {
      if (!list) return;
      var lis = list.children;
      active = active + dir;
      if (active < 0) active = lis.length - 1;
      if (active >= lis.length) active = 0;
      for (var i = 0; i < lis.length; i++) {
        lis[i].classList.toggle('active', i === active);
      }
    }

    var handlers = {
      input: function () { show(); },
      focus: function () { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } show(); },
      blur: function () { hide(); },
      keydown: function (e) {
        if (!list) {
          if (e.key === 'ArrowDown') show();
          return;
        }
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter' || e.key === 'Tab') {
          if (active >= 0) { e.preventDefault(); choose(active); }
        } else if (e.key === 'Escape') {
          e.preventDefault(); hide(true);
        }
      }
    };

    Object.keys(handlers).forEach(function (k) {
      inputEl.addEventListener(k, handlers[k]);
    });

    /* 点击列表与输入框以外的区域立即收起 */
    function onDocMouseDown(e) {
      if (!list) return;
      if (e.target === inputEl || list.contains(e.target)) return;
      hide(true);
    }
    document.addEventListener('mousedown', onDocMouseDown, true);

    return {
      destroy: function () {
        hide(true);
        document.removeEventListener('mousedown', onDocMouseDown, true);
        Object.keys(handlers).forEach(function (k) { inputEl.removeEventListener(k, handlers[k]); });
      }
    };
  }

  root.Autocomplete = { setup: setup, _index: buildIndex };
})(typeof window !== 'undefined' ? window : globalThis);
