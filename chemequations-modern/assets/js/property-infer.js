/* 化合物性质推断引擎 + 反应行为挖掘 */
(function (root) {
  'use strict';
  var F = root.Formula;
  var C = root.Compounds;
  var W = root.WikiNames;
  var B = root.BleachInfo;
  var P = root.Periodic && root.Periodic.P;

  var ALKALI = {Li:1,Na:1,K:1,Rb:1,Cs:1};
  var ALK_EARTH = {Be:1,Mg:1,Ca:1,Sr:1,Ba:1};
  var NONMETALS = {H:1,O:1,S:1,F:1,Cl:1,Br:1,I:1,N:1,C:1,Si:1,P:1,B:1,Se:1,As:1,He:1,Ne:1,Ar:1,Kr:1,Xe:1};
  var GAS_ELEMENTS = {H:1,O:1,N:1,F:1,Cl:1};

  /* ===== 1. 中文名推断 ===== */
  var ANION_NAMES = {
    'F': '氟化物', 'Cl': '氯化物', 'Br': '溴化物', 'I': '碘化物',
    'O': '氧化物', 'S': '硫化物', 'Se': '硒化物', 'Te': '碲化物',
    'OH': '氢氧化物',
    'NO3': '硝酸盐', 'NO2': '亚硝酸盐',
    'SO4': '硫酸盐', 'SO3': '亚硫酸盐', 'S2O3': '硫代硫酸盐',
    'PO4': '磷酸盐', 'HPO4': '磷酸氢盐', 'H2PO4': '磷酸二氢盐', 'PO3': '亚磷酸盐',
    'CO3': '碳酸盐', 'HCO3': '碳酸氢盐',
    'ClO4': '高氯酸盐', 'ClO3': '氯酸盐', 'ClO2': '亚氯酸盐', 'ClO': '次氯酸盐',
    'BrO3': '溴酸盐', 'BrO': '次溴酸盐',
    'IO4': '高碘酸盐', 'IO3': '碘酸盐', 'IO': '次碘酸盐',
    'MnO4': '高锰酸盐', 'MnO4:2': '锰酸盐',
    'CrO4': '铬酸盐', 'Cr2O7': '重铬酸盐',
    'CN': '氰化物', 'SCN': '硫氰化物',
    'CH3COO': '醋酸盐', 'HCOO': '甲酸盐',
    'C2O4': '草酸盐',
    'AlO2': '铝酸盐', 'Al(OH)4': '四羟基合铝酸盐',
    'SiO3': '硅酸盐', 'B4O7': '硼酸盐',
    'HSO4': '硫酸氢盐', 'HSO3': '亚硫酸氢盐',
    'O2': '过氧化物', 'O2H': '超氧化物',
    'NH4': '铵'
  };

  var OXOACID_NAMES = {
    'H2SO4': '硫酸', 'H2SO3': '亚硫酸', 'H2S2O3': '硫代硫酸',
    'HNO3': '硝酸', 'HNO2': '亚硝酸',
    'H3PO4': '磷酸', 'H3PO3': '亚磷酸', 'H3PO2': '次磷酸',
    'H2CO3': '碳酸',
    'HClO4': '高氯酸', 'HClO3': '氯酸', 'HClO2': '亚氯酸', 'HClO': '次氯酸',
    'HBrO3': '溴酸', 'HBrO': '次溴酸',
    'HIO4': '高碘酸', 'HIO3': '碘酸', 'HIO': '次碘酸',
    'HMnO4': '高锰酸', 'H2MnO4': '锰酸',
    'H2Cr2O7': '重铬酸', 'H2CrO4': '铬酸',
    'HCN': '氢氰酸', 'HF': '氢氟酸', 'HCl': '氢氯酸（盐酸）', 'HBr': '氢溴酸', 'HI': '氢碘酸',
    'H2S': '氢硫酸',
    'H3BO3': '硼酸', 'H2SiO3': '硅酸',
    'HCOOH': '甲酸', 'CH3COOH': '乙酸', 'C6H5COOH': '苯甲酸',
    'H2C2O4': '草酸'
  };

  /* 酸根候选表：[名称, {元素: 最小数}, 总原子数] 按总原子数降序匹配 */
  var ANION_PATTERNS = [
    ['Al(OH)4', {Al:1,O:4,H:4}, 9],
    ['B4O7', {B:4,O:7}, 11],
    ['Cr2O7', {Cr:2,O:7}, 9],
    ['CH3COO', {C:2,H:3,O:2}, 7],
    ['C2O4', {C:2,O:4}, 6],
    ['MnO4', {Mn:1,O:4}, 5],
    ['ClO4', {Cl:1,O:4}, 5],
    ['IO4', {I:1,O:4}, 5],
    ['SO4', {S:1,O:4}, 5],
    ['PO4', {P:1,O:4}, 5],
    ['H2PO4', {H:2,P:1,O:4}, 7],
    ['HPO4', {H:1,P:1,O:4}, 6],
    ['HSO4', {H:1,S:1,O:4}, 6],
    ['NO3', {N:1,O:3}, 4],
    ['CO3', {C:1,O:3}, 4],
    ['ClO3', {Cl:1,O:3}, 4],
    ['IO3', {I:1,O:3}, 4],
    ['BrO3', {Br:1,O:3}, 4],
    ['SO3', {S:1,O:3}, 4],
    ['PO3', {P:1,O:3}, 4],
    ['SiO3', {Si:1,O:3}, 4],
    ['HCO3', {H:1,C:1,O:3}, 5],
    ['HSO3', {H:1,S:1,O:3}, 5],
    ['NO2', {N:1,O:2}, 3],
    ['ClO2', {Cl:1,O:2}, 3],
    ['O2', {O:2}, 2],
    ['CN', {C:1,N:1}, 2],
    ['SCN', {S:1,C:1,N:1}, 3],
    ['OH', {O:1,H:1}, 2],
    ['ClO', {Cl:1,O:1}, 2],
    ['BrO', {Br:1,O:1}, 2],
    ['IO', {I:1,O:1}, 2],
    ['NH4', {N:1,H:4}, 5],
    ['HS', {H:1,S:1}, 2],
    /* 简单卤素阴离子 + S^2-（原子数 1，排最后） */
    ['F', {F:1}, 1], ['Cl', {Cl:1}, 1], ['Br', {Br:1}, 1], ['I', {I:1}, 1], ['S', {S:1}, 1]
  ];
  /* 按原子数降序排列（越大越先匹配） */
  ANION_PATTERNS.sort(function (a, b) { return b[2] - a[2]; });

  function findAnionGroup(counts, metalPresent) {
    if (!metalPresent) return null;
    for (var i = 0; i < ANION_PATTERNS.length; i++) {
      var name = ANION_PATTERNS[i][0], pat = ANION_PATTERNS[i][1];
      /* 确定酸根在 counts 中的倍数（所有 pat 里的元素倍数相同） */
      var mult = null;
      for (var k in pat) {
        var c = counts[k] || 0;
        if (c < pat[k]) { mult = null; break; }
        var m = c / pat[k];
        if (mult === null) mult = m;
        else if (Math.abs(mult - m) > 0.001) { mult = null; break; }
      }
      if (mult === null || mult < 1) continue;
      mult = Math.round(mult);
      /* 检查 counts 中 pat 不含的元素是否全为金属/铵/氢 */
      var rem = {};
      for (var k2 in counts) {
        var used = (pat[k2] || 0) * mult;
        var left = counts[k2] - used;
        if (left > 0) rem[k2] = left;
      }
      var remKeys = Object.keys(rem);
      if (remKeys.length === 0) continue; /* 纯酸根，不是盐 */
      var remAllPositive = remKeys.every(function (rk) {
        return ALKALI[rk] || ALK_EARTH[rk] || rk === 'NH4' || P[rk] && P[rk].class === 'metal';
      });
      if (remAllPositive) return { name: name, pat: pat, mult: mult, remaining: rem };
    }
    return null;
  }

  function inferChinese(formula) {
    if (OXOACID_NAMES[formula]) return OXOACID_NAMES[formula];
    var c = C.find && C.find(formula);
    if (c && c.zh) return c.zh;
    if (W && W[formula] && W[formula].zh) return W[formula].zh;
    if (formula === 'e:-') return '电子';
    /* 离子格式：MnO4:-、SO4:2-、H:+ */
    if (formula.indexOf(':') >= 0) {
      var pair = formula.split(':');
      var base = pair[0];
      var cn = inferChinese(base);
      return cn + '离子';
    }
    var p = F.parse(formula);
    if (!p) return formula;
    var counts = p.counts;
    var elements = p.order;

    /* 单质 */
    if (elements.length === 1) {
      var sym = elements[0];
      if (P && P[sym]) return P[sym].zh;
      return sym;
    }

    /* 特殊二元氢化物：H+非金属 → 酸或气体 */
    if (counts['H'] && elements.length === 2) {
      var other = elements.filter(function (e) { return e !== 'H'; })[0];
      if (other === 'F') return '氢氟酸';
      if (other === 'Cl') return '氢氯酸（盐酸）';
      if (other === 'Br') return '氢溴酸';
      if (other === 'I') return '氢碘酸';
      if (other === 'S') return '氢硫酸';
      if (other === 'N' && counts['H'] === 3) return '氨';
      if (other === 'C' && counts['H'] === 4) return '甲烷';
      if (P && P[other]) return P[other].zh + '化氢';
    }

    /* 水/过氧化氢/臭氧 */
    if (formula === 'H2O') return '水';
    if (formula === 'H2O2') return '过氧化氢';
    if (formula === 'O3') return '臭氧';

    /* 判断是否含金属 */
    var metals = elements.filter(function (e) { return !NONMETALS[e]; });
    var nonms = elements.filter(function (e) { return NONMETALS[e]; });
    var hasMetal = metals.length > 0;

    /* 金属 + 酸根 */
    if (hasMetal) {
      var grp = findAnionGroup(counts, true);
      if (grp) {
        var catName;
        if (grp.remaining['NH4']) catName = '铵';
        else if (grp.remaining['H']) catName = '氢';
        else if (Object.keys(grp.remaining).length === 1) {
          var k = Object.keys(grp.remaining)[0];
          catName = P && P[k] ? P[k].zh : k;
        } else {
          catName = Object.keys(grp.remaining).map(function (k) { return P && P[k] ? P[k].zh : k; }).join('');
        }
        /* 金属离子总数 vs 酸根数 → 推断酸根电荷，用于 MnO4 等歧义 */
        var totalMetalCount = 0;
        for (var mk in grp.remaining) {
          if (mk === 'NH4' || mk === 'H') continue;
          totalMetalCount += grp.remaining[mk];
        }
        var anKey = grp.name;
        if (grp.name === 'MnO4' && totalMetalCount >= grp.mult * 2) anKey = 'MnO4:2'; /* 锰酸根 */
        if (grp.name === 'MnO4' && totalMetalCount === grp.mult) anKey = 'MnO4'; /* 高锰酸根 */
        if (grp.name === 'S2O8') anKey = 'S2O8'; /* 过二硫酸根 */
        var anName = ANION_NAMES[anKey] || ANION_NAMES[grp.name] || grp.name;
        /* 酸根名去掉末尾"盐"字——因为后面金属名已表明是盐 */
        if (anName.length > 1 && anName.charAt(anName.length - 1) === '盐') anName = anName.slice(0, -1);
        /* 命名顺序：酸根名 + 金属名（如"氯酸钙"、"高锰酸钾"） */
        return anName + catName;
      }
      /* 没匹配上酸根 → 二元金属+非金属 */
      if (metals.length === 1 && nonms.length === 1) {
        var mName = P && P[metals[0]] ? P[metals[0]].zh : metals[0];
        var nmRoot = (nonms[0] === 'F') ? '氟' : (nonms[0] === 'Cl') ? '氯' : (nonms[0] === 'Br') ? '溴' :
                     (nonms[0] === 'I') ? '碘' : (nonms[0] === 'O') ? '氧' : (nonms[0] === 'S') ? '硫' : nonms[0];
        return mName + nmRoot + '化物';
      }
    }

    /* 不含金属：非金属互化物 → 用数字前缀，电负性大的（O/S/N/卤）放后面 */
    if (!hasMetal && elements.length >= 2) {
      var numChinese = ['','一','二','三','四','五','六','七','八','九','十'];
      /* 排序：O 最后 > S 倒数第二 > N 倒数第三 > 其他保持原序 */
      var negOrder = { O:3, S:2, Se:2, N:1, P:1, F:4, Cl:4, Br:4, I:4 };
      var sorted = elements.slice().sort(function (a, b) { return (negOrder[a] || 0) - (negOrder[b] || 0); });
      var name = '';
      sorted.forEach(function (nm) {
        var nmName = P && P[nm] ? P[nm].zh : nm;
        var num = counts[nm];
        name += (num > 1 ? numChinese[num] : '') + nmName;
      });
      return name;
    }

    /* 兜底 */
    return elements.map(function (e) { return P && P[e] ? P[e].zh : e; }).join('');
  }

  /* ===== 2. 物理性质推断 ===== */
  var GASES = { H2:1, O2:1, N2:1, Cl2:1, F2:1, He:1, Ne:1, Ar:1, Kr:1, Xe:1,
                CH4:1, SiH4:1, NH3:1, PH3:1, AsH3:1,
                H2S:1, HCl:1, HBr:1, HI:1,
                CO2:1, CO:1, SO2:1, NO:1, NO2:1, N2O:1, N2O5:1, ClO2:1 };
  var LIQUIDS = { H2O:1, H2O2:1, Br2:1, Hg:1, H2SO4:1, HNO3:1, CH3COOH:1, H3PO4:1, CCl4:1, CHCl3:1, CH2Cl2:1 };

  function inferAppearance(formula) {
    var c = C.find && C.find(formula);
    if (c && c.ap) return c.ap;
    /* 气体 */
    if (GASES[formula]) {
      if (['H2','O2','N2','CO2','CO','NO','N2O','CH4','He','Ne','Ar','Kr','Xe'].indexOf(formula) >= 0) return '无色无味气体';
      if (formula === 'Cl2') return '黄绿色有刺激性气味气体';
      if (formula === 'F2') return '淡黄色剧毒气体';
      if (formula === 'SO2') return '无色有刺激性气味有毒气体';
      if (formula === 'NO2') return '红棕色有刺激性气味有毒气体';
      if (formula === 'NH3') return '无色有刺激性气味气体';
      if (formula === 'H2S') return '无色有臭鸡蛋气味有毒气体';
      if (formula === 'HCl') return '无色有刺激性气味气体';
      return '气态物质';
    }
    if (LIQUIDS[formula]) {
      if (formula === 'Br2') return '深红棕色发烟液体';
      if (formula === 'Hg') return '银白色液态金属';
      if (formula === 'H2SO4') return '无色油状液体';
      return '液态物质';
    }
    /* 单质：从周期表 */
    var p = F.parse(formula);
    if (p && p.order.length === 1 && !p.charge) {
      var sym = p.order[0];
      if (P && P[sym]) return P[sym].appearance;
    }
    /* 从 counts 推断颜色（只对 Transition Metal 化合物） */
    if (p) {
      var cnts = p.counts;
      if (cnts['Fe']) {
        if (cnts['S'] && !cnts['O']) return '黑色固体';
        if (cnts['Cl']) return '棕黄色固体';
        if (cnts['O'] && cnts['Fe'] === 2) return '红棕色固体';
        if (cnts['O']) return '黑色固体';
      }
      if (cnts['Cu']) {
        if (cnts['O'] && cnts['Cu'] === 2) return '砖红色固体';
        if (cnts['O']) return '黑色固体';
        if (cnts['S']) return '黑色固体';
        if (cnts['Cl']) return '棕黄色固体';
        if (cnts['(OH)']) return '蓝色固体';
      }
      if (cnts['Mn']) {
        if (cnts['O'] === 2) return '黑色固体';
        if (cnts['O'] >= 4) return '紫黑色固体';
      }
      if (cnts['Cr']) {
        if (cnts['O'] >= 7) return '橙红色固体';
        if (cnts['O'] >= 4) return '黄色固体';
        if (cnts['O'] === 3) return '绿色固体';
      }
      if (cnts['Ag']) {
        if (cnts['Cl']) return '白色固体';
        if (cnts['Br']) return '淡黄色固体';
        if (cnts['I']) return '黄色固体';
        if (cnts['S']) return '黑色固体';
      }
      if (cnts['Pb']) {
        if (cnts['S']) return '黑色固体';
        if (cnts['O']) return '棕黑色固体';
      }
      if (cnts['Bi'] && cnts['S']) return '灰黑色固体';
    }
    /* 碱金属/碱土金属化合物 → 白色 */
    if (p) {
      var first = p.order[0];
      if (ALKALI[first] || ALK_EARTH[first]) return '白色固体';
    }
    return '固体';
  }

  function inferState(formula) {
    var c = C.find && C.find(formula);
    if (c && c.st) {
      if (c.st === 'g') return '常温下为气体';
      if (c.st === 'l') return '常温下为液体';
    }
    if (GASES[formula]) return '常温下为气体';
    if (LIQUIDS[formula]) return '常温下为液体';
    return '';
  }

  function inferSolubility(formula) {
    var c = C.find && C.find(formula);
    if (c) {
      if (c.ins) return '难溶于水';
      if (c.st === 'g') return '常温下为气体';
      if (c.st === 'l') return '常温下为液体';
    }
    if (GASES[formula]) return '常温下为气体';
    if (LIQUIDS[formula]) return '常温下为液体';
    var p = F.parse(formula);
    if (!p) return '';
    var counts = p.counts;
    var elements = p.order;

    /* 全溶：Na+、K+、NH4+、NO3-、ClO4- */
    if (counts['Na'] || counts['K'] || counts['NH4']) return '易溶于水';
    if (counts['NO3']) return '易溶于水';
    if (counts['ClO4']) return '易溶于水';

    /* Cl/Br/I：除 AgX, PbX2, Hg2X2 外都溶 */
    if (counts['Cl'] && !counts['O']) {
      if (counts['Ag'] || counts['Pb']) return '难溶于水';
      return '可溶于水';
    }
    if (counts['Br'] && !counts['O']) {
      if (counts['Ag'] || counts['Pb']) return '难溶于水';
      return '可溶于水';
    }
    if (counts['I'] && !counts['O']) {
      if (counts['Ag'] || counts['Pb'] || counts['Hg']) return '难溶于水';
      return '可溶于水';
    }

    /* SO4：Ba/Pb 难溶，Ca/Sr 微溶 */
    if (counts['SO4']) {
      if (counts['Ba'] || counts['Pb']) return '难溶于水';
      if (counts['Ca'] || counts['Sr']) return '微溶于水';
      return '可溶于水';
    }

    /* CO3/SO3：除 Na/K/NH4 外都难溶 */
    if (counts['CO3']) return '难溶于水（钠/钾/铵盐除外）';
    if (counts['SO3']) return '难溶于水（钠/钾/铵盐除外）';

    /* PO4：除 Na/K/NH4 外都难溶 */
    if (counts['PO4']) return '难溶于水（钠/钾/铵盐除外）';

    /* S^2-：Na/K/NH4 可溶，Sr/Ba 微溶，其余难溶 */
    if (counts['S'] && !counts['O']) {
      if (counts['Na'] || counts['K'] || counts['NH4']) return '可溶于水（并发生水解）';
      if (counts['Sr'] || counts['Ba']) return '微溶于水';
      return '难溶于水';
    }

    /* OH：Na/K/NH4 可溶，Ba/Sr 可溶，Ca 微溶，其余难溶 */
    if (elements.length === 3 && counts['O'] && counts['H'] && counts['O'] === counts['H']) {
      if (counts['Ba'] || counts['Sr']) return '可溶于水';
      if (counts['Ca']) return '微溶于水';
      return '难溶于水';
    }

    /* 氧化物：碱金属/碱土金属氧化物与水反应，其余难溶 */
    if (elements.length === 2 && counts['O']) {
      var other = elements.filter(function (e) { return e !== 'O'; })[0];
      if (ALKALI[other]) return '与水剧烈反应生成碱';
      if (ALK_EARTH[other]) return '与水反应（CaO+H2O→Ca(OH)2）';
      return '难溶于水';
    }

    /* 酸 */
    if (counts['H'] && counts['O'] && elements.indexOf('H') === 0 && elements.length >= 3) return '易溶于水';

    return '';
  }

  function buildPhysical(formula, cn) {
    var parts = [];
    var c = C.find && C.find(formula);
    var appear = inferAppearance(formula);
    if (appear) parts.push(appear);
    var st = inferState(formula);
    /* 如果外观里没说状态（如 "固体" 不算有状态描述），加上 */
    if (st && (!parts.length || !parts[0].match(/气体|液体|常温/))) {
      parts.push(st);
    }
    var sol = inferSolubility(formula);
    if (sol) parts.push(sol);
    if (!parts.length) parts.push('暂无详细外观资料');
    /* 去重 + 合并 */
    var seen = {};
    parts = parts.filter(function (p) { if (seen[p]) return false; seen[p] = true; return true; });
    return parts.join('；') + '。';
  }

  /* ===== 3. 化学性质推断 ===== */

  /* 特定反应的典型化学描述（字典表）—— 匹配化学式就用这个，比自动归纳准 */
  var SPECIFIC_CHEM = {
    'H2O': '无色无味液体；是最重要的溶剂；常温下能与活泼金属（Na、K、Ca 等）反应放出 H2；能与 F2、Cl2 等反应；通电可分解为 H2 和 O2；在许多化学反应中作催化剂或介质。',
    'H2': '无色无味气体，最轻的气体；可燃，燃烧生成水（2H2+O2→2H2O）；与 O2 混合点燃爆炸（验纯后才能点燃）；能还原金属氧化物（如 CuO、Fe2O3）；工业上用电解水或天然气重整制备。',
    'O2': '无色无味气体；占空气约 21%；支持燃烧，本身不燃烧；能与绝大多数元素发生反应（除稀有气体和 Au、Pt 等）；工业上用分离液态空气法制备。',
    'N2': '无色无味气体；占空气约 78%；化学性质稳定，常温下难与其他物质反应；高温高压催化下与 H2 反应生成 NH3（合成氨）；高温下与 O2 反应生成 NO。',
    'F2': '淡黄色剧毒气体，最强氧化剂；能与几乎所有元素发生反应；与水剧烈反应生成 HF 和 O2。',
    'Na': '性质活泼，常温下能与水剧烈反应生成氢气和氢氧化钠；在空气中燃烧生成过氧化钠。',
    'K': '性质活泼，常温下能与水剧烈反应生成氢气和氢氧化钾；在空气中燃烧生成超氧化钾。',
    'Li': '性质活泼，常温下能与水反应生成氢气和氢氧化锂；在空气中燃烧生成氧化锂。',
    'Mg': '较活泼金属，能与热水反应生成氢气和氢氧化镁；在氧气中点燃发出耀眼白光，生成氧化镁；能与稀酸反应放出氢气。',
    'Al': '较活泼金属，在空气中形成致密氧化膜而钝化；既能与酸反应又能与强碱溶液反应（2Al+2NaOH+2H2O→2NaAlO2+3H2↑）。',
    'Fe': '中等活泼金属，在干燥空气中稳定，在潮湿空气中易生锈（主要成分 Fe2O3·nH2O）；在纯氧中点燃生成四氧化三铁；与稀盐酸/稀硫酸反应生成亚铁盐和氢气；与强氧化性酸（浓硫酸/浓硝酸）在常温下钝化，加热时反应。',
    'Cu': '不活泼金属，在空气中稳定，加热时与氧气反应生成黑色氧化铜；与稀盐酸/稀硫酸不反应；在常温下溶于浓硝酸（生成硝酸铜、NO2 和水）和热的浓硫酸。',
    'Ag': '不活泼金属，在空气中稳定，与稀盐酸/稀硫酸不反应；溶于硝酸生成硝酸银、NO 或 NO2。',
    'Au': '不活泼贵金属，在空气中稳定，不溶于任何单一酸；溶于王水（浓硝酸+浓盐酸）生成 HAuCl4。',
    'Ca': '较活泼碱土金属，能与水剧烈反应生成氢气和氢氧化钙；在空气中燃烧生成氮化钙。',
    'Ba': '较活泼碱土金属，能与水剧烈反应；在空气中燃烧生成过氧化钡和氮化钡。',
    'Na2O2': '强氧化剂，常温下能与 CO2 反应生成 Na2CO3 和 O2，是呼吸面具的供氧剂；与水剧烈反应生成 NaOH 和 O2。',
    'H2O2': '不稳定，受热或在催化剂（如 MnO2、Fe2+）作用下分解生成 H2O 和 O2；具有氧化性（可将 Fe2+、I- 等氧化），也具有还原性（可被 KMnO4 等氧化）。',
    'O3': '强氧化剂，不稳定，常温下分解为 O2；能杀死细菌，用于消毒；能使湿润的淀粉碘化钾试纸变蓝。',
    'Cl2': '黄绿色有毒气体，强氧化性；能与金属、氢气、水、碱等发生反应；与水反应生成盐酸和次氯酸（Cl2+H2O⇌HCl+HClO），次氯酸有漂白性和杀菌性；与 NaOH 冷溶液反应生成 NaClO（漂白液），与 Ca(OH)2 反应生成 Ca(ClO)2（漂白粉）。',
    'F2': '淡黄色剧毒气体，最强氧化剂；能与几乎所有元素发生反应；与水剧烈反应生成 HF 和 O2。',
    'Br2': '深红棕色发烟液体，强氧化性；能与金属、氢气、碱等反应；与水反应较 Cl2 缓和。',
    'I2': '紫黑色固体，易升华；氧化性较弱，与金属反应较慢；遇淀粉变蓝（特征反应）；在水中溶解度小，易溶于有机溶剂（CCl4、酒精等）。',
    'H2SO4': '高沸点强酸，吸水性强（常用作干燥剂）；稀硫酸具有酸的通性，与活泼金属反应放出 H2；浓硫酸具有强氧化性，在加热条件下能与 C、Cu、Fe 等反应；常温下使 Fe、Al 钝化；工业上用接触法生产。',
    'HNO3': '强酸，强氧化性；稀硝酸被还原为 NO，浓硝酸被还原为 NO2；能与绝大多数金属反应（除 Pt、Au）；与不活泼金属（Cu、Ag）反应不需要加热；常温下使 Fe、Al 钝化；能与有机物（甘油、甲苯等）反应生成爆炸物。',
    'HCl': '强酸，挥发性酸；浓盐酸在空气中发烟（HCl 与水蒸气结合）；具有酸的通性；Cl- 有还原性，能被 MnO2、KMnO4、KClO3 等强氧化剂氧化为 Cl2；实验室用锌粒与稀盐酸反应制 H2，用 MnO2 与浓盐酸反应制 Cl2。',
    'HBr': '强酸，挥发性酸；还原性比 HCl 强，能被浓硫酸氧化为 Br2，所以不能用浓硫酸干燥。',
    'HI': '强酸，挥发性酸；还原性最强，能被空气中的 O2 和浓硫酸氧化为 I2，在水中逐渐变黄。',
    'H2S': '弱酸，有毒（臭鸡蛋气味）；强还原性，能被 Cl2、O2、浓硫酸等氧化为 S 或更高价；溶于水形成氢硫酸，是二元弱酸。',
    'SO2': '无色有刺激性气味有毒气体，酸性氧化物；能与水反应生成 H2SO3（亚硫酸）；具有漂白性（与品红化合，加热恢复），但不能漂白酸碱指示剂；具有还原性（能被 O2、Cl2、HNO3 等氧化为 SO4^2-），也有弱氧化性（与 H2S 反应生成 S）；是大气污染物（形成酸雨）。',
    'SO3': '常温下为无色液体，标况下为白色晶体；强酸性氧化物，与水剧烈反应生成 H2SO4，工业硫酸生产的中间产物。',
    'NO': '无色有毒气体（与血红蛋白结合）；不溶于水；易被 O2 氧化为 NO2（2NO+O2→2NO2）。',
    'NO2': '红棕色有毒气体；与水反应生成 HNO3 和 NO（3NO2+H2O→2HNO3+NO）；具有强氧化性（能使湿润的淀粉碘化钾试纸变蓝）；是大气污染物（形成酸雨和光化学烟雾）。',
    'CO': '无色无味有毒气体（与血红蛋白结合）；可燃，燃烧生成 CO2；具有还原性（能还原 CuO、Fe2O3 等金属氧化物）。',
    'CO2': '无色无味气体，酸性氧化物；能溶于水（与水反应生成 H2CO3）；不能燃烧也不支持燃烧（可用于灭火）；能使澄清石灰水变浑浊（检验 CO2 的特征反应）；与 Na2O2 反应生成 O2。',
    'NH3': '无色有刺激性气味气体，极易溶于水（1 体积水约溶 700 体积 NH3）；水溶液显碱性（NH3+H2O⇌NH3·H2O⇌NH4++OH-）；具有还原性，能被 O2 催化氧化为 NO（工业制硝酸的基础）；能与酸反应生成铵盐；实验室用 NH4Cl 和 Ca(OH)2 固体混合加热制备。',
    'CH4': '无色无味气体，最简单的有机物；可燃，是天然气的主要成分；在光照下能与 Cl2 发生取代反应（生成 CH3Cl、CH2Cl2、CHCl3、CCl4 和 HCl）；热分解生成 C 和 H2。',
    'C2H4': '无色略带甜味气体；具有还原性（能使酸性 KMnO4 溶液褪色）；能发生加成反应（使溴水褪色）；燃烧时火焰明亮有黑烟；是重要化工原料（聚乙烯、乙醇等）。',
    'C2H2': '无色无味气体；能使溴水和酸性 KMnO4 溶液褪色；燃烧时火焰明亮有浓烟；实验室用 CaC2 和水反应制备。',
    'C6H6': '无色有特殊气味液体；苯环结构稳定，易取代、难加成、难氧化；能与 Br2（FeBr3 催化）发生取代反应；不能使酸性 KMnO4 溶液褪色。',
    'CH3COOH': '无色有刺激性气味液体，易溶于水和乙醇；一元弱酸，具有酸的通性；能与醇发生酯化反应（浓硫酸催化，加热）；生活中食醋的主要成分（约 3%~5%）。',
    'NaCl': '白色晶体，易溶于水；熔点 801℃，沸点 1465℃；典型离子化合物，熔融状态能导电；电解饱和食盐水制备 NaOH、H2 和 Cl2（氯碱工业）；实验室用电解熔融 NaCl 制备金属钠。',
    'KCl': '白色晶体，易溶于水；与 NaCl 类似；电解熔融态制备金属钾。',
    'CaCO3': '白色固体，难溶于水；大理石、石灰石、贝壳、蛋壳的主要成分；能与酸反应放出 CO2；高温分解生成 CaO 和 CO2（工业制生石灰）。',
    'CaO': '白色固体，俗称生石灰；与水剧烈反应生成 Ca(OH)2 并放出大量热（用于食品自热包）；能与 CO2 反应生成 CaCO3。',
    'Ca(OH)2': '白色粉末，微溶于水，水溶液俗称石灰水；碱性氧化物；能与 CO2 反应（使石灰水变浑浊）；工业上制漂白粉（与 Cl2 反应）；用于改良酸性土壤。',
    'NaOH': '白色固体，俗称烧碱/火碱/苛性钠；易溶于水并放出大量热；强腐蚀性；具有碱的通性；能吸收空气中的 CO2 变质为 Na2CO3；与有机物（如油脂）发生皂化反应。',
    'KOH': '白色固体，强碱性；与 NaOH 性质相似；工业上用电解 KCl 溶液制备。',
    'Fe(OH)3': '红褐色沉淀；属于碱，能溶于酸生成 Fe3+ 盐；受热分解生成 Fe2O3 和 H2O；制备用 Fe3+ 盐与碱溶液反应，不使用氨水（会形成配合物）。',
    'Fe(OH)2': '白色沉淀，极不稳定，在空气中迅速被氧化为 Fe(OH)3（现象：白色→灰绿→红褐）；具有还原性。',
    'Cu(OH)2': '蓝色沉淀；受热分解生成黑色 CuO；能溶于酸生成 Cu2+ 盐；与醛类（如乙醛）在碱性条件下反应生成砖红色 Cu2O 沉淀（检验醛基的特征反应）。',
    'AgCl': '白色难溶物，不溶于水和稀硝酸；光照下分解变黑（Ag）；氨水可使其溶解生成 [Ag(NH3)2]+（银氨溶液）；检验 Cl- 的特征反应。',
    'AgBr': '淡黄色难溶物，不溶于水和稀硝酸；见光易分解，是感光材料的主要成分。',
    'AgI': '黄色难溶物，不溶于水和稀硝酸；光照下分解；可用于人工降雨。',
    'BaSO4': '白色沉淀，不溶于水和稀盐酸/稀硝酸；既不溶于酸也不溶于碱，检验 SO4^2- 的特征反应；医疗上用作"钡餐"。',
    'BaCO3': '白色沉淀，不溶于水但能溶于稀盐酸/稀硝酸（放出 CO2）；与 BaSO4 不同，能溶于酸。',
    'FeS': '黑褐色固体，难溶于水；能溶于稀盐酸/稀硫酸放出臭鸡蛋气味的 H2S 气体；属于弱酸盐。',
    'PbS': '黑色固体，难溶于水；能溶于稀硝酸（PbS + 4HNO3 → Pb(NO3)2 + S↓ + 2NO2↑ + 2H2O）。',
    'MnO2': '黑色固体；与浓盐酸在加热条件下反应生成 Cl2（实验室制 Cl2 的经典反应）；在 H2O2 分解中作催化剂；在 KClO3 加热分解中作催化剂。',
    'KMnO4': '紫黑色固体，易溶于水（紫红色溶液）；强氧化剂；常温下能与浓盐酸反应生成 Cl2；加热分解生成 K2MnO4、MnO2 和 O2；酸性溶液中氧化性最强（MnO4- + 8H+ + 5e- → Mn2+ + 4H2O）。',
    'K2MnO4': '暗绿色晶体，易溶于水（绿色溶液）；在酸性条件下不稳定，发生歧化生成 KMnO4 和 MnO2。',
    'K2Cr2O7': '橙红色晶体，易溶于水；强氧化剂；酸性溶液中被还原为 Cr3+（绿色）；与酒精、KBr 等反应；用于检验酒驾（橙色→绿色）。',
    'K2CrO4': '黄色晶体，易溶于水；铬酸根离子（CrO4^2-），在酸性条件下转变为重铬酸根（Cr2O7^2-，橙色）。',
    'HMnO4': '紫色溶液，强氧化性，不稳定易分解。',
    'H2SO3': '无色溶液，弱酸，不稳定，易分解为 SO2 和 H2O；具有还原性（能被 O2、Cl2、H2O2 等氧化为 H2SO4）。',
    'H2CO3': '弱酸（碳酸），不稳定，常温下分解为 CO2 和 H2O；能使紫色石蕊试液变红；CO2 的水溶液中主要以 CO2 形式存在，H2CO3 含量极少。',
    'HNO2': '亚硝酸，弱酸，不稳定，只存在于冷溶液中；既有氧化性又有还原性。',
    'HClO': '次氯酸，弱酸，强氧化剂；不稳定，见光易分解生成 HCl 和 O2；具有漂白性和杀菌性；漂白粉的有效成分是 Ca(ClO)2。',
    'Ca(ClO)2': '漂白粉的有效成分；与 CO2 和水反应生成 HClO（Ca(ClO)2 + CO2 + H2O → CaCO3↓ + 2HClO）；稀酸反应也能生成 HClO。',
    'NaClO': '漂白液的主要成分；与 CO2 反应生成 HClO，具有漂白和杀菌作用；与浓盐酸反应生成 Cl2（归中反应）。',
    'Na2CO3': '白色晶体，俗称苏打/纯碱；易溶于水，水溶液显碱性；能与酸反应放出 CO2；与 Ca(OH)2 反应生成 NaOH 和 CaCO3（制碱反应）；热稳定性强，受热不分解。',
    'NaHCO3': '白色晶体，俗称小苏打；能溶于水（溶解度比 Na2CO3 小）；水溶液显弱碱性；受热易分解生成 Na2CO3、CO2 和 H2O；与酸反应比 Na2CO3 更剧烈（立即放出气泡）。',
    'Fe2O3': '红棕色固体，俗称铁红；赤铁矿的主要成分；碱性氧化物，能溶于酸生成 Fe3+ 盐；工业上用 CO 还原冶炼铁。',
    'Fe3O4': '黑色固体，俗称磁性氧化铁；是 FeO·Fe2O3 的混合氧化物；能溶于酸生成 Fe2+ 和 Fe3+ 的混合盐。',
    'FeO': '黑色固体，不稳定，在空气中易被氧化为 Fe2O3；碱性氧化物，溶于酸生成 Fe2+ 盐。',
    'CuO': '黑色固体；溶于酸生成 Cu2+ 盐；加热条件下被 H2、CO、C 等还原为 Cu。',
    'Cu2O': '砖红色固体，碱性氧化物；溶于酸发生歧化生成 Cu 和 Cu2+ 盐。',
    'Al2O3': '白色固体；两性氧化物，既能与酸反应生成铝盐，又能与强碱反应生成偏铝酸盐；熔点高（2050℃），用作耐火材料；工业上用电解熔融 Al2O3 制备金属铝。',
    'SiO2': '无色晶体或白色粉末；原子晶体，熔点高；酸性氧化物，只能与 HF 和强碱反应；光导纤维的主要成分。',
    'CO2': '无色无味气体；酸性氧化物；不支持燃烧；与水反应生成碳酸；与 Na2O2 反应生成 O2。',
    'P2O5': '白色粉末，酸性氧化物；是 H3PO4 和 HPO3 的酸酐；吸水性极强，可用作干燥剂。',
    'Ca3(PO4)2': '白色固体，难溶于水；磷矿石的主要成分；工业上用 Ca3(PO4)2、C 和 SiO2 在电炉中反应制备 P4。',
    'NH4Cl': '白色晶体，易溶于水，水溶液显酸性；受热易分解生成 NH3 和 HCl；与碱（如 Ca(OH)2）共热放出 NH3（实验室制 NH3 的经典反应）。',
    '(NH4)2SO4': '白色晶体，易溶于水，水溶液显酸性；铵态氮肥，不能与碱性肥料混用。',
    'CH3COONa': '白色晶体，易溶于水，水溶液显碱性；与碱石灰共热（脱羧反应）生成 CH4。',
    'C2H5OH': '无色有特殊香味液体；可燃，燃烧生成 CO2 和 H2O；能与水以任意比例互溶；能与钠反应放出 H2（2C2H5OH + 2Na → 2C2H5ONa + H2↑）；催化氧化生成乙醛（Cu/△）。',
    'C2H5ONa': '白色粉末，遇水剧烈反应生成 C2H5OH 和 NaOH；强碱性。',
    'P4': '白磷，白色蜡状固体，剧毒；着火点低（40℃），在空气中易自燃，保存在水中；红磷（红棕色粉末）着火点较高（240℃），无毒；燃烧生成 P2O5。',
    'S': '淡黄色固体，俗称硫黄；不溶于水，微溶于酒精，易溶于 CS2；在空气中燃烧生成 SO2（淡蓝色火焰），在纯氧中燃烧发出蓝紫色火焰；能与金属、H2、NaOH 热溶液等反应。',
    'Si': '灰黑色有金属光泽的固体；原子晶体，熔点高；常温下稳定，只与 F2、HF、强碱反应；加热时能与 O2、Cl2、C 等反应；是重要的半导体材料。',
    'NaOH+H2O2': '（不存在，忽略）',
    'H2': '无色无味气体；最轻的气体；可燃，燃烧生成水（2H2+O2→2H2O）；与 O2 混合点燃爆炸（验纯后才能点燃）；能还原金属氧化物（如 CuO、Fe2O3）；工业上用电解水或天然气重整制备。',
    'N2': '无色无味气体；占空气约 78%；化学性质稳定，常温下难与其他物质反应；高温高压催化下与 H2 反应生成 NH3（合成氨）；高温下与 O2 反应生成 NO；是合成硝酸、氮肥的基础。',
    'NH4OH': '氢氧化铵，氨水的主要成分；弱碱，不稳定，易分解为 NH3 和 H2O。'
  };

  /* 化合物类别模板：匹配到某类就返回该类通用描述（让自动物种也有详细百科） */
  function matchClass(formula) {
    var p = F.parse(formula);
    if (!p) return null;
    var cnt = p.counts;
    /* 用 findAnionGroup 检测是否含有常见酸根（并区分是否有金属阳离子） */
    var nonmetals = {H:1,O:1,S:1,F:1,Cl:1,Br:1,I:1,N:1,C:1,Si:1,P:1,B:1,Se:1,As:1,He:1,Ne:1,Ar:1,Kr:1,Xe:1};
    var hasMetal = p.order.some(function (e) { return !nonmetals[e]; });
    /* NH4+ + HCO3/HSO3/H2PO4 等酸式盐（H 被两个基团共用，findAnionGroup 会算错倍数） */
    if (cnt['N'] && cnt['H'] >= 4 && cnt['C'] === 1 && cnt['O'] === 3 && cnt['H'] === 5) {
      return '碳酸氢盐，大多可溶于水；受热易分解生成碳酸盐、CO2 和水；能与酸反应比碳酸盐更剧烈（立即放出气泡）。';
    }
    if (cnt['N'] && cnt['H'] >= 4 && cnt['S'] === 1 && cnt['O'] === 3) {
      return '亚硫酸氢盐，可溶于水；受热易分解。';
    }
    var grp = null;
    if (hasMetal) grp = findAnionGroup(cnt, true);

    /* 1. 盐类（金属 + 酸根） */
    if (grp) {
      var an = grp.name;
      if (an === 'NO3') return '硝酸盐，大多易溶于水；受热分解规律：碱金属/碱土金属硝酸盐→亚硝酸盐+O2；较不活泼金属硝酸盐→金属氧化物+NO2+O2；贵金属硝酸盐→金属单质+NO2+O2；具有氧化性。';
      if (an === 'ClO3') return '氯酸盐，具有强氧化性；受热分解生成氯化物和氧气（2KClO3→2KCl+3O2↑，MnO2 催化）；与有机物混合可能爆炸。';
      if (an === 'ClO4') return '高氯酸盐，易溶于水；稳定，加热才分解；高氯酸是最强的无机酸之一。';
      if (an === 'ClO2') return '亚氯酸盐，具有漂白性和氧化性。';
      if (an === 'ClO') return '次氯酸盐，具有漂白性和杀菌性；与 CO2 和水反应生成次氯酸（如 NaClO+CO2+H2O→NaHCO3+HClO）。';
      if (an === 'BrO3') return '溴酸盐，具有强氧化性；受热分解生成溴化物和氧气。';
      if (an === 'IO3') return '碘酸盐，较稳定；碘酸钾是加碘食盐的添加剂。';
      if (an === 'MnO4') {
        var mTotal = 0;
        for (var mk in grp.remaining) { if (mk !== 'NH4' && mk !== 'H') mTotal += grp.remaining[mk]; }
        if (mTotal === grp.mult) return '高锰酸盐，强氧化剂；溶液显紫红色（MnO4^-）；酸性中氧化性最强（MnO4^- + 8H+ + 5e- → Mn2+ + 4H2O）；受热分解生成锰酸盐、二氧化锰和氧气。';
        return '锰酸盐，溶液显绿色（MnO4^2-）；在酸性条件下不稳定，发生歧化生成高锰酸盐（紫色）和二氧化锰。';
      }
      if (an === 'Cr2O7') return '重铬酸盐，橙红色晶体；强氧化剂；酸性中被还原为绿色 Cr3+；与酒精反应（检验酒驾：橙色→绿色）；碱性中转变为铬酸盐（黄色）。';
      if (an === 'CrO4') return '铬酸盐，黄色晶体；在碱性条件下稳定；酸性中转变为重铬酸根（橙色）。';
      if (an === 'SO4') return '硫酸盐；大多数易溶于水（BaSO4、PbSO4 难溶，CaSO4、SrSO4 微溶）；BaSO4 不溶于稀盐酸和稀硝酸（检验 SO4^2- 的特征反应）；较不活泼金属硫酸盐受热分解生成氧化物、SO2 和 O2。';
      if (an === 'HSO4') return '硫酸氢盐，可溶于水；相当于酸式盐，溶于水显酸性；受热分解为焦硫酸盐和水。';
      if (an === 'SO3') return '亚硫酸盐；除碱金属和铵盐外大多难溶；具有还原性，能被 O2、Cl2、HNO3 等氧化为硫酸盐；能与酸反应放出 SO2。';
      if (an === 'S2O3') return '硫代硫酸盐，易溶于水；酸性条件下分解生成 S、SO2 和水（S2O3^2- + 2H+ → S↓ + SO2↑ + H2O）；具有还原性。';
      if (an === 'CO3') return '碳酸盐；除 Na2CO3、K2CO3、(NH4)2CO3 外大多难溶于水；能与酸反应生成 CO2 和水（检验 CO3^2- 的特征反应）；受热分解生成金属氧化物和 CO2（Na2CO3、K2CO3 热稳定性极强）。';
      if (an === 'HCO3') return '碳酸氢盐，大多可溶于水；受热易分解生成碳酸盐、CO2 和水；能与酸反应比碳酸盐更剧烈（立即放出气泡）。';
      if (an === 'PO4') return '磷酸盐；除 Na3PO4、K3PO4、(NH4)3PO4 外大多难溶于水；能与酸反应生成磷酸二氢盐、磷酸氢盐或磷酸。';
      if (an === 'HPO4') return '磷酸氢盐，大多可溶于水；水溶液显弱碱性。';
      if (an === 'H2PO4') return '磷酸二氢盐，大多可溶于水；水溶液显弱酸性。';
      if (an === 'C2O4') return '草酸盐；除 Na2C2O4、K2C2O4、(NH4)2C2O4 外大多难溶于水（如 CaC2O4 难溶于水和醋酸）；能与稀硫酸反应生成草酸；草酸根具有还原性（能使酸性 KMnO4 褪色）。';
      if (an === 'CN') return '氰化物，剧毒！易溶于水（除 AgCN、Hg2(CN)2 等）；水溶液显碱性；与稀硫酸反应生成 HCN（剧毒气体）。';
      if (an === 'OH') {
        /* 氢氧化物已在前文 findAnionGroup 里匹配 */
        var met = p.order.filter(function (e) { return !NONMETALS[e]; });
        if (met.length >= 1) {
          if (met[0] === 'Al') return '两性氢氧化物，既能与酸反应生成铝盐，又能与强碱反应生成偏铝酸盐。';
          if (met[0] === 'Zn') return '两性氢氧化物，既能与酸反应，又能与强碱反应。';
          if (met[0] === 'Fe' && cnt['Fe'] === 1 && cnt['O'] >= 3) return '氢氧化铁，红褐色沉淀；难溶于水，能溶于酸；受热分解生成 Fe2O3 和 H2O。';
          if (met[0] === 'Cu') return '氢氧化铜，蓝色沉淀；难溶于水，能溶于酸；受热分解生成黑色 CuO；能与醛类反应生成砖红色 Cu2O（检验醛基）。';
          if (met[0] === 'Na' || met[0] === 'K') return '强碱，易溶于水，具有碱的通性，腐蚀性强。';
          if (met[0] === 'Ba' || met[0] === 'Sr') return '强碱，可溶于水。';
          if (met[0] === 'Ca') return '中强碱，微溶于水（石灰水）；工业上用于制漂白粉。';
          return '碱类物质，能与酸发生中和反应；除 Na/K/NH4/Ba/Sr 外大多难溶于水。';
        }
      }
      /* 卤化物：酸根匹配为 Cl/Br/I 单独原子 */
      if (an === 'Cl' || an === 'Br' || an === 'I' || an === 'F') {
        var hal = an;
        var met2 = p.order.filter(function (e) { return !NONMETALS[e]; });
        if (met2.length >= 1) {
          if (hal === 'Cl' && cnt['Ag']) return '氯化银，白色沉淀，不溶于稀硝酸；光照下分解变黑；氨水可使其溶解生成银氨溶液（检验 Cl^- 的特征反应）。';
          if (hal === 'Br' && cnt['Ag']) return '溴化银，淡黄色沉淀，不溶于稀硝酸；见光易分解，是感光材料的主要成分。';
          if (hal === 'I' && cnt['Ag']) return '碘化银，黄色沉淀，不溶于稀硝酸；见光易分解；可用于人工降雨。';
          return '金属卤化物；大多数易溶于水（AgX、PbX2、Hg2X2 难溶，CaF2 难溶）；能与硝酸银溶液反应生成卤化银沉淀（检验卤素离子）。';
        }
      }
    }
    /* 1.5. 硫化物 grp 匹配（an='S'） */
    if (grp && grp.name === 'S') {
      var metS = p.order.filter(function (e) { return !NONMETALS[e]; });
      if (metS.length >= 1) {
        if (metS[0] === 'Pb') return '硫化铅，黑色固体，难溶于水；能溶于稀硝酸。';
        if (metS[0] === 'Fe') return '硫化亚铁，黑色固体，难溶于水；能溶于稀盐酸/稀硫酸放出 H2S 气体。';
        return '金属硫化物；除 Na2S、K2S、(NH4)2S 易溶外，大多难溶；与稀酸反应放出 H2S 气体；难溶性硫化物可溶于硝酸（被氧化）。';
      }
    }
    /* 2. 过氧化物（含 O2 基团 + 金属） */
    if (cnt['O'] && cnt['O'] >= 2 && p.order.filter(function (e) { return !NONMETALS[e]; }).length >= 1) {
      /* 检查 O 是否成对（金属 + O2）：如 Na2O2 → cnt={Na:2, O:2} */
      var metEl = p.order.find(function (e) { return !NONMETALS[e]; });
      if (metEl && cnt['O'] % 2 === 0 && cnt[metEl] && cnt[metEl] === cnt['O'] / 2) {
        return '过氧化物，强氧化剂；含有过氧根离子（O2^2-）；能与 H2O 反应生成 O2 和碱；能与 CO2 反应生成碳酸盐和 O2（呼吸面具供氧剂）。';
      }
    }
    /* 3. 硫化物（金属 + S，无 O） */
    if (cnt['S'] && !cnt['O'] && !grp) {
      var met3 = p.order.filter(function (e) { return !NONMETALS[e]; });
      if (met3.length >= 1) {
        if (met3[0] === 'Pb') return '硫化铅，黑色固体，难溶于水；能溶于稀硝酸。';
        if (met3[0] === 'Fe') return '硫化亚铁，黑色固体，难溶于水；能溶于稀盐酸/稀硫酸放出 H2S 气体。';
        return '金属硫化物；除 Na2S、K2S、(NH4)2S 易溶外，大多难溶；与稀酸反应放出 H2S 气体；难溶性硫化物可溶于硝酸（被氧化）。';
      }
    }
    /* 4. 氧化物（二元，金属 + O，无其他） */
    if (p.order.length === 2 && cnt['O']) {
      var otherEl = p.order.filter(function (e) { return e !== 'O'; })[0];
      if (!NONMETALS[otherEl]) {
        if (ALKALI[otherEl] && cnt[otherEl] >= 2) return '碱性氧化物，与水剧烈反应生成碱（如 Na2O + H2O → 2NaOH）；能与酸反应生成盐和水。';
        if (ALK_EARTH[otherEl] && cnt[otherEl] === 1 && cnt['O'] === 1) return '碱性氧化物；与水反应生成碱（如 CaO + H2O → Ca(OH)2）；能与酸反应生成盐和水。';
        if (otherEl === 'Al') return '两性氧化物，既能与酸反应生成铝盐，又能与强碱反应生成偏铝酸盐；熔点高，用作耐火材料。';
        if (otherEl === 'Zn') return '两性氧化物，既能与酸反应，又能与强碱反应。';
        if (otherEl === 'Fe' && cnt['O'] === 3) return '三氧化二铁，红棕色固体，俗称铁红；碱性氧化物，能溶于酸生成 Fe3+ 盐；工业上用 CO 还原冶炼铁。';
        if (otherEl === 'Fe' && cnt['O'] === 4) return '四氧化三铁，黑色固体；是 FeO·Fe2O3 的混合氧化物；能溶于酸生成 Fe2+ 和 Fe3+ 的混合盐。';
        return '氧化物；能与酸反应生成盐和水；大多数难溶于水。';
      }
    }
    /* 5. 单质 */
    if (p.order.length === 1 && !p.charge) return '单质；化学性质取决于该元素在周期表中的位置和原子结构。';
    /* 6. 最后兜底：c.a/c.b（从 Compounds 字段补充） */
    var c = C.find && C.find(formula);
    if (c) {
      if (c.a && c.b) return '两性化合物，既能与酸反应，又能与强碱反应。';
      if (c.a) return '溶于水显酸性的化合物，能与碱发生中和反应生成盐和水。';
      if (c.b) return '溶于水显碱性的化合物，能与酸发生中和反应生成盐和水。';
    }
    return null;
  }

  function buildChemical(formula, cn, idx) {
    /* 1. 精确匹配字典 */
    if (SPECIFIC_CHEM[formula]) return SPECIFIC_CHEM[formula];
    /* 2. 类别模板匹配 */
    var cls = matchClass(formula);
    if (cls) return cls;
    /* 3. 反应行为自动归纳 */
    var parts = [];
    var c = C.find && C.find(formula);
    if (c) {
      if (c.a && c.b) parts.push('显两性，既能与酸反应又能与碱反应');
      else if (c.a) parts.push('水溶液中显酸性，可与碱发生中和反应');
      else if (c.b) parts.push('水溶液中显碱性，可与酸发生中和反应');
    }
    var bl = B && B[formula];
    if (bl) parts.push('具有' + bl.label);
    if (idx) {
      if (idx.reactAcid >= 3 && idx.reactBase >= 3) parts.push('既能与酸又能与碱反应');
      else if (idx.reactAcid >= 3) parts.push('能与酸发生反应');
      else if (idx.reactBase >= 3) parts.push('能与碱发生反应');
      if (idx.withH2SO4 >= 2) parts.push('在硫酸体系中频繁出现');
      if (idx.withHNO3 >= 2) parts.push('能参与硝酸体系的反应');
      if (idx.withHCl >= 2) parts.push('能参与盐酸体系的反应');
      if (idx.withO2 >= 2) parts.push('可在氧气中被氧化');
      if (idx.withH2 >= 2) parts.push('可与氢气发生反应');
      if (idx.withCl2 >= 2) parts.push('能与氯气发生反应');
      if (idx.gasForm >= 2) parts.push('反应中可作为气体生成');
    }
    if (parts.length === 0) parts.push('可查阅相关反应列表');
    return parts.join('；') + '。';
  }

  root.PropertyInfer = {
    inferChinese: inferChinese,
    buildPhysical: buildPhysical,
    buildChemical: buildChemical
  };
})(typeof window !== 'undefined' ? window : globalThis);
