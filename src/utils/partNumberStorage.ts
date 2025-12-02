import { PartNumber, PartNumberData } from "@/types/partNumber";

const STORAGE_KEY = "pcb_part_numbers";
const DEFAULT_DATA: PartNumberData = { partNumbers: [] };

/**
 * 從 localStorage 讀取 Part Number 資料
 */
export function getPartNumbers(): PartNumber[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_DATA.partNumbers;
    }
    const data: PartNumberData = JSON.parse(stored);
    const partNumbers = data.partNumbers || [];
    // 向後兼容：為沒有幣別的舊資料設定預設值
    return partNumbers.map((p) => ({
      ...p,
      currency: (p.currency || "RMB") as "RMB" | "USD",
    }));
  } catch (error) {
    console.error("讀取 Part Number 資料失敗:", error);
    return DEFAULT_DATA.partNumbers;
  }
}

/**
 * 儲存 Part Number 資料到 localStorage
 */
export function savePartNumbers(partNumbers: PartNumber[]): void {
  try {
    const data: PartNumberData = { partNumbers };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("儲存 Part Number 資料失敗:", error);
    throw new Error("儲存失敗，請檢查瀏覽器設定");
  }
}

/**
 * 新增 Part Number
 */
export function addPartNumber(partNumber: Omit<PartNumber, "id" | "createdAt" | "updatedAt">): PartNumber {
  const partNumbers = getPartNumbers();
  const now = new Date().toISOString();
  const newPartNumber: PartNumber = {
    ...partNumber,
    id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  partNumbers.push(newPartNumber);
  savePartNumbers(partNumbers);
  return newPartNumber;
}

/**
 * 更新 Part Number
 */
export function updatePartNumber(id: string, updates: Partial<Omit<PartNumber, "id" | "createdAt">>): PartNumber | null {
  const partNumbers = getPartNumbers();
  const index = partNumbers.findIndex((p) => p.id === id);
  if (index === -1) {
    return null;
  }
  partNumbers[index] = {
    ...partNumbers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  savePartNumbers(partNumbers);
  return partNumbers[index];
}

/**
 * 刪除 Part Number
 */
export function deletePartNumber(id: string): boolean {
  const partNumbers = getPartNumbers();
  const filtered = partNumbers.filter((p) => p.id !== id);
  if (filtered.length === partNumbers.length) {
    return false; // 沒找到要刪除的項目
  }
  savePartNumbers(filtered);
  return true;
}

/**
 * 匯出為 JSON 檔案
 */
export function exportToJSON(): void {
  const partNumbers = getPartNumbers();
  const data: PartNumberData = { partNumbers };
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `part-numbers-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 從 JSON 檔案匯入
 */
export function importFromJSON(file: File): Promise<{ success: boolean; message: string; count: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: PartNumberData = JSON.parse(text);
        
        if (!data.partNumbers || !Array.isArray(data.partNumbers)) {
          resolve({
            success: false,
            message: "JSON 格式錯誤：缺少 partNumbers 陣列",
            count: 0,
          });
          return;
        }

        // 驗證每個 Part Number 的格式
        const validPartNumbers: PartNumber[] = [];
        for (const item of data.partNumbers) {
          if (
            typeof item.partNumber === "string" &&
            typeof item.unitPrice === "number" &&
            item.unitPrice >= 0
          ) {
            const now = new Date().toISOString();
            validPartNumbers.push({
              id: item.id || `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              partNumber: item.partNumber,
              unitPrice: item.unitPrice,
              currency: (item.currency || "RMB") as "RMB" | "USD",
              description: item.description || "",
              createdAt: item.createdAt || now,
              updatedAt: now,
            });
          }
        }

        if (validPartNumbers.length === 0) {
          resolve({
            success: false,
            message: "沒有有效的 Part Number 資料",
            count: 0,
          });
          return;
        }

        // 合併到現有資料（避免重複）
        const existing = getPartNumbers();
        const existingPartNumbers = new Set(existing.map((p) => p.partNumber));
        const newPartNumbers = validPartNumbers.filter(
          (p) => !existingPartNumbers.has(p.partNumber)
        );
        
        const merged = [...existing, ...newPartNumbers];
        savePartNumbers(merged);

        resolve({
          success: true,
          message: `成功匯入 ${newPartNumbers.length} 筆資料（跳過 ${validPartNumbers.length - newPartNumbers.length} 筆重複資料）`,
          count: newPartNumbers.length,
        });
      } catch (error) {
        resolve({
          success: false,
          message: `解析 JSON 失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
          count: 0,
        });
      }
    };
    reader.onerror = () => {
      resolve({
        success: false,
        message: "讀取檔案失敗",
        count: 0,
      });
    };
    reader.readAsText(file);
  });
}

/**
 * 根據 Part Number 查找單價
 */
export function getPriceByPartNumber(partNumber: string): number | null {
  const partNumbers = getPartNumbers();
  const found = partNumbers.find((p) => p.partNumber === partNumber);
  return found ? found.unitPrice : null;
}

/**
 * 根據 Part Number 查找完整的 PartNumber 物件
 */
export function getPartNumberByPartNumber(partNumber: string): PartNumber | null {
  const partNumbers = getPartNumbers();
  const found = partNumbers.find((p) => p.partNumber === partNumber);
  return found || null;
}
