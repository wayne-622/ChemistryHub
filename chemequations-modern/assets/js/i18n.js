/* 中文 UI 文案（单语言版） */
(function (root) {
  'use strict';

  var zh = {
    brand: 'Chemistry Hub',
    searchPlaceholder: '例如 HCl + NaOH，或 H2O',
    search: '提交', advancedSearch: '自定义搜索',
    errorTitle: '错误',
    errorBadChar: '不需要的字符',
    errorBadCharHint: '请正确输入元素符号（首字母大写，例如 NaCl，不要 nac 或 nacl）',
    errorSyntax: '不需要的字符',
    errorSyntaxHint: '需要该字符 \'+\' 或在方程式结尾',
    errorUnknownCompound: '不能处理该化合物',
    errorUnknownCompoundHint: '请尝试大写输入元素的首字母',
    errorNoResults: '未发现结果',
    errorNoResultsHint: '抱歉，没有找到与查询匹配的方程式。',
    acidBaseTitle: '酸碱反应', acidBaseNeutralize: '这是酸碱反应（中和反应）:',
    acidBaseNeutralizeA: '酸', acidBaseNeutralizeB: '碱',
    redoxTitle: '氧化还原', redoxIntro: '这是<strong>氧化还原</strong>反应:',
    oxidized: '被氧化', reduced: '被还原',
    oxidizingAgent: '氧化剂', reducingAgent: '还原剂',
    precipitateTitle: '沉淀', precipitateIntro: '这是<strong>沉淀</strong>反应:',
    precipitateX: '<strong>{name}</strong> 是形成的沉淀.',
    gasTitle: '气体逸出', gasIntro: '这是<strong>气体逸出</strong>反应:',
    gasX: '<strong>{name}</strong> 是形成的气体.',
    bleachTitle: '漂白性', bleachLead: '<strong>{name}</strong> 具有漂白作用:',
    reactants: '反应物', products: '产物',
    systemName: '系统名称', otherNames: '其他名称', appearance: '外观',
    category: '类别', phase: '状态', molarMass: '摩尔质量', composition: '元素组成',
    oxidationNumbers: '氧化数', solubility: '溶解性', reactionRole: '反应角色',
    relatedCount: '相关反应', viewSpecies: '查看详情',
    phaseGas: '气体', phaseLiquid: '液体', phaseSolid: '固体', phaseAq: '水溶液',
    soluble: '易溶于水', insoluble: '难溶于水',
    catElement: '单质', catAcid: '酸', catBase: '碱', catSalt: '盐', catOxide: '氧化物',
    catHydride: '氢化物', catPeroxide: '过氧化物', catOrganic: '有机物', catIon: '离子',
    catElectron: '电子', catOther: '其他化合物',
    roleAcid: '酸', roleBase: '碱', rolePrecipitate: '生成沉淀', roleGas: '逸出气体',
    reactionsUnit: '个反应',
    similarResults: '为你找到以下相似结果',
    similarResultsHint: '下面是数据库中包含它的相关反应。',
    noSimilarResults: '暂未找到相关结果',
    noSimilarResultsHint: '数据库中暂时没有包含该物质的反应，请检查化学式是否输入正确，或换一种写法试试。',
    relatedReactants: '按反应物搜索', relatedProducts: '按产物搜索',
    relatedBoth: '按反应物搜索 并按产物', noRelated: '未找到相关反应',
    moreSolutions: '存在更多解:', moreSolutionsHint: '点击下方任一方程式查看详情。',
    solutions: '解', solutionsPlural: '个解', score: '分数', equationCol: '方程式',
    share: '分享', copyLink: '复制链接', copied: '已复制',
    equationId: '方程式编号',
    atomsCount: '{n} 个原子',
    electronLoss: '失去 {n} e⁻',
    electronGain: '得到 {n} e⁻',
    showMore: '显示更多', showLess: '收起',
    oxidationShow: '显示氧化数', oxidationHide: '隐藏氧化数',
    ionicShow: '离子方程式', ionicHide: '分子方程式',
    page: '第', of: '/', prev: '上一页', next: '下一页',
    page1: '1', page2: '2', page3: '3', page4: '4', page5: '5',
    page6: '6', page7: '7', page8: '8', page9: '9', page10: '10', all: '全部',
    addReactant: '添加', addProduct: '添加', searchButton: '搜索',
    advancedTitle: '自定义搜索',
    advancedHint: '输入一个或多个必须出现在方程式中的反应物/产物。',
    reactantLabel: '反应物', productLabel: '产物',
    reactantPlaceholders: '反应物化学式...', productPlaceholders: '产物化学式...',
    reactantsIncl: '反应物包括', productsIncl: '产物包括',
    addToAdvanced: '添加到自定义搜索',
    historyTitle: '搜索历史', historyClear: '清空',
    favTitle: '我的收藏', favAdd: '收藏', favAdded: '已收藏', favClear: '清空',
    shelfUnit: '条', shelfEmptyHistory: '暂无搜索历史', shelfEmptyFav: '暂无收藏的方程式',
    savedTitle: '收藏与历史', savedSub: '你收藏的方程式和搜过的内容都在这里，可随时搜索和删除。',
    savedSearchPlaceholder: '在列表中搜索…', savedNoMatch: '没有匹配的条目',
    loading: '加载中…',
    backHome: '回到首页',
    examplesTitle: '试试这些',
    heroHint: '输入化学式或反应式，即时配平并查看反应细节。',
    examplesEq: '方程式',
    examplesSubstance: '常见物质',
    clearSearch: '清空',
    examples: ['HCl + NaOH', 'H2 + O2', 'Fe + CuSO4', 'CH4 + O2', 'KMnO4 + HCl', 'NaOH + CO2', 'CaCO3 + HCl', 'NH4Cl + AgNO3'],
    substances: ['H2O', 'O2', 'CO2', 'HCl', 'NaOH', 'H2SO4', 'NaCl', 'CaCO3', 'NH3', 'CH4', 'Fe', 'CuSO4']
  };

  function t(key) {
    return zh[key] !== undefined ? zh[key] : '';
  }

  function has(key) { return zh[key] !== undefined; }

  root.i18n = {
    current: function () { return 'zh'; },
    t: t,
    has: has,
    render: function (str, ctx) {
      return String(str).replace(/\{(\w+)\}/g, function (_, k) { return ctx && ctx[k] !== undefined ? ctx[k] : ''; });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
