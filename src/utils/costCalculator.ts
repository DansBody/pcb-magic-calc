import { PCBSpecs, Supplier, layerPrices, surfaceTreatments, materialTypes, boardThickness, minHoleSize, smColors, innerCopper, outerCopper, lineSpace, vCut, specialStackup1, specialStackup2, specialProcess1, specialProcess2, taiwanShippingFee, ckdNoTrayFee } from "@/data/pcbData";
import { getPartNumberByPartNumber } from "@/utils/partNumberStorage";

// USD 到 RMB 匯率（可根據需要調整）
const USD_TO_RMB_RATE = 7.2;

export interface CostBreakdown {
  basePrice: number;
  surfaceTreatment: number;
  materialType: number;
  thickness: number;
  holeSize: number;
  smColor: number;
  innerCopper: number;
  outerCopper: number;
  lineSpace: number;
  vCut: number;
  subtotal: number;
  totalPerM2: number;
  totalCost: number;
  // 额外的详细信息字段
  formulaAdderAmount: number; // 公式加价金额
  formulaAdderPercentage: number; // 公式加价百分比
  mstcStandardPricePerM2: number; // MSTC 标准平米价(RMB)
  mstcStandardPriceBreakdown: {
    name: string;
    type: string;
    percent?: number;
    amount: number;
  }[];
  currency: string; // 币别
  utilizationAdder?: number; // 板材利用率加價（每 m²）
  // 詳細分解資料
  formulaAdderBreakdown: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  formulaPercentageBreakdown: {
    name: string;
    percentage: number;
  }[];
}

function parseAdder(value: string | number, basePrice: number): number {
  if (typeof value === "number") {
    return value;
  }
  
  if (value.includes("%")) {
    const percentage = parseFloat(value.replace("%", ""));
    return (basePrice * percentage) / 100;
  }
  
  return parseFloat(value) || 0;
}

function includeIfAtLeastOne(value: number): number {
  return Math.abs(value) >= 1 ? value : 0;
}

// === 依據新規則設置 MSTC 標準平米價計算函數 ===
function calcMSTCStandardPricePerM2({
  basePrice,
  adderList
}: {
  basePrice: number,
  adderList: (string | number)[]
}): number {
  let mstcPrice = basePrice;
  adderList.forEach(adder => {
    if (typeof adder === 'string' && adder.includes('%')) {
      const pct = parseFloat(adder.replace('%', ''));
      if (pct > 0 && pct < 100) {
        mstcPrice += basePrice * (pct / 100);
      }
    } else if (!isNaN(Number(adder))) {
      const num = Number(adder);
      if (!(typeof adder === 'string' && adder.includes('%'))) {
        // 不處理百分比型字串
        mstcPrice += num;
      }
    }
  });
  return mstcPrice;
}

// 新版 MSTC 標準平米價計算，附帶逐項 breakdown
function calcMSTCStandardPricePerM2WithBreakdown({
  basePrice,
  additives
}: {
  basePrice: number,
  additives: { name: string, value: string | number }[]
}): { price: number, breakdown: { name: string, type: string, percent?: number, amount: number }[] } {
  let mstcPrice = basePrice;
  const breakdown: { name: string, type: string, percent?: number, amount: number }[] = [
    { name: '基礎單價', type: 'base', amount: basePrice }
  ];
  additives.forEach(item => {
    const { name, value } = item;
    if (typeof value === 'string' && value.includes('%')) {
      const pct = parseFloat(value.replace('%', ''));
      if (pct > 0 && pct < 100) {
        const add = basePrice * (pct / 100);
        mstcPrice += add;
        breakdown.push({ name, type: 'percent', percent: pct, amount: add });
      }
    } else if (!isNaN(Number(value))) {
      const num = Number(value);
      if (!(typeof value === 'string' && value.includes('%')) && num !== 0) {
        mstcPrice += num;
        breakdown.push({ name, type: 'fixed', amount: num });
      }
    }
  });
  return { price: mstcPrice, breakdown };
}

