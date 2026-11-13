/* 同种物质的不同书写格式（分子式/结构简式/不同排列），用于物质页互相跳转 */
(function (root) {
  'use strict';

  var GROUPS = [
    ['C2H5OH', 'C2H6O', 'CH3CH2OH', 'HOC2H5', 'HOCH2CH3'],
    ['CH3COOH', 'C2H4O2', 'CH3CO2H', 'HC2H3O2'],
    ['CH3COOC2H5', 'CH3COOCH2CH3', 'C4H8O2'],
    ['CH3CHO', 'C2H4O'],
    ['HCHO', 'CH2O'],
    ['CH3OH', 'CH4O'],
    ['C2H4', 'CH2CH2'],
    ['NH4OH', 'NH3*H2O', 'NH3H2O', 'H5NO'],
    ['NH3', 'H3N'],
    ['H2O', 'HOH'],
    ['H2O2', 'H2OO'],
    ['Fe3O4', 'FeO*Fe2O3', 'FeOFe2O3'],
    ['Al(OH)3', 'Al(HO)3', 'H3AlO3', 'AlO3H3'],
    ['NaAlO2', 'Na[Al(OH)4]', 'NaAl(OH)4'],
    ['H2SO4', 'SO4H2', 'SO3H2O', 'SO2(OH)2'],
    ['HNO3', 'HONO2'],
    ['H3PO4', 'PO4H3'],
    ['Ca(OH)2', 'Ca(HO)2', 'Ca[OH]2', 'CaO2H2'],
    ['KOH', 'KHO'],
    ['Fe(OH)3', 'Fe(HO)3'],
    ['H2CO3', 'CO(OH)2'],
    ['CaCO3', 'CaOCO2'],
    ['Na2CO3', 'CO3Na2'],
    ['KNO3', 'NO3K'],
    ['CuSO4', 'Cu(SO4)'],
    ['FeSO4', 'Fe(SO4)', 'SO4Fe'],
    ['KMnO4', 'K(MnO4)'],
    ['K2Cr2O7', 'Cr2O7K2'],
    ['CH3COONa', 'C2H3NaO2'],
    ['C6H5OH', 'C6H6O'],
    ['C6H5COOH', 'C7H6O2'],
    ['HCOOH', 'CH2O2'],
    ['H2C2O4', 'C2H2O4', 'HOOCCOOH']
  ];

  var byFormula = null;

  function build() {
    if (byFormula) return;
    byFormula = {};
    var exists = {};
    var rows = (root.Reactions && root.Reactions.list) || [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i].r, p = rows[i].p, j;
      for (j = 0; j < r.length; j++) exists[r[j]] = true;
      for (j = 0; j < p.length; j++) exists[p[j]] = true;
    }
    ((root.Compounds && root.Compounds.list) || []).forEach(function (c) { exists[c.f] = true; });
    if (root.WikiNames) Object.keys(root.WikiNames).forEach(function (f) { exists[f] = true; });

    GROUPS.forEach(function (g) {
      var valid = g.filter(function (f) {
        return exists[f] && root.Formula.parse(f);
      });
      if (valid.length < 2) return;
      valid.forEach(function (f) { byFormula[f] = valid; });
    });
  }

  function others(formula) {
    build();
    var g = byFormula[formula];
    if (!g) return [];
    return g.filter(function (f) { return f !== formula; });
  }

  function canonical(formula) {
    build();
    var g = byFormula[formula];
    return g ? g[0] : formula;
  }

  root.SpeciesForms = {
    others: others,
    canonical: canonical,
    groups: GROUPS
  };
})(typeof window !== 'undefined' ? window : globalThis);
