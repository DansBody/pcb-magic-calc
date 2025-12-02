import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Download, Upload, Search, Package, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  getPartNumbers,
  addPartNumber,
  updatePartNumber,
  deletePartNumber,
  exportToJSON,
  importFromJSON,
} from "@/utils/partNumberStorage";
import type { PartNumber } from "@/types/partNumber";
import type { Currency } from "@/types/partNumber";
import exampleData from "@/data/partNumbers.example.json";

const PartNumberManagement = () => {
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPartNumber, setEditingPartNumber] = useState<PartNumber | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    partNumber: "",
    unitPrice: "",
    currency: "RMB" as Currency,
    description: "",
  });

  // 載入資料
  useEffect(() => {
    loadPartNumbers();
  }, []);

  const loadPartNumbers = () => {
    const data = getPartNumbers();
    // 去除重複的 ID（保留第一個出現的）
    const uniqueData = data.filter((p, index, self) => 
      index === self.findIndex((item) => item.id === p.id)
    );
    
    // 如果有重複項目，更新儲存的資料
    if (uniqueData.length !== data.length) {
      // 這裡可以選擇性地保存清理後的資料
      // 但為了不影響用戶，我們只在記憶體中去重
    }
    
    setPartNumbers(uniqueData);
  };

  // 過濾搜尋結果（僅搜尋 Part Number）
  const filteredPartNumbers = useMemo(() => {
    // 先去除重複的 ID（保留第一個出現的）
    const uniquePartNumbers = partNumbers.filter((p, index, self) => 
      index === self.findIndex((item) => item.id === p.id)
    );
    
    // 如果沒有搜尋條件，顯示所有去重後的資料
    if (!searchTerm || !searchTerm.trim()) {
      return uniquePartNumbers;
    }
    
    // 取得清理後的搜尋字串
    const searchValue = searchTerm.trim().toLowerCase();
    if (!searchValue) {
      return uniquePartNumbers;
    }
    
    // 先檢查是否有完全匹配的 Part Number
    const exactMatch = uniquePartNumbers.find((p) => {
      if (!p || !p.partNumber) return false;
      return p.partNumber.toLowerCase().trim() === searchValue;
    });
    
    // 如果有完全匹配，只顯示那一筆
    if (exactMatch) {
      return [exactMatch];
    }
    
    // 否則，過濾出所有 Part Number 中包含搜尋字串的項目
    const filtered = uniquePartNumbers.filter((p) => {
      if (!p || !p.partNumber) return false;
      const partNumberLower = p.partNumber.toLowerCase().trim();
      return partNumberLower.includes(searchValue);
    });
    
    return filtered;
  }, [partNumbers, searchTerm]);

  // 重置表單
  const resetForm = () => {
    setFormData({
      partNumber: "",
      unitPrice: "",
      currency: "RMB" as Currency,
      description: "",
    });
    setEditingPartNumber(null);
  };

  // 開啟新增對話框
  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 開啟編輯對話框
  const handleEdit = (partNumber: PartNumber) => {
    setFormData({
      partNumber: partNumber.partNumber,
      unitPrice: partNumber.unitPrice.toString(),
      currency: partNumber.currency || "RMB",
      description: partNumber.description || "",
    });
    setEditingPartNumber(partNumber);
    setIsDialogOpen(true);
  };

  // 開啟刪除確認對話框
  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  // 確認刪除
  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      const success = deletePartNumber(deleteTargetId);
      if (success) {
        toast({
          title: "刪除成功",
          description: "Part Number 已刪除",
        });
        loadPartNumbers();
      } else {
        toast({
          title: "刪除失敗",
          description: "找不到要刪除的項目",
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  // 儲存表單
  const handleSave = () => {
    // 驗證
    if (!formData.partNumber.trim()) {
      toast({
        title: "驗證失敗",
        description: "請輸入 Part Number",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(formData.unitPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: "驗證失敗",
        description: "請輸入有效的單價（大於等於 0）",
        variant: "destructive",
      });
      return;
    }

    // 檢查重複（編輯時排除自己）
    const isDuplicate = partNumbers.some(
      (p) =>
        p.partNumber.toLowerCase() === formData.partNumber.toLowerCase().trim() &&
        (!editingPartNumber || p.id !== editingPartNumber.id)
    );

    if (isDuplicate) {
      toast({
        title: "驗證失敗",
        description: "此 Part Number 已存在",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPartNumber) {
        // 更新
        updatePartNumber(editingPartNumber.id, {
          partNumber: formData.partNumber.trim(),
          unitPrice: price,
          currency: formData.currency,
          description: formData.description.trim(),
        });
        toast({
          title: "更新成功",
          description: "Part Number 已更新",
        });
      } else {
        // 新增
        addPartNumber({
          partNumber: formData.partNumber.trim(),
          unitPrice: price,
          currency: formData.currency,
          description: formData.description.trim(),
        });
        toast({
          title: "新增成功",
          description: "Part Number 已新增",
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadPartNumbers();
    } catch (error) {
      toast({
        title: "儲存失敗",
        description: error instanceof Error ? error.message : "未知錯誤",
        variant: "destructive",
      });
    }
  };

  // 匯出 JSON
  const handleExport = () => {
    try {
      exportToJSON();
      toast({
        title: "匯出成功",
        description: "JSON 檔案已下載",
      });
    } catch (error) {
      toast({
        title: "匯出失敗",
        description: error instanceof Error ? error.message : "未知錯誤",
        variant: "destructive",
      });
    }
  };

  // 匯入 JSON
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const result = await importFromJSON(file);
      if (result.success) {
        toast({
          title: "匯入成功",
          description: result.message,
        });
        loadPartNumbers();
      } else {
        toast({
          title: "匯入失敗",
          description: result.message,
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  // 下載範例資料
  const handleDownloadExample = () => {
    try {
      const jsonString = JSON.stringify(exampleData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "partNumbers.example.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "下載成功",
        description: "範例資料已下載",
      });
    } catch (error) {
      toast({
        title: "下載失敗",
        description: error instanceof Error ? error.message : "未知錯誤",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Part Number 管理
                </h1>
                <p className="text-sm text-muted-foreground">維護 Part Number 及單價資料</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/">
                <Button variant="outline">
                  <Calculator className="h-4 w-4 mr-2" />
                  成本計算器
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Part Number 清單</CardTitle>
                <CardDescription>
                  總共 {partNumbers.length} 筆資料
                  {searchTerm && `，顯示 ${filteredPartNumbers.length} 筆搜尋結果`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAdd} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  新增
                </Button>
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  匯出 JSON
                </Button>
                <Button onClick={handleImport} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  匯入 JSON
                </Button>
                <Button onClick={handleDownloadExample} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下載範例資料
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 搜尋框 */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋 Part Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 表格 */}
            {filteredPartNumbers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "沒有找到符合的資料" : "目前沒有 Part Number 資料，請點擊「新增」開始新增資料"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead className="text-right">單價</TableHead>
                      <TableHead>币别</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartNumbers.map((partNumber) => (
                      <TableRow key={partNumber.id}>
                        <TableCell className="font-medium">
                          {partNumber.partNumber}
                        </TableCell>
                        <TableCell className="text-right">
                          {(partNumber.currency === "USD" ? "$" : "¥")}
                          {partNumber.unitPrice.toLocaleString("zh-TW", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {partNumber.currency || "RMB"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {partNumber.description || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(partNumber)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(partNumber.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPartNumber ? "編輯 Part Number" : "新增 Part Number"}
            </DialogTitle>
            <DialogDescription>
              {editingPartNumber
                ? "修改 Part Number 的資訊"
                : "新增一筆新的 Part Number 及單價"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="partNumber">Part Number *</Label>
              <Input
                id="partNumber"
                placeholder="輸入 Part Number"
                value={formData.partNumber}
                onChange={(e) =>
                  setFormData({ ...formData, partNumber: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitPrice">單價 *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">币别 *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: Currency) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RMB">RMB (人民幣)</SelectItem>
                  <SelectItem value="USD">USD (美元)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="選填：輸入描述資訊"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editingPartNumber ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除這個 Part Number 嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PartNumberManagement;
