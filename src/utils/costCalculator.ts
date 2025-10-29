import { PCBSpecs, Supplier, layerPrices, surfaceTreatments, materialTypes, boardThickness, minHoleSize, smColors, innerCopper, outerCopper, lineSpace, vCut } from "@/data/pcbData";

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

export function calculateCost(specs: PCBSpecs, supplier: Supplier): CostBreakdown {
  // Base price per m²
  const basePrice = layerPrices[supplier][specs.layers] || 0;
  
  // Surface treatment
  const surfaceTreatmentCost = surfaceTreatments[specs.surfaceTreatment]?.[supplier] || 0;
  
  // Material type (can be percentage or fixed)
  const materialTypeValue = materialTypes[specs.materialType]?.[supplier] || "0%";
  const materialTypeCost = parseAdder(materialTypeValue, basePrice);
  
  // Board thickness
  const thicknessCost = boardThickness[specs.thickness]?.[supplier] || 0;
  
  // Min hole size
  const holeSizeCost = minHoleSize[specs.minHoleSize]?.[supplier] || 0;
  
  // SM color (percentage)
  const smColorValue = smColors[specs.smColor]?.[supplier] || "0%";
  const smColorCost = parseAdder(smColorValue, basePrice);
  
  // Inner copper
  const innerCopperCost = innerCopper[specs.innerCopper]?.[supplier] || 0;
  
  // Outer copper
  const outerCopperCost = outerCopper[specs.outerCopper]?.[supplier] || 0;
  
  // Line/space (percentage)
  const lineSpaceValue = lineSpace[specs.lineSpace]?.[supplier] || "0%";
  const lineSpaceCost = parseAdder(lineSpaceValue, basePrice);
  
  // V-cut (percentage)
  const vCutValue = vCut[specs.vCut]?.[supplier] || "0%";
  const vCutCost = parseAdder(vCutValue, basePrice);
  
  // Calculate subtotal per m²
  const subtotalPerM2 = basePrice + surfaceTreatmentCost + materialTypeCost + 
                        thicknessCost + holeSizeCost + smColorCost + 
                        innerCopperCost + outerCopperCost + lineSpaceCost + vCutCost;
  
  // Total cost based on area
  const totalCost = subtotalPerM2 * specs.areaM2;
  
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
    totalCost
  };
}
