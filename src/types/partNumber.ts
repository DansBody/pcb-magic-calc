export type Currency = "RMB" | "USD";

export interface PartNumber {
  id: string;
  partNumber: string;
  unitPrice: number;
  currency: Currency;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartNumberData {
  partNumbers: PartNumber[];
}