export function calculateCost(specs: PCBSpecs, supplier: Supplier): CostBreakdown {
  // 取得 PN 對應的價格資訊（目前单价）
  const partNumberInfo = specs.partNumber ? getPartNumberByPartNumber(specs.partNumber) : null;
  const currentUnitPriceRMB = partNumberInfo 
    ? (partNumberInfo.currency === "USD" 
        ? partNumberInfo.unitPrice * USD_TO_RMB_RATE 
        : partNumberInfo.unitPrice)
    : null;
  
  // Base price per m²
  const basePrice = layerPrices[supplier][specs.layers] || 0;
  
  // Surface treatment（加价 lookup 固定为盟创标准）
  const surfaceTreatmentCost = surfaceTreatments[specs.surfaceTreatment]?.["盟创标准"] || 0;
  
  // Material type (can be percentage or fixed)
  const materialTypeValue = materialTypes[specs.materialType]?.["盟创标准"] || "0%";
  const materialTypeCost = parseAdder(materialTypeValue, basePrice);
  
  // Board thickness
  const thicknessCost = boardThickness[specs.thickness]?.["盟创标准"] || 0;
  
  // Min hole size
  const holeSizeCost = minHoleSize[specs.minHoleSize]?.["盟创标准"] || 0;
  
  // SM color (percentage)
  const smColorValue = smColors[specs.smColor]?.["盟创标准"] || "0%";
  const smColorCost = parseAdder(smColorValue, basePrice);
  
  // Inner copper
  const innerCopperCost = innerCopper[specs.innerCopper]?.["盟创标准"] || 0;
  
  // Outer copper
  const outerCopperCost = outerCopper[specs.outerCopper]?.["盟创标准"] || 0;
  
  // Line/space (percentage)
  const lineSpaceValue = lineSpace[specs.lineSpace]?.["盟创标准"] || "0%";
  const lineSpaceCost = parseAdder(lineSpaceValue, basePrice);
  
  // V-cut (percentage)
  const vCutValue = vCut[specs.vCut]?.["盟创标准"] || "0%";
  const vCutCost = parseAdder(vCutValue, basePrice);
  
  // Calculate subtotal per m²
  const subtotalPerM2 = basePrice + surfaceTreatmentCost + materialTypeCost + 
                        thicknessCost + holeSizeCost + smColorCost + 
                        innerCopperCost + outerCopperCost + lineSpaceCost + vCutCost;
  
  // Total cost: 目前单价 (RMB) * 需求量 (pcs)，如果沒有目前单价則使用原計算方式
  const totalCost = currentUnitPriceRMB !== null
    ? currentUnitPriceRMB * specs.quantity
    : subtotalPerM2 * specs.areaM2 * specs.quantity;
  
  // Holes per square meter adder per formula
  const holes = specs.holesPerSquareMeter ?? 0;
  let holeDensityAutoAdder = 0;
  if (holes < 150000) {
    holeDensityAutoAdder = 0;
  } else {
    const diff = (holes - 180000) / 10000;
    const step = diff >= 0 ? Math.ceil(diff) : Math.floor(diff);
    holeDensityAutoAdder = step * 3;
  }

  // PCS面積/平米數（供後續利用率差異計算使用）
  // 公式： (L*W)/25.4/25.4/144/(連板數)*10.764
  const L = specs.panelLengthMm ?? 0;
  const W = specs.panelWidthMm ?? 0;
  const panelCount = (specs.panelCount ?? 1) || 1; // 避免除以 0
  const pcsAreaPerM2 = ((L * W) / 25.4 / 25.4 / 144 / panelCount) * 10.764;

  // 板材利用率（單一百分比欄位），以 0~1 區間值直接對照門檻
  const boardUtilizationValue = (specs.boardUtilizationPercent ?? 0) / 100;
  const utilDelta = boardUtilizationValue;
  let utilizationAdder = 0;
  if (utilDelta < 0.7) {
    utilizationAdder = basePrice * 0.1;
  } else if (utilDelta < 0.75) {
    utilizationAdder = basePrice * 0.08;
  } else if (utilDelta >= 0.85) {
    utilizationAdder = -pcsAreaPerM2 * (((utilDelta) - 0.84) * 100) * 0.005 * basePrice;
  } else if (utilDelta >= 0.8 && utilDelta <= 0.84) {
    utilizationAdder = 0;
  } else if (utilDelta < 0.8) {
    utilizationAdder = pcsAreaPerM2 * ((0.8 - (utilDelta)) * 100) * 0.005 * basePrice;
  } else {
    utilizationAdder = 0;
  }

  // 128 行以后 specialStackup1 等 lookup （特殊疊構、製程）都改查“盟创标准”
  const selectedSpecialStackup1Cost = specs.specialStackup1 
    ? parseAdder(String(specialStackup1[specs.specialStackup1]?.["盟创标准"] ?? "0"), basePrice) 
    : 0;

  // 特殊規則：特殊疊構-2 若為百分比，與特殊疊構-1 相乘；若為數字，直接加總
  const stackup2Raw = specs.specialStackup2 ? String(specialStackup2[specs.specialStackup2]?.["盟创标准"] ?? "0") : "0";
  const selectedSpecialStackup2Cost = stackup2Raw.includes('%')
    ? (selectedSpecialStackup1Cost * (parseFloat(stackup2Raw.replace('%', '')) || 0)) / 100
    : (parseFloat(stackup2Raw) || 0);

  // 特殊製程-1、2：若為可解析數字則加總，非數字（文字說明）視為 0
  const selectedSpecialProcess1Cost = specs.specialProcess1
    ? parseAdder(String(specialProcess1[specs.specialProcess1]?.["盟创标准"] ?? "0"), basePrice)
    : 0;
  const selectedSpecialProcess2Cost = specs.specialProcess2
    ? parseAdder(String(specialProcess2[specs.specialProcess2]?.["盟创标准"] ?? "0"), basePrice)
    : 0;

  // 收集除「出臺灣盟清關+運費」和「出CKD不收叉板」之外的所有加價項目，用於計算臨時 MSTC 標準平米價
  const mstcAddersWithoutExport = [
    { name: '表面處理', value: surfaceTreatments[specs.surfaceTreatment]?.["盟创标准"] || 0 },
    { name: '材料類型', value: materialTypes[specs.materialType]?.["盟创标准"] || 0 },
    { name: '板厚', value: boardThickness[specs.thickness]?.["盟创标准"] || 0 },
    { name: '孔徑', value: minHoleSize[specs.minHoleSize]?.["盟创标准"] || 0 },
    { name: '自動孔密度加價', value: holeDensityAutoAdder },
    { name: '防焊顏色', value: smColors[specs.smColor]?.["盟创标准"] || 0 },
    { name: '內層銅厚', value: innerCopper[specs.innerCopper]?.["盟创标准"] || 0 },
    { name: '外層銅厚', value: outerCopper[specs.outerCopper]?.["盟创标准"] || 0 },
    { name: '線寬/線距', value: lineSpace[specs.lineSpace]?.["盟创标准"] || 0 },
    { name: 'V-Cut', value: vCut[specs.vCut]?.["盟创标准"] || 0 },
    { name: '板材利用率加價', value: utilizationAdder },
    { name: '特殊疊構-1', value: includeIfAtLeastOne(selectedSpecialStackup1Cost) },
    { name: '特殊疊構-2', value: includeIfAtLeastOne(selectedSpecialStackup2Cost) },
    { name: '特殊製程-1', value: includeIfAtLeastOne(selectedSpecialProcess1Cost) },
    { name: '特殊製程-2', value: includeIfAtLeastOne(selectedSpecialProcess2Cost) }
  ];
  // 計算臨時 MSTC 標準平米價（不含 exportTW 和 ckdNoTray）
  const { price: tempMstcStandardPricePerM2, breakdown: mstcStandardPriceBreakdownWithoutExport } = calcMSTCStandardPricePerM2WithBreakdown({ basePrice, additives: mstcAddersWithoutExport });

  // 出臺灣盟清關+運費 / 出CKD不收叉板（以百分比表達，轉為金額）
  // 使用加總完後的 MSTC 標準平米價作為基數
  const exportTWPercentStr = taiwanShippingFee[specs.exportTWCustomsShipping ?? "N"]?.["盟创标准"] ?? "0%";
  const ckdNoTrayPercentStr = ckdNoTrayFee[specs.ckdNoTray ?? "N"]?.["盟创标准"] ?? "0%";
  const exportTWAmount = parseAdder(exportTWPercentStr, tempMstcStandardPricePerM2);
  const ckdNoTrayAmount = parseAdder(ckdNoTrayPercentStr, tempMstcStandardPricePerM2);

  const validAdder = (v: number) => (v >= 1 || v <= -1 ? v : 0);
  const formulaAdderAmount = 
    validAdder(surfaceTreatmentCost) +
    validAdder(thicknessCost) +
    validAdder(holeSizeCost) +
    validAdder(holeDensityAutoAdder) +
    validAdder(smColorCost) +
    validAdder(innerCopperCost) +
    validAdder(outerCopperCost) +
    validAdder(lineSpaceCost) +
    validAdder(utilizationAdder) +
    validAdder(includeIfAtLeastOne(selectedSpecialStackup1Cost)) +
    validAdder(includeIfAtLeastOne(selectedSpecialStackup2Cost)) +
    validAdder(includeIfAtLeastOne(selectedSpecialProcess1Cost)) +
    validAdder(includeIfAtLeastOne(selectedSpecialProcess2Cost));
  
  // 182 行以后拿百分比的地方也都必须查“盟创标准”
  const toPercent = (v: unknown): number => {
    if (typeof v === 'string' && v.includes('%')) return parseFloat(v.replace('%', '')) || 0;
    return 0;
  };

  const surfaceTreatmentPercent = toPercent(surfaceTreatments[specs.surfaceTreatment]?.["盟创标准"] as any);
  const materialTypePercent = toPercent(materialTypes[specs.materialType]?.["盟创标准"] as any);
  const thicknessPercent = toPercent(boardThickness[specs.thickness]?.["盟创标准"] as any);
  const holeSizePercent = toPercent(minHoleSize[specs.minHoleSize]?.["盟创标准"] as any);
  const smColorPercent = toPercent(smColors[specs.smColor]?.["盟创标准"] as any);
  const innerCopperPercent = toPercent(innerCopper[specs.innerCopper]?.["盟创标准"] as any);
  const outerCopperPercent = toPercent(outerCopper[specs.outerCopper]?.["盟创标准"] as any);
  const lineSpacePercent = toPercent(lineSpace[specs.lineSpace]?.["盟创标准"] as any);
  const vCutPercent = toPercent(vCut[specs.vCut]?.["盟创标准"] as any);
  const specialStackup1Percent = specs.specialStackup1 ? toPercent(specialStackup1[specs.specialStackup1]?.["盟创标准"] as any) : 0;
  const specialStackup2Percent = specs.specialStackup2 ? toPercent(specialStackup2[specs.specialStackup2]?.["盟创标准"] as any) : 0;
  const specialProcess1Percent = specs.specialProcess1 ? toPercent(specialProcess1[specs.specialProcess1]?.["盟创标准"] as any) : 0;
  const specialProcess2Percent = specs.specialProcess2 ? toPercent(specialProcess2[specs.specialProcess2]?.["盟创标准"] as any) : 0;
  const exportTWPercent = toPercent(exportTWPercentStr);
  const ckdNoTrayPercent = toPercent(ckdNoTrayPercentStr);

  const formulaAdderPercentage =
    surfaceTreatmentPercent +
    materialTypePercent +
    thicknessPercent +
    holeSizePercent +
    smColorPercent +
    innerCopperPercent +
    outerCopperPercent +
    lineSpacePercent +
    vCutPercent +
    specialStackup1Percent +
    specialStackup2Percent +
    specialProcess1Percent +
    specialProcess2Percent +
    exportTWPercent +
    ckdNoTrayPercent;

  // 計算最終 MSTC 標準平米價（臨時價格 + exportTW + ckdNoTray）
  const mstcStandardPricePerM2 = tempMstcStandardPricePerM2 + includeIfAtLeastOne(exportTWAmount) + includeIfAtLeastOne(ckdNoTrayAmount);
  
  // 建立 MSTC 標準平米價的 breakdown（包含所有項目）
  const mstcStandardPriceBreakdown = [
    ...mstcStandardPriceBreakdownWithoutExport,
    ...(includeIfAtLeastOne(exportTWAmount) !== 0 ? [{ name: '出臺灣盟清關+運費', type: 'fixed' as const, amount: includeIfAtLeastOne(exportTWAmount) }] : []),
    ...(includeIfAtLeastOne(ckdNoTrayAmount) !== 0 ? [{ name: '出CKD不收叉板', type: 'fixed' as const, amount: includeIfAtLeastOne(ckdNoTrayAmount) }] : [])
  ];

  // 建立公式加價金額詳細分解，不包含材料類型
  // 注意：出臺灣盟清關+運費和出CKD不收叉板是百分比項目，不應出現在金額詳細分解中
  const formulaAdderBreakdown = [
    { name: "表面處理", amount: surfaceTreatmentCost, percentage: surfaceTreatmentPercent },
    { name: "材料類型", amount: materialTypeCost, percentage: materialTypePercent },
    { name: "板厚", amount: thicknessCost, percentage: thicknessPercent },
    { name: "孔徑", amount: holeSizeCost, percentage: holeSizePercent },
    { name: "自動孔密度加價", amount: holeDensityAutoAdder, percentage: 0 },
    { name: "防焊顏色", amount: smColorCost, percentage: smColorPercent },
    { name: "內層銅厚", amount: innerCopperCost, percentage: innerCopperPercent },
    { name: "外層銅厚", amount: outerCopperCost, percentage: outerCopperPercent },
    { name: "線寬/線距", amount: lineSpaceCost, percentage: lineSpacePercent },
    { name: "板材利用率加價", amount: utilizationAdder, percentage: 0 },
    { name: "特殊疊構-1", amount: includeIfAtLeastOne(selectedSpecialStackup1Cost), percentage: specialStackup1Percent },
    { name: "特殊疊構-2", amount: includeIfAtLeastOne(selectedSpecialStackup2Cost), percentage: specialStackup2Percent },
    { name: "特殊製程-1", amount: includeIfAtLeastOne(selectedSpecialProcess1Cost), percentage: specialProcess1Percent },
    { name: "特殊製程-2", amount: includeIfAtLeastOne(selectedSpecialProcess2Cost), percentage: specialProcess2Percent }
  ].filter(item => item.amount !== 0 || item.percentage !== 0);

  // 建立公式加價百分比詳細分解
  const formulaPercentageBreakdown = [
    { name: "表面處理", percentage: surfaceTreatmentPercent },
    { name: "材料類型", percentage: materialTypePercent },
    { name: "板厚", percentage: thicknessPercent },
    { name: "孔徑", percentage: holeSizePercent },
    { name: "防焊顏色", percentage: smColorPercent },
    { name: "內層銅厚", percentage: innerCopperPercent },
    { name: "外層銅厚", percentage: outerCopperPercent },
    { name: "線寬/線距", percentage: lineSpacePercent },
    { name: "V-Cut", percentage: vCutPercent },
    { name: "特殊疊構-1", percentage: specialStackup1Percent },
    { name: "特殊疊構-2", percentage: specialStackup2Percent },
    { name: "特殊製程-1", percentage: specialProcess1Percent },
    { name: "特殊製程-2", percentage: specialProcess2Percent },
    { name: "出臺灣盟清關+運費", percentage: exportTWPercent },
    { name: "出CKD不收叉板", percentage: ckdNoTrayPercent }
  ].filter(item => item.percentage !== 0);
  
  return {
    basePrice,
    surfaceTreatment: surfaceTreatmentCost,
    materialType: materialTypeCost,
    thickness: thicknessCost,
    holeSize: holeSizeCost,
    smColor: smColorCost,
    innerCopper: innerCopperCost,
    outerCopper: outerCopperCost,
    lineSpace: lineSpaceCost,
    vCut: vCutCost,
    subtotal: subtotalPerM2,
    totalPerM2: subtotalPerM2,
    totalCost,
    formulaAdderAmount,
    formulaAdderPercentage,
    mstcStandardPricePerM2,
    mstcStandardPriceBreakdown,
    currency: 'RMB',
    utilizationAdder,
    formulaAdderBreakdown,
    formulaPercentageBreakdown
  };
}
