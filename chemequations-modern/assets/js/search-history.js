/* 搜索历史：localStorage 持久化，最新在前，去重，上限 20 条 */
(function (root) {
  'use strict';
  var KEY = 'ce_search_history';
  var MAX = 20;
  var mem = []; /* localStorage 不可用时的内存降级 */

  function read() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(KEY);
      if (!raw) return mem.slice();
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(function (s) { return typeof s === 'string' && s; }) : [];
    } catch (e) { return mem.slice(); }
  }
  function write(list) {
    mem = list.slice();
    try {
      if (root.localStorage) root.localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function list() { return read(); }

  function add(q) {
    q = String(q || '').trim();
    if (!q) return;
    var arr = read().filter(function (s) { return s !== q; });
    arr.unshift(q);
    if (arr.length > MAX) arr = arr.slice(0, MAX);
    write(arr);
  }

  function remove(q) {
    write(read().filter(function (s) { return s !== q; }));
  }

  function clear() { write([]); }

  root.SearchHistory = { list: list, add: add, remove: remove, clear: clear };
})(typeof window !== 'undefined' ? window : globalThis);
