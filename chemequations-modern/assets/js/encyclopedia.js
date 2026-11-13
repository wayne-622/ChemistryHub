/* 物质百科：为库内全部 5909 物种生成详细百科条目 */
/* 核心：PropertyInfer（中文名推断 + 物理/化学性质生成）+ Reaction 行为索引 */
(function (root) {
  'use strict';
  var F = root.Formula;
  var C = root.Compounds;
  var W = root.WikiNames;
  var B = root.BleachInfo;
  var PI = root.PropertyInfer;

  /* ===== 反应行为索引（惰性） ===== */
  var speciesIndex = null;
  function buildIndex() {
    if (speciesIndex) return;
    var list = root.Reactions && root.Reactions.list;
    if (!list) return;
    speciesIndex = {};
    function ensure(f) {
      if (!speciesIndex[f]) speciesIndex[f] = {
        asReactant: 0, asProduct: 0,
        withO2: 0, withH2: 0, withCl2: 0, withBr2: 0, withI2: 0,
        withH2SO4: 0, withHNO3: 0, withHCl: 0, withNaOH: 0, withKOH: 0,
        reactAcid: 0, reactBase: 0,
        gasForm: 0
      };
      return speciesIndex[f];
    }
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      var rset = {}; row.r.forEach(function (f) { rset[f] = true; ensure(f).asReactant++; });
      var pset = {}; row.p.forEach(function (f) { pset[f] = true; ensure(f).asProduct++; });
      var acidReact = rset['H2SO4'] || rset['HCl'] || rset['HNO3'] || rset['HBr'] || rset['HI'] || rset['H3PO4'];
      var baseReact = rset['NaOH'] || rset['KOH'] || rset['Ca(OH)2'] || rset['Ba(OH)2'] || rset['NH4OH'];
      row.r.forEach(function (f) {
        var e = speciesIndex[f];
        if (rset['O2']) e.withO2++;
        if (rset['H2']) e.withH2++;
        if (rset['Cl2']) e.withCl2++;
        if (rset['Br2']) e.withBr2++;
        if (rset['I2']) e.withI2++;
        if (rset['H2SO4'] && f !== 'H2SO4') e.withH2SO4++;
        if (rset['HNO3'] && f !== 'HNO3') e.withHNO3++;
        if (rset['HCl'] && f !== 'HCl') e.withHCl++;
        if (rset['NaOH'] && f !== 'NaOH') e.withNaOH++;
        if (rset['KOH'] && f !== 'KOH') e.withKOH++;
        if (acidReact && !(rset[f] && (f === 'H2SO4' || f === 'HCl' || f === 'HNO3'))) e.reactAcid++;
        if (baseReact && !(rset[f] && (f === 'NaOH' || f === 'KOH' || f === 'Ca(OH)2'))) e.reactBase++;
      });
      /* gasForm：作为气体产物 */
      row.r.concat(row.p).forEach(function (f) { ensure(f); });
      row.p.forEach(function (g) {
        var isGas = ['H2','O2','Cl2','Br2','N2','H2S','SO2','NO','NO2','CO2','CO','CH4','NH3','HCl','HBr','HI'].indexOf(g) >= 0;
        if (isGas) row.r.forEach(function (rf) { if (rf !== g) speciesIndex[rf].gasForm++; });
      });
    }
  }

  function autoOf(formula) {
    buildIndex();
    var c = C.find(formula);
    var wiki = W && W[formula];
    var p = F.parse(formula);

    /* 电子 */
    if (formula === 'e:-' || (p && p.electron)) {
      return { phys: '电子，带一个单位负电荷，是原子的基本组成粒子。',
               chem: '在氧化还原反应中发生转移，可由金属失去或由氧化剂得到。', auto: true };
    }
    /* 离子 */
    if (p && p.charge !== undefined && p.charge !== 0) {
      var cn = (wiki && wiki.zh) || PI.inferChinese(formula) || formula;
      var val = Math.abs(p.charge); var sign = p.charge > 0 ? '正' : '负';
      var phys = '带' + val + '个单位' + sign + '电荷的离子，存在于溶液、熔融盐或晶体晶格中，不能单独稳定存在。';
      var chem = '与带相反电荷的离子通过静电作用结合成化合物；在溶液中可参与复分解反应、氧化还原反应或作为催化剂。';
      return { phys: phys, chem: chem, auto: true };
    }

    /* 中文名 */
    var cn = (c && c.zh) || (wiki && wiki.zh) || PI.inferChinese(formula) || formula;

    /* 物理性质（PropertyInfer 引擎生成） */
    var phys = PI.buildPhysical(formula, cn);

    /* 化学性质（PropertyInfer 引擎 + 反应行为） */
    var idx = speciesIndex[formula];
    var chem = PI.buildChemical(formula, cn, idx);

    return { phys: phys, chem: chem, auto: true };
  }

  /* 反应统计：为所有物质补充「库内反应情况」 */
  function reactionOverview(formula) {
    buildIndex();
    var idx = speciesIndex && speciesIndex[formula];
    if (!idx) return '';
    var total = idx.asReactant + idx.asProduct;
    if (!total) return '';
    var parts = ['库内共收录 ' + total + ' 个相关反应'];
    var roles = [];
    if (idx.asReactant) roles.push('作为反应物 ' + idx.asReactant + ' 个');
    if (idx.asProduct) roles.push('作为产物 ' + idx.asProduct + ' 个');
    if (roles.length) parts.push('（' + roles.join('，') + '）');
    var partners = [
      ['O2', idx.withO2], ['H2', idx.withH2], ['Cl2', idx.withCl2],
      ['Br2', idx.withBr2], ['I2', idx.withI2], ['H2SO4', idx.withH2SO4],
      ['HNO3', idx.withHNO3], ['HCl', idx.withHCl],
      ['NaOH', idx.withNaOH], ['KOH', idx.withKOH]
    ].filter(function (x) { return x[1] > 0; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 4)
      .map(function (x) { return x[0] + '（' + x[1] + ' 个）'; });
    if (partners.length) parts.push('常见反应伙伴：' + partners.join('、'));
    return parts.join('') + '。';
  }

  function get(formula) {
    var base = autoOf(formula);
    var d = root.EncyclopediaDetail && root.EncyclopediaDetail[formula];
    var out = base;
    if (d) {
      out = {
        phys: d.phys || base.phys,
        chem: d.chem || base.chem,
        lv: d.lv || '',
        ov: d.ov || '',
        prep: d.prep || '',
        use: d.use || '',
        safe: d.safe || '',
        tips: d.tips || null,
        ext: d.ext || '',
        auto: false
      };
    }
    out.stats = reactionOverview(formula);
    return out;
  }

  root.Encyclopedia = { get: get };
})(typeof window !== 'undefined' ? window : globalThis);
