import pcbJson from './pcbData.json';

// PCB資料型別===
export type Supplier = typeof pcbJson.suppliers[number];

export interface PCBSpecs {
  partNumber?: string;
  layers: number;
  surfaceTreatment: keyof typeof pcbJson.surfaceTreatments;
  materialType: keyof typeof pcbJson.materialTypes;
  thickness: string;
  minHoleSize: string;
  holesPerSquareMeter?: number;
  smColor: keyof typeof pcbJson.smColors;
  innerCopper: keyof typeof pcbJson.innerCopper;
  outerCopper: keyof typeof pcbJson.outerCopper;
  lineSpace: keyof typeof pcbJson.lineSpace;
  vCut: keyof typeof pcbJson.vCut;
  areaM2: number;
  quantity: number;
  specialStackup1?: keyof typeof pcbJson.specialStackup1;
  specialStackup2?: keyof typeof pcbJson.specialStackup2;
  specialProcess1?: keyof typeof pcbJson.specialProcess1;
  specialProcess2?: keyof typeof pcbJson.specialProcess2;
  exportTWCustomsShipping?: "Y" | "N";
  ckdNoTray?: "Y" | "N";
  panelLengthMm?: number;
  panelWidthMm?: number;
  panelCount?: number;
  boardUtilizationPercent?: number;
}

// Data re-export for原有命名相容
export const suppliers = pcbJson.suppliers;
export const layerPrices = pcbJson.layerPrices;
export const surfaceTreatments = pcbJson.surfaceTreatments;
export const materialTypes = pcbJson.materialTypes;
export const boardThickness = pcbJson.boardThickness;
export const minHoleSize = pcbJson.minHoleSize;
export const smColors = pcbJson.smColors;
export const innerCopper = pcbJson.innerCopper;
export const outerCopper = pcbJson.outerCopper;
export const lineSpace = pcbJson.lineSpace;
export const vCut = pcbJson.vCut;
export const specialStackup1 = pcbJson.specialStackup1;
export const specialStackup2 = pcbJson.specialStackup2;
export const specialProcess1 = pcbJson.specialProcess1;
export const specialProcess2 = pcbJson.specialProcess2;
export const taiwanShippingFee = pcbJson.taiwanShippingFee;
export const ckdNoTrayFee = pcbJson.ckdNoTrayFee;
