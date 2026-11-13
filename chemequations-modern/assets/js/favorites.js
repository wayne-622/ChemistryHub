/* 方程式收藏：localStorage 持久化，最新在前，按 q（可搜索串）去重，上限 100 条 */
(function (root) {
  'use strict';
  var KEY = 'ce_favorites';
  var MAX = 100;
  var mem = []; /* localStorage 不可用时的内存降级 */

  function read() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(KEY);
      if (!raw) return mem.slice();
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (it) {
        return it && typeof it.q === 'string' && it.q;
      });
    } catch (e) { return mem.slice(); }
  }
  function write(list) {
    mem = list.slice();
    try {
      if (root.localStorage) root.localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function list() { return read(); }

  function has(q) {
    q = String(q || '').trim();
    if (!q) return false;
    return read().some(function (it) { return it.q === q; });
  }

  function add(item) {
    if (!item || !item.q) return;
    item = { q: item.q, display: item.display || item.q, id: item.id === undefined ? null : item.id, at: Date.now() };
    var arr = read().filter(function (it) { return it.q !== item.q; });
    arr.unshift(item);
    if (arr.length > MAX) arr = arr.slice(0, MAX);
    write(arr);
  }

  function remove(q) {
    q = String(q || '').trim();
    write(read().filter(function (it) { return it.q !== q; }));
  }

  /* 切换收藏，返回切换后的状态（true = 已收藏） */
  function toggle(item) {
    if (!item || !item.q) return false;
    if (has(item.q)) { remove(item.q); return false; }
    add(item);
    return true;
  }

  function clear() { write([]); }

  root.Favorites = { list: list, has: has, add: add, remove: remove, toggle: toggle, clear: clear };
})(typeof window !== 'undefined' ? window : globalThis);
