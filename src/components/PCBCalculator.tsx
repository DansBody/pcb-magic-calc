import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PCBSpecs, suppliers, Supplier, specialStackup1, specialStackup2, specialProcess1, specialProcess2, surfaceTreatments, materialTypes, boardThickness, minHoleSize, smColors, innerCopper, outerCopper, lineSpace, vCut } from "@/data/pcbData";
import { Calculator, Layers, Wrench, Package, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateCost } from "@/utils/costCalculator";
import CostBreakdown from "./CostBreakdown";
import SupplierComparison from "./SupplierComparison";
import { getPartNumbers } from "@/utils/partNumberStorage";
import { ThemeToggle } from "./ThemeToggle";

const PCBCalculator = () => {
  const vCutDefault = Object.keys(vCut)[0];
  const [specs, setSpecs] = useState<PCBSpecs>({
    partNumber: undefined,
    layers: 4,
    surfaceTreatment: "OSP",
    materialType: "TG140℃",
    thickness: "1.6",
    minHoleSize: "0.2",
    smColor: "Green",
    innerCopper: "H/H oz",
    outerCopper: "1/1 oz",
    lineSpace: "4/4 mil",
    vCut: vCutDefault as keyof typeof vCut,
    areaM2: 1.0,
    quantity: 1,
    specialStackup1: "NA",
    specialStackup2: "N/A",
    specialProcess1: "N/A" as any,
    specialProcess2: "N/A" as any,
    holesPerSquareMeter: 150000,
    // 面積顯示相關初值
    panelLengthMm: 0,
    panelWidthMm: 0,
    panelCount: 1,
    boardUtilizationPercent: 80
  });

  const updateSpec = <K extends keyof PCBSpecs>(key: K, value: PCBSpecs[K]) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  };

  // 以預設供應商（suppliers[0]）計算板材利用率加價的參考值
  const referenceSupplier = suppliers[0];
  const referenceCost = calculateCost(specs, referenceSupplier as any);
  const utilizationAdderDisplay = (referenceCost.utilizationAdder ?? 0).toFixed(2);

  // 取得並處理 Part Numbers 資料
  const partNumbers = useMemo(() => {
    const allPartNumbers = getPartNumbers();
    // 使用 Map 來去重，保留第一個出現的 partNumber
    const uniquePartNumbers = new Map<string, typeof allPartNumbers[0]>();
    allPartNumbers.forEach((pn) => {
      if (!uniquePartNumbers.has(pn.partNumber)) {
        uniquePartNumbers.set(pn.partNumber, pn);
      }
    });
    return Array.from(uniquePartNumbers.values());
  }, []);

  // Popover 開關狀態
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  PCB Cost Calculator
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/part-numbers">
                <Button variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Part Number 管理
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Specifications */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/50 shadow-elevated">
              <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  基本規格
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="partNumber">PN</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="partNumber"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-10"
                      >
                        {specs.partNumber || "請選擇 PN"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="搜尋 PN..." />
                        <CommandList>
                          <CommandEmpty>找不到相符的 PN</CommandEmpty>
                          <CommandGroup>
                            {partNumbers.map((pn) => (
                              <CommandItem
                                key={pn.id}
                                value={pn.partNumber}
                                onSelect={() => {
                                  updateSpec("partNumber", pn.partNumber);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    specs.partNumber === pn.partNumber ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {pn.partNumber}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="layers">PCB 層數</Label>
                  <Select value={specs.layers.toString()} onValueChange={(v) => updateSpec("layers", parseInt(v))}>
                    <SelectTrigger id="layers">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2層</SelectItem>
                      <SelectItem value="4">4層</SelectItem>
                      <SelectItem value="6">6層</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surface">表面處理</Label>
                  <Select value={specs.surfaceTreatment} onValueChange={(v: any) => updateSpec("surfaceTreatment", v)}>
                    <SelectTrigger id="surface">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(surfaceTreatments).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">材料類型</Label>
                  <Select value={specs.materialType} onValueChange={(v: any) => updateSpec("materialType", v)}>
                    <SelectTrigger id="material">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(materialTypes).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thickness">板厚 (mm)</Label>
                  <Select value={specs.thickness} onValueChange={(v) => updateSpec("thickness", v)}>
                    <SelectTrigger id="thickness">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(boardThickness).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">面積 (m²)</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      id="area"
                      value={[specs.areaM2]}
                      onValueChange={([v]) => updateSpec("areaM2", v)}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={specs.areaM2.toFixed(2)}
                      onChange={(e) => updateSpec("areaM2", parseFloat(e.target.value) || 0.1)}
                      className="w-20 text-center"
                      step={0.1}
                      min={0.1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">需求量 (pcs)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={specs.quantity}
                    onChange={(e) => updateSpec("quantity", parseInt(e.target.value) || 1)}
                    className="text-center"
                    step={1}
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-elevated">
              <CardHeader className="bg-gradient-to-br from-accent/5 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-accent" />
                  進階設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="holeSize">最小孔徑 (mm)</Label>
                  <Select value={specs.minHoleSize} onValueChange={(v) => updateSpec("minHoleSize", v)}>
                    <SelectTrigger id="holeSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(minHoleSize).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smColor">防焊顏色</Label>
                  <Select value={specs.smColor} onValueChange={(v: any) => updateSpec("smColor", v)}>
                    <SelectTrigger id="smColor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(smColors).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="innerCopper">內層銅厚</Label>
                  <Select value={specs.innerCopper} onValueChange={(v: any) => updateSpec("innerCopper", v)}>
                    <SelectTrigger id="innerCopper">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(innerCopper).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outerCopper">外層銅厚</Label>
                  <Select value={specs.outerCopper} onValueChange={(v: any) => updateSpec("outerCopper", v)}>
                    <SelectTrigger id="outerCopper">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(outerCopper).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lineSpace">線寬/線距</Label>
                  <Select value={specs.lineSpace} onValueChange={(v: any) => updateSpec("lineSpace", v)}>
                    <SelectTrigger id="lineSpace">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(lineSpace).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vcut">V-Cut</Label>
                  <Select value={specs.vCut} onValueChange={(v: any) => updateSpec("vCut", v)}>
                    <SelectTrigger id="vcut">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(vCut).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 孔數/平方米（僅作為加價的計算依據） */}
                <div className="space-y-2">
                  <Label htmlFor="holesPerSquareMeter">孔數 / 平方米（個/m²）</Label>
                  <Input
                    id="holesPerSquareMeter"
                    type="number"
                    value={specs.holesPerSquareMeter ?? 0}
                    onChange={(e) => updateSpec("holesPerSquareMeter", parseInt(e.target.value) || 0)}
                    className="text-center"
                    step={1000}
                    min={0}
                  />
                </div>

            {/* 特殊疊構 - 1 選擇 */}
            <div className="space-y-2">
              <Label htmlFor="specialStackup1">特殊疊構-1</Label>
              <Select value={specs.specialStackup1 ?? "NA"} onValueChange={(v: any) => updateSpec("specialStackup1", v)}>
                <SelectTrigger id="specialStackup1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(specialStackup1).map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 特殊疊構 - 2 選擇 */}
            <div className="space-y-2">
              <Label htmlFor="specialStackup2">特殊疊構-2</Label>
              <Select value={specs.specialStackup2 ?? "N/A"} onValueChange={(v: any) => updateSpec("specialStackup2", v)}>
                <SelectTrigger id="specialStackup2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(specialStackup2).map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 特殊製程 - 1 選擇 */}
            <div className="space-y-2">
              <Label htmlFor="specialProcess1">特殊製程-1</Label>
              <Select value={specs.specialProcess1 ?? "N/A"} onValueChange={(v: any) => updateSpec("specialProcess1", v)}>
                <SelectTrigger id="specialProcess1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(specialProcess1).map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 特殊製程 - 2 選擇 */}
            <div className="space-y-2">
              <Label htmlFor="specialProcess2">特殊製程-2</Label>
              <Select value={specs.specialProcess2 ?? "N/A"} onValueChange={(v: any) => updateSpec("specialProcess2", v)}>
                <SelectTrigger id="specialProcess2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(specialProcess2).map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 出臺灣盟清關+運費（下拉 Y/N） */}
            <div className="space-y-2">
              <Label htmlFor="exportTWCustomsShipping">出臺灣盟清關+運費</Label>
              <Select value={specs.exportTWCustomsShipping ?? "N"} onValueChange={(v: any) => updateSpec("exportTWCustomsShipping", v)}>
                <SelectTrigger id="exportTWCustomsShipping">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">Y</SelectItem>
                  <SelectItem value="N">N</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 出CKD不收叉板（下拉 Y/N） */}
            <div className="space-y-2">
              <Label htmlFor="ckdNoTray">出CKD不收叉板</Label>
              <Select value={specs.ckdNoTray ?? "N"} onValueChange={(v: any) => updateSpec("ckdNoTray", v)}>
                <SelectTrigger id="ckdNoTray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">Y</SelectItem>
                  <SelectItem value="N">N</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="panelLengthMm">连板尺寸长 (mm)</Label>
                <Input
                  id="panelLengthMm"
                  type="number"
                  value={specs.panelLengthMm ?? 0}
                  onChange={(e) => updateSpec("panelLengthMm", parseFloat(e.target.value) || 0)}
                  className="text-center"
                  step={0.1}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panelWidthMm">连板尺寸宽 (mm)</Label>
                <Input
                  id="panelWidthMm"
                  type="number"
                  value={specs.panelWidthMm ?? 0}
                  onChange={(e) => updateSpec("panelWidthMm", parseFloat(e.target.value) || 0)}
                  className="text-center"
                  step={0.1}
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="panelCount">連板數</Label>
              <Input
                id="panelCount"
                type="number"
                value={specs.panelCount ?? 1}
                onChange={(e) => updateSpec("panelCount", parseInt(e.target.value) || 1)}
                className="text-center"
                step={1}
                min={1}
              />
            </div>

            {/* PCS 面積/平米數 顯示（唯讀）：(L*W)/25.4/25.4/144/(連板數)*10.764 */}
            {(() => {
              const L = specs.panelLengthMm ?? 0;
              const W = specs.panelWidthMm ?? 0;
              const panelCount = (specs.panelCount ?? 1) || 1;
              const pcsAreaPerM2 = ((L * W) / 25.4 / 25.4 / 144 / panelCount) * 10.764;
              return (
                <div className="space-y-2">
                  <Label>PCS面積 / 平米數</Label>
                  <Input value={pcsAreaPerM2.toFixed(6)} disabled className="text-center" />
                </div>
              );
            })()}

            {/* 板材利用率（百分比） */}
            <div className="space-y-2">
              <Label htmlFor="boardUtilizationPercent">板材利用率 (%)</Label>
              <div className="relative">
                <Input
                  id="boardUtilizationPercent"
                  type="number"
                  value={specs.boardUtilizationPercent ?? 0}
                  onChange={(e) => updateSpec("boardUtilizationPercent", parseFloat(e.target.value) || 0)}
                  className="text-center pr-8"
                  step={1}
                  min={0}
                  max={100}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none"
                >
                  %
                </span>
              </div>
            </div>

            {/* 板材利用率（加價，¥/m²）唯讀顯示，採用預設供應商計算 */}
            <div className="space-y-2">
              <Label>板材利用率（加價，¥/m²）</Label>
              <Input value={`¥${utilizationAdderDisplay}`} disabled className="text-center" />
            </div>

                
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            <SupplierComparison specs={specs} />
            <CostBreakdown specs={specs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCBCalculator;
