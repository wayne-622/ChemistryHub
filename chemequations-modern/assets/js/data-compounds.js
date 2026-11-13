/* 化合物资料库 —— 本地静态数据 */
(function (root) {
  'use strict';

  function C(f, zh, en, st, o) {
    return Object.assign({ f: f, zh: zh, en: en, st: st }, o || {});
  }

  var list = [
    /* ---------- 单质与气体 ---------- */
    C('H2', '氢气', 'Hydrogen', 'g', { ox: { H: 0 }, ap: '无色无味的气体', ae: ['Hydrogen gas'] }),
    C('O2', '氧气', 'Oxygen', 'g', { ox: { O: 0 }, ap: '无色无味的气体', ae: ['Oxygen gas'] }),
    C('N2', '氮气', 'Nitrogen', 'g', { ox: { N: 0 }, ap: '无色无味的气体' }),
    C('Cl2', '氯气', 'Chlorine', 'g', { ox: { Cl: 0 }, ap: '黄绿色有刺激性气味的气体' }),
    C('F2', '氟气', 'Fluorine', 'g', { ox: { F: 0 }, ap: '淡黄绿色气体' }),
    C('Br2', '溴', 'Bromine', 'l', { ox: { Br: 0 }, ap: '深红棕色发烟液体' }),
    C('I2', '碘', 'Iodine', 's', { ox: { I: 0 }, ap: '紫黑色有光泽的固体' }),
    C('O3', '臭氧', 'Ozone', 'g', { ox: { O: 0 }, ap: '有特殊臭味的淡蓝色气体' }),
    C('C', '碳', 'Carbon', 's', { ox: { C: 0 }, al: ['木炭', '焦炭'], ap: '黑色固体' }),
    C('S', '硫', 'Sulfur', 's', { ox: { S: 0 }, al: ['硫磺'], ap: '淡黄色晶体' }),
    C('P', '磷', 'Phosphorus', 's', { ox: { P: 0 }, ap: '白磷或红磷固体' }),
    C('Na', '钠', 'Sodium', 's', { ox: { Na: 0 }, ap: '银白色柔软金属' }),
    C('K', '钾', 'Potassium', 's', { ox: { K: 0 }, ap: '银白色柔软金属' }),
    C('Ca', '钙', 'Calcium', 's', { ox: { Ca: 0 }, ap: '银白色金属' }),
    C('Mg', '镁', 'Magnesium', 's', { ox: { Mg: 0 }, ap: '银白色金属' }),
    C('Al', '铝', 'Aluminium', 's', { ox: { Al: 0 }, ap: '银白色金属' }),
    C('Fe', '铁', 'Iron', 's', { ox: { Fe: 0 }, ap: '银白色金属' }),
    C('Cu', '铜', 'Copper', 's', { ox: { Cu: 0 }, ap: '紫红色金属' }),
    C('Zn', '锌', 'Zinc', 's', { ox: { Zn: 0 }, ap: '银白色金属' }),
    C('Ag', '银', 'Silver', 's', { ox: { Ag: 0 }, ap: '银白色金属' }),
    C('Hg', '汞', 'Mercury', 'l', { ox: { Hg: 0 }, al: ['水银'], ap: '银白色液态金属' }),
    C('Pb', '铅', 'Lead', 's', { ox: { Pb: 0 }, ap: '蓝灰色金属' }),

    /* ---------- 水与酸碱 ---------- */
    C('H2O', '水', 'Water', 'l', { ox: { H: 1, O: -2 }, al: ['氧化氢', '一氧化二氢'], ae: ['Oxidane'], ap: '无色无味的液体' }),
    C('H2O2', '过氧化氢', 'Hydrogen peroxide', 'l', { ox: { H: 1, O: -1 }, al: ['双氧水'], ap: '无色透明液体' }),
    C('HClO', '次氯酸', 'Hypochlorous acid', 'l', { ox: { H: 1, Cl: 1, O: -2 }, a: 1, ap: '仅存在于水溶液中，具有漂白性' }),
    C('HCl', '氯化氢', 'Hydrogen chloride', 'g', { ox: { H: 1, Cl: -1 }, al: ['盐酸', '氢氯酸'], ae: ['Hydrochloric acid'], a: 1, ap: '无色有刺激性气味的气体；盐酸为无色液体' }),
    C('HBr', '溴化氢', 'Hydrogen bromide', 'g', { ox: { H: 1, Br: -1 }, al: ['氢溴酸'], ae: ['Hydrobromic acid'], a: 1, ap: '无色气体' }),
    C('HI', '碘化氢', 'Hydrogen iodide', 'g', { ox: { H: 1, I: -1 }, al: ['氢碘酸'], ae: ['Hydroiodic acid'], a: 1, ap: '无色气体' }),
    C('HF', '氟化氢', 'Hydrogen fluoride', 'g', { ox: { H: 1, F: -1 }, al: ['氢氟酸'], ae: ['Hydrofluoric acid'], a: 1, ap: '无色气体' }),
    C('H2S', '硫化氢', 'Hydrogen sulfide', 'g', { ox: { H: 1, S: -2 }, a: 1, ap: '无色有臭鸡蛋气味的气体' }),
    C('H2SO4', '硫酸', 'Sulfuric acid', 'l', { ox: { H: 1, S: 6, O: -2 }, al: ['浓硫酸', '稀硫酸'], ae: ['Sulfuric acid'], a: 1, ap: '无色油状液体' }),
    C('H2SO3', '亚硫酸', 'Sulfurous acid', 'l', { ox: { H: 1, S: 4, O: -2 }, a: 1, ap: '仅存在于水溶液中' }),
    C('HNO3', '硝酸', 'Nitric acid', 'l', { ox: { H: 1, N: 5, O: -2 }, al: ['浓硝酸', '稀硝酸'], ae: ['Nitric acid'], a: 1, ap: '无色易挥发液体' }),
    C('HNO2', '亚硝酸', 'Nitrous acid', 'l', { ox: { H: 1, N: 3, O: -2 }, a: 1, ap: '淡蓝色溶液' }),
    C('H3PO4', '磷酸', 'Phosphoric acid', 's', { ox: { H: 1, P: 5, O: -2 }, a: 1, ap: '无色晶体' }),
    C('H2CO3', '碳酸', 'Carbonic acid', 'l', { ox: { H: 1, C: 4, O: -2 }, a: 1, ap: '仅存在于水溶液中' }),
    C('CH3COOH', '乙酸', 'Acetic acid', 'l', { ox: { C: 0, H: 1, O: -2 }, al: ['醋酸'], ae: ['Ethanoic acid'], a: 1, ap: '无色有刺激性酸味的液体' }),
    C('H2C2O4', '草酸', 'Oxalic acid', 's', { ox: { H: 1, C: 3, O: -2 }, ae: ['Ethanedioic acid'], a: 1, ap: '无色晶体' }),
    C('H3BO3', '硼酸', 'Boric acid', 's', { ox: { H: 1, B: 3, O: -2 }, a: 1, ap: '白色晶体' }),
    C('NaOH', '氢氧化钠', 'Sodium hydroxide', 's', { ox: { Na: 1, O: -2, H: 1 }, al: ['烧碱', '火碱', '苛性钠'], ae: ['Caustic soda'], b: 1, ap: '白色不透明固体' }),
    C('KOH', '氢氧化钾', 'Potassium hydroxide', 's', { ox: { K: 1, O: -2, H: 1 }, al: ['苛性钾'], b: 1, ap: '白色固体' }),
    C('Ca(OH)2', '氢氧化钙', 'Calcium hydroxide', 's', { ox: { Ca: 2, O: -2, H: 1 }, al: ['熟石灰', '消石灰'], ae: ['Slaked lime'], b: 1, ap: '白色粉末' }),
    C('Ba(OH)2', '氢氧化钡', 'Barium hydroxide', 's', { ox: { Ba: 2, O: -2, H: 1 }, b: 1, ap: '白色固体' }),
    C('Mg(OH)2', '氢氧化镁', 'Magnesium hydroxide', 's', { ox: { Mg: 2, O: -2, H: 1 }, b: 1, ins: 1, ap: '白色固体' }),
    C('Al(OH)3', '氢氧化铝', 'Aluminium hydroxide', 's', { ox: { Al: 3, O: -2, H: 1 }, b: 1, ins: 1, ap: '白色胶状沉淀' }),
    C('Fe(OH)2', '氢氧化亚铁', 'Iron(II) hydroxide', 's', { ox: { Fe: 2, O: -2, H: 1 }, b: 1, ins: 1, ap: '白色沉淀，易被氧化' }),
    C('Fe(OH)3', '氢氧化铁', 'Iron(III) hydroxide', 's', { ox: { Fe: 3, O: -2, H: 1 }, b: 1, ins: 1, ap: '红褐色沉淀' }),
    C('Cu(OH)2', '氢氧化铜', 'Copper(II) hydroxide', 's', { ox: { Cu: 2, O: -2, H: 1 }, b: 1, ins: 1, ap: '蓝色沉淀' }),
    C('Zn(OH)2', '氢氧化锌', 'Zinc hydroxide', 's', { ox: { Zn: 2, O: -2, H: 1 }, b: 1, ins: 1, ap: '白色沉淀' }),
    C('NH3', '氨', 'Ammonia', 'g', { ox: { N: -3, H: 1 }, al: ['氨气'], b: 1, ap: '无色有刺激性气味的气体' }),
    C('NH4OH', '氨水', 'Ammonium hydroxide', 'l', { ox: { N: -3, H: 1, O: -2 }, al: ['氢氧化铵'], b: 1, ap: '无色溶液' }),

    /* ---------- 铵盐与钠盐 ---------- */
    C('NH4Cl', '氯化铵', 'Ammonium chloride', 's', { ox: { N: -3, H: 1, Cl: -1 }, a: 1, ap: '白色晶体' }),
    C('NH4NO3', '硝酸铵', 'Ammonium nitrate', 's', { ox: { N: 1, H: 1, O: -2 }, ap: '白色晶体' }),
    C('(NH4)2SO4', '硫酸铵', 'Ammonium sulfate', 's', { ox: { N: -3, H: 1, S: 6, O: -2 }, ap: '白色晶体' }),
    C('NH4HCO3', '碳酸氢铵', 'Ammonium bicarbonate', 's', { ox: { N: -3, H: 1, C: 4, O: -2 }, ap: '白色晶体' }),
    C('NaCl', '氯化钠', 'Sodium chloride', 's', { ox: { Na: 1, Cl: -1 }, al: ['食盐', '盐'], ae: ['Table salt'], ap: '白色晶体' }),
    C('KCl', '氯化钾', 'Potassium chloride', 's', { ox: { K: 1, Cl: -1 }, ap: '白色晶体' }),
    C('CaCl2', '氯化钙', 'Calcium chloride', 's', { ox: { Ca: 2, Cl: -1 }, ap: '白色固体' }),
    C('BaCl2', '氯化钡', 'Barium chloride', 's', { ox: { Ba: 2, Cl: -1 }, ap: '白色晶体' }),
    C('MgCl2', '氯化镁', 'Magnesium chloride', 's', { ox: { Mg: 2, Cl: -1 }, ap: '白色晶体' }),
    C('AlCl3', '氯化铝', 'Aluminium chloride', 's', { ox: { Al: 3, Cl: -1 }, ap: '白色固体' }),
    C('FeCl2', '氯化亚铁', 'Iron(II) chloride', 's', { ox: { Fe: 2, Cl: -1 }, ap: '绿色固体' }),
    C('FeCl3', '氯化铁', 'Iron(III) chloride', 's', { ox: { Fe: 3, Cl: -1 }, ap: '棕黑色固体' }),
    C('CuCl2', '氯化铜', 'Copper(II) chloride', 's', { ox: { Cu: 2, Cl: -1 }, ap: '棕黄色固体' }),
    C('ZnCl2', '氯化锌', 'Zinc chloride', 's', { ox: { Zn: 2, Cl: -1 }, ap: '白色固体' }),
    C('AgCl', '氯化银', 'Silver chloride', 's', { ox: { Ag: 1, Cl: -1 }, ins: 1, ap: '白色沉淀' }),
    C('NaBr', '溴化钠', 'Sodium bromide', 's', { ox: { Na: 1, Br: -1 }, ap: '白色晶体' }),
    C('KBr', '溴化钾', 'Potassium bromide', 's', { ox: { K: 1, Br: -1 }, ap: '白色晶体' }),
    C('NaI', '碘化钠', 'Sodium iodide', 's', { ox: { Na: 1, I: -1 }, ap: '白色晶体' }),
    C('KI', '碘化钾', 'Potassium iodide', 's', { ox: { K: 1, I: -1 }, ap: '白色晶体' }),
    C('AgBr', '溴化银', 'Silver bromide', 's', { ox: { Ag: 1, Br: -1 }, ins: 1, ap: '淡黄色沉淀' }),
    C('AgI', '碘化银', 'Silver iodide', 's', { ox: { Ag: 1, I: -1 }, ins: 1, ap: '黄色沉淀' }),
    C('PbI2', '碘化铅', 'Lead(II) iodide', 's', { ox: { Pb: 2, I: -1 }, ins: 1, ap: '黄色沉淀' }),
    C('PbCl2', '氯化铅', 'Lead(II) chloride', 's', { ox: { Pb: 2, Cl: -1 }, ins: 1, ap: '白色沉淀' }),
    C('FeBr3', '溴化铁', 'Iron(III) bromide', 's', { ox: { Fe: 3, Br: -1 }, ap: '红棕色固体' }),

    C('NaNO3', '硝酸钠', 'Sodium nitrate', 's', { ox: { Na: 1, N: 5, O: -2 }, al: ['智利硝石'], ap: '白色晶体' }),
    C('KNO3', '硝酸钾', 'Potassium nitrate', 's', { ox: { K: 1, N: 5, O: -2 }, al: ['硝石'], ap: '白色晶体' }),
    C('AgNO3', '硝酸银', 'Silver nitrate', 's', { ox: { Ag: 1, N: 5, O: -2 }, ap: '无色晶体' }),
    C('Ca(NO3)2', '硝酸钙', 'Calcium nitrate', 's', { ox: { Ca: 2, N: 5, O: -2 }, ap: '白色晶体' }),
    C('Cu(NO3)2', '硝酸铜', 'Copper(II) nitrate', 's', { ox: { Cu: 2, N: 5, O: -2 }, ap: '蓝色晶体' }),
    C('Fe(NO3)3', '硝酸铁', 'Iron(III) nitrate', 's', { ox: { Fe: 3, N: 5, O: -2 }, ap: '淡紫色晶体' }),
    C('Fe(NO3)2', '硝酸亚铁', 'Iron(II) nitrate', 's', { ox: { Fe: 2, N: 5, O: -2 }, ap: '浅绿色晶体' }),
    C('Pb(NO3)2', '硝酸铅', 'Lead(II) nitrate', 's', { ox: { Pb: 2, N: 5, O: -2 }, ap: '白色晶体' }),
    C('Ba(NO3)2', '硝酸钡', 'Barium nitrate', 's', { ox: { Ba: 2, N: 5, O: -2 }, ap: '白色晶体' }),
    C('NaNO2', '亚硝酸钠', 'Sodium nitrite', 's', { ox: { Na: 1, N: 3, O: -2 }, ap: '白色晶体' }),
    C('KNO2', '亚硝酸钾', 'Potassium nitrite', 's', { ox: { K: 1, N: 3, O: -2 }, ap: '白色晶体' }),

    C('Na2CO3', '碳酸钠', 'Sodium carbonate', 's', { ox: { Na: 1, C: 4, O: -2 }, al: ['纯碱', '苏打'], ae: ['Soda ash'], b: 1, ap: '白色粉末' }),
    C('K2CO3', '碳酸钾', 'Potassium carbonate', 's', { ox: { K: 1, C: 4, O: -2 }, b: 1, ap: '白色粉末' }),
    C('CaCO3', '碳酸钙', 'Calcium carbonate', 's', { ox: { Ca: 2, C: 4, O: -2 }, al: ['石灰石', '大理石'], ae: ['Limestone'], b: 1, ins: 1, ap: '白色固体' }),
    C('BaCO3', '碳酸钡', 'Barium carbonate', 's', { ox: { Ba: 2, C: 4, O: -2 }, b: 1, ins: 1, ap: '白色沉淀' }),
    C('Ag2CO3', '碳酸银', 'Silver carbonate', 's', { ox: { Ag: 1, C: 4, O: -2 }, ins: 1, ap: '淡黄色沉淀' }),
    C('NaHCO3', '碳酸氢钠', 'Sodium bicarbonate', 's', { ox: { Na: 1, H: 1, C: 4, O: -2 }, al: ['小苏打'], ae: ['Baking soda'], b: 1, ap: '白色晶体' }),
    C('Ca(HCO3)2', '碳酸氢钙', 'Calcium bicarbonate', 's', { ox: { Ca: 2, H: 1, C: 4, O: -2 }, ap: '仅存在于水溶液中' }),

    C('Na2SO4', '硫酸钠', 'Sodium sulfate', 's', { ox: { Na: 1, S: 6, O: -2 }, ap: '白色晶体' }),
    C('K2SO4', '硫酸钾', 'Potassium sulfate', 's', { ox: { K: 1, S: 6, O: -2 }, ap: '白色晶体' }),
    C('CuSO4', '硫酸铜', 'Copper(II) sulfate', 's', { ox: { Cu: 2, S: 6, O: -2 }, al: ['胆矾', '蓝矾'], ap: '白色粉末；五水合物为蓝色晶体' }),
    C('FeSO4', '硫酸亚铁', 'Iron(II) sulfate', 's', { ox: { Fe: 2, S: 6, O: -2 }, al: ['绿矾'], ap: '浅绿色晶体' }),
    C('ZnSO4', '硫酸锌', 'Zinc sulfate', 's', { ox: { Zn: 2, S: 6, O: -2 }, al: ['皓矾'], ap: '白色晶体' }),
    C('MgSO4', '硫酸镁', 'Magnesium sulfate', 's', { ox: { Mg: 2, S: 6, O: -2 }, al: ['泻盐'], ap: '白色晶体' }),
    C('CaSO4', '硫酸钙', 'Calcium sulfate', 's', { ox: { Ca: 2, S: 6, O: -2 }, al: ['石膏'], ae: ['Gypsum'], ins: 1, ap: '白色固体' }),
    C('BaSO4', '硫酸钡', 'Barium sulfate', 's', { ox: { Ba: 2, S: 6, O: -2 }, al: ['重晶石'], ins: 1, ap: '白色沉淀' }),
    C('Ag2SO4', '硫酸银', 'Silver sulfate', 's', { ox: { Ag: 1, S: 6, O: -2 }, ins: 1, ap: '白色晶体' }),
    C('Al2(SO4)3', '硫酸铝', 'Aluminium sulfate', 's', { ox: { Al: 3, S: 6, O: -2 }, ap: '白色晶体' }),
    C('Fe2(SO4)3', '硫酸铁', 'Iron(III) sulfate', 's', { ox: { Fe: 3, S: 6, O: -2 }, ap: '淡黄色固体' }),
    C('PbSO4', '硫酸铅', 'Lead(II) sulfate', 's', { ox: { Pb: 2, S: 6, O: -2 }, ins: 1, ap: '白色沉淀' }),
    C('Na2SO3', '亚硫酸钠', 'Sodium sulfite', 's', { ox: { Na: 1, S: 4, O: -2 }, b: 1, ap: '白色晶体' }),
    C('CaSO3', '亚硫酸钙', 'Calcium sulfite', 's', { ox: { Ca: 2, S: 4, O: -2 }, ins: 1, ap: '白色沉淀' }),
    C('NaHSO3', '亚硫酸氢钠', 'Sodium bisulfite', 's', { ox: { Na: 1, H: 1, S: 4, O: -2 }, ap: '白色晶体' }),
    C('NaHSO4', '硫酸氢钠', 'Sodium bisulfate', 's', { ox: { Na: 1, H: 1, S: 6, O: -2 }, a: 1, ap: '白色晶体' }),

    C('Na2S', '硫化钠', 'Sodium sulfide', 's', { ox: { Na: 1, S: -2 }, ap: '白色固体' }),
    C('FeS', '硫化亚铁', 'Iron(II) sulfide', 's', { ox: { Fe: 2, S: -2 }, ins: 1, ap: '黑色固体' }),
    C('CuS', '硫化铜', 'Copper(II) sulfide', 's', { ox: { Cu: 2, S: -2 }, ins: 1, ap: '黑色沉淀' }),
    C('ZnS', '硫化锌', 'Zinc sulfide', 's', { ox: { Zn: 2, S: -2 }, ins: 1, ap: '白色沉淀' }),
    C('FeS2', '二硫化亚铁', 'Iron(II) disulfide', 's', { ox: { Fe: 2, S: -1 }, al: ['黄铁矿'], ap: '黄色晶体' }),

    C('Na3PO4', '磷酸钠', 'Sodium phosphate', 's', { ox: { Na: 1, P: 5, O: -2 }, ap: '白色晶体' }),
    C('K3PO4', '磷酸钾', 'Potassium phosphate', 's', { ox: { K: 1, P: 5, O: -2 }, ap: '白色晶体' }),
    C('Ca3(PO4)2', '磷酸钙', 'Calcium phosphate', 's', { ox: { Ca: 2, P: 5, O: -2 }, ins: 1, ap: '白色固体' }),
    C('NaH2PO4', '磷酸二氢钠', 'Sodium dihydrogen phosphate', 's', { ox: { Na: 1, H: 1, P: 5, O: -2 }, ap: '白色晶体' }),
    C('Na2HPO4', '磷酸氢二钠', 'Disodium hydrogen phosphate', 's', { ox: { Na: 1, H: 1, P: 5, O: -2 }, ap: '白色晶体' }),
    C('Na2SiO3', '硅酸钠', 'Sodium silicate', 's', { ox: { Na: 1, Si: 4, O: -2 }, al: ['水玻璃', '泡花碱'], ap: '白色固体' }),
    C('CaSiO3', '硅酸钙', 'Calcium silicate', 's', { ox: { Ca: 2, Si: 4, O: -2 }, ins: 1, ap: '白色固体' }),
    C('H2SiO3', '硅酸', 'Silicic acid', 's', { ox: { H: 1, Si: 4, O: -2 }, ins: 1, ap: '白色胶状沉淀' }),
    C('NaAlO2', '偏铝酸钠', 'Sodium aluminate', 's', { ox: { Na: 1, Al: 3, O: -2 }, ap: '白色固体' }),
    C('Na2B4O7', '硼砂', 'Sodium tetraborate', 's', { ox: { Na: 1, B: 3, O: -2 }, al: ['四硼酸钠'], ap: '白色晶体' }),

    /* ---------- 氧化还原剂 ---------- */
    C('KMnO4', '高锰酸钾', 'Potassium permanganate', 's', { ox: { K: 1, Mn: 7, O: -2 }, al: ['灰锰氧'], ap: '紫黑色晶体' }),
    C('K2MnO4', '锰酸钾', 'Potassium manganate', 's', { ox: { K: 1, Mn: 6, O: -2 }, ap: '深绿色晶体' }),
    C('MnCl2', '氯化锰', 'Manganese(II) chloride', 's', { ox: { Mn: 2, Cl: -1 }, ap: '粉红色晶体' }),
    C('MnSO4', '硫酸锰', 'Manganese(II) sulfate', 's', { ox: { Mn: 2, S: 6, O: -2 }, ap: '淡粉红色晶体' }),
    C('MnO2', '二氧化锰', 'Manganese dioxide', 's', { ox: { Mn: 4, O: -2 }, ap: '黑色固体' }),
    C('K2Cr2O7', '重铬酸钾', 'Potassium dichromate', 's', { ox: { K: 1, Cr: 6, O: -2 }, ap: '橙红色晶体' }),
    C('K2CrO4', '铬酸钾', 'Potassium chromate', 's', { ox: { K: 1, Cr: 6, O: -2 }, ap: '黄色晶体' }),
    C('CrCl3', '氯化铬', 'Chromium(III) chloride', 's', { ox: { Cr: 3, Cl: -1 }, ap: '紫色晶体' }),
    C('Cr2(SO4)3', '硫酸铬', 'Chromium(III) sulfate', 's', { ox: { Cr: 3, S: 6, O: -2 }, ap: '绿色晶体' }),
    C('KClO3', '氯酸钾', 'Potassium chlorate', 's', { ox: { K: 1, Cl: 5, O: -2 }, ap: '白色晶体' }),
    C('NaClO', '次氯酸钠', 'Sodium hypochlorite', 's', { ox: { Na: 1, Cl: 1, O: -2 }, al: ['漂白液'], ap: '淡黄绿色溶液' }),
    C('Ca(ClO)2', '次氯酸钙', 'Calcium hypochlorite', 's', { ox: { Ca: 2, Cl: 1, O: -2 }, al: ['漂白粉'], ap: '白色粉末' }),
    C('Na2O2', '过氧化钠', 'Sodium peroxide', 's', { ox: { Na: 1, O: -1 }, ap: '淡黄色粉末' }),
    C('KO2', '超氧化钾', 'Potassium superoxide', 's', { ox: { K: 1, O: -0.5 }, ap: '黄色固体' }),
    C('CaC2', '碳化钙', 'Calcium carbide', 's', { ox: { Ca: 2, C: -1 }, al: ['电石'], ap: '灰黑色固体' }),

    /* ---------- 氧化物 ---------- */
    C('CaO', '氧化钙', 'Calcium oxide', 's', { ox: { Ca: 2, O: -2 }, al: ['生石灰'], ae: ['Quicklime'],  b: 1, ap: '白色固体' }),
    C('Na2O', '氧化钠', 'Sodium oxide', 's', { ox: { Na: 1, O: -2 },  b: 1, ap: '白色固体' }),
    C('K2O', '氧化钾', 'Potassium oxide', 's', { ox: { K: 1, O: -2 },  b: 1, ap: '白色固体' }),
    C('MgO', '氧化镁', 'Magnesium oxide', 's', { ox: { Mg: 2, O: -2 },  b: 1, ap: '白色固体' }),
    C('Al2O3', '氧化铝', 'Aluminium oxide', 's', { ox: { Al: 3, O: -2 }, al: ['刚玉'],  b: 1, ap: '白色固体' }),
    C('Fe2O3', '氧化铁', 'Iron(III) oxide', 's', { ox: { Fe: 3, O: -2 }, al: ['三氧化二铁', '铁红'],  b: 1, ap: '红棕色粉末' }),
    C('Fe3O4', '四氧化三铁', 'Iron(II,III) oxide', 's', { ox: { Fe: 8 / 3, O: -2 }, al: ['磁铁矿'], ap: '黑色晶体' }),
    C('FeO', '氧化亚铁', 'Iron(II) oxide', 's', { ox: { Fe: 2, O: -2 },  b: 1, ap: '黑色粉末' }),
    C('CuO', '氧化铜', 'Copper(II) oxide', 's', { ox: { Cu: 2, O: -2 },  b: 1, ap: '黑色粉末' }),
    C('Cu2O', '氧化亚铜', 'Copper(I) oxide', 's', { ox: { Cu: 1, O: -2 }, ap: '红色固体' }),
    C('ZnO', '氧化锌', 'Zinc oxide', 's', { ox: { Zn: 2, O: -2 }, ap: '白色粉末' }),
    C('SO2', '二氧化硫', 'Sulfur dioxide', 'g', { ox: { S: 4, O: -2 },  a: 1, ap: '无色有刺激性气味的气体' }),
    C('SO3', '三氧化硫', 'Sulfur trioxide', 'g', { ox: { S: 6, O: -2 },  a: 1, ap: '无色易挥发固体' }),
    C('CO', '一氧化碳', 'Carbon monoxide', 'g', { ox: { C: 2, O: -2 },  a: 1, ap: '无色无味的有毒气体' }),
    C('CO2', '二氧化碳', 'Carbon dioxide', 'g', { ox: { C: 4, O: -2 }, al: ['碳酸气'],  a: 1, ap: '无色无味的气体' }),
    C('NO', '一氧化氮', 'Nitric oxide', 'g', { ox: { N: 2, O: -2 }, ap: '无色气体' }),
    C('NO2', '二氧化氮', 'Nitrogen dioxide', 'g', { ox: { N: 4, O: -2 }, ap: '红棕色有刺激性气味的气体' }),
    C('N2O', '一氧化二氮', 'Nitrous oxide', 'g', { ox: { N: 1, O: -2 }, al: ['笑气'], ap: '无色气体' }),
    C('N2O5', '五氧化二氮', 'Dinitrogen pentoxide', 's', { ox: { N: 5, O: -2 }, ap: '白色晶体' }),
    C('P2O5', '五氧化二磷', 'Phosphorus pentoxide', 's', { ox: { P: 5, O: -2 },  a: 1, ap: '白色粉末' }),
    C('SiO2', '二氧化硅', 'Silicon dioxide', 's', { ox: { Si: 4, O: -2 }, al: ['石英', '沙子'], ae: ['Silica'],  a: 1, ap: '无色晶体或白色粉末' }),
    C('Ag2O', '氧化银', 'Silver oxide', 's', { ox: { Ag: 1, O: -2 },  b: 1, ap: '棕黑色固体' }),
    C('HgO', '氧化汞', 'Mercury(II) oxide', 's', { ox: { Hg: 2, O: -2 }, ap: '红色或黄色固体' }),

    /* ---------- 有机物 ---------- */
    C('CH4', '甲烷', 'Methane', 'g', { ox: { C: -4, H: 1 }, al: ['沼气', '天然气'], ap: '无色无味的气体' }),
    C('C2H6', '乙烷', 'Ethane', 'g', { ox: { C: -3, H: 1 }, ap: '无色气体' }),
    C('C3H8', '丙烷', 'Propane', 'g', { ox: { C: -8 / 3, H: 1 }, ap: '无色气体' }),
    C('C4H10', '丁烷', 'Butane', 'g', { ox: { C: -2.5, H: 1 }, ap: '无色气体' }),
    C('C2H4', '乙烯', 'Ethene', 'g', { ox: { C: -2, H: 1 }, ae: ['Ethylene'], ap: '无色气体' }),
    C('C2H2', '乙炔', 'Ethyne', 'g', { ox: { C: -1, H: 1 }, ae: ['Acetylene'], ap: '无色气体' }),
    C('C6H6', '苯', 'Benzene', 'l', { ox: { C: -1, H: 1 }, ap: '无色有特殊气味的液体' }),
    C('C6H12O6', '葡萄糖', 'Glucose', 's', { ox: { C: 0, H: 1, O: -2 }, ap: '白色晶体' }),
    C('C12H22O11', '蔗糖', 'Sucrose', 's', { ox: { C: 0, H: 1, O: -2 }, al: ['白糖'], ap: '白色晶体' }),
    C('C2H5OH', '乙醇', 'Ethanol', 'l', { ox: { C: -2, H: 1, O: -2 }, al: ['酒精'], ap: '无色液体' }),
    C('CH3OH', '甲醇', 'Methanol', 'l', { ox: { C: -2, H: 1, O: -2 }, al: ['木醇'], ap: '无色液体' }),
    C('HCHO', '甲醛', 'Formaldehyde', 'g', { ox: { C: 0, H: 1, O: -2 }, al: ['蚁醛'], ap: '无色有刺激性气味的气体' }),
    C('CH3CHO', '乙醛', 'Acetaldehyde', 'l', { ox: { C: -1, H: 1, O: -2 }, ae: ['Ethanal'], ap: '无色液体' }),
    C('CH3COOC2H5', '乙酸乙酯', 'Ethyl acetate', 'l', { ox: { C: -1, H: 1, O: -2 }, ap: '无色有果香味的液体' }),
    C('CH3Cl', '一氯甲烷', 'Chloromethane', 'g', { ox: { C: -2, H: 1, Cl: -1 }, ap: '无色气体' }),
    C('CH3COONa', '乙酸钠', 'Sodium acetate', 's', { ox: { C: 0, H: 1, O: -2, Na: 1 }, ap: '白色晶体' }),

    /* ---------- 其他 ---------- */
    C('Mg3N2', '氮化镁', 'Magnesium nitride', 's', { ox: { Mg: 2, N: -3 }, ap: '黄绿色固体' }),
    C('PCl3', '三氯化磷', 'Phosphorus trichloride', 'l', { ox: { P: 3, Cl: -1 }, ap: '无色液体' }),
    C('PCl5', '五氯化磷', 'Phosphorus pentachloride', 's', { ox: { P: 5, Cl: -1 }, ap: '淡黄色固体' })
  ];

  var map = new Map();
  list.forEach(function (c) { map.set(c.f.toLowerCase(), c); });

  function normalize(token) {
    return String(token || '').replace(/\s+/g, '').replace(/·/g, '*').replace(/−/g, '-');
  }

  function find(token) {
    var key = normalize(token).toLowerCase();
    return map.get(key) || null;
  }

  function name(c, lang) {
    if (!c) return '';
    if (lang === 'zh') return c.zh || c.en || c.f;
    return c.en || c.zh || c.f;
  }

  function aliases(c, lang) {
    if (!c) return [];
    if (lang === 'zh') return c.al || [];
    return c.ae || (c.al && lang === 'en' ? c.al : []) || [];
  }

  function appearance(c, lang) {
    if (!c) return '';
    if (lang === 'zh') return c.ape || c.ap || '';
    return c.ape || c.ap || '';
  }

  root.Compounds = {
    list: list,
    map: map,
    find: find,
    normalize: normalize,
    name: name,
    aliases: aliases,
    appearance: appearance
  };
})(typeof window !== 'undefined' ? window : globalThis);
