import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { PCBSpecs, suppliers, Supplier } from "@/data/pcbData";
import { Calculator, Layers, Wrench } from "lucide-react";
import CostBreakdown from "./CostBreakdown";
import SupplierComparison from "./SupplierComparison";

const PCBCalculator = () => {
  const [specs, setSpecs] = useState<PCBSpecs>({
    layers: 4,
    surfaceTreatment: "OSP",
    materialType: "TG140℃",
    thickness: "1.6",
    minHoleSize: "0.2",
    holeDensity: 150000,
    smColor: "Green",
    innerCopper: "H/H oz",
    outerCopper: "1/1 oz",
    lineSpace: "4/4 mil",
    vCut: "无",
    areaM2: 1.0,
    quantity: 1
  });

  const updateSpec = <K extends keyof PCBSpecs>(key: K, value: PCBSpecs[K]) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PCB 成本計算機
              </h1>
              <p className="text-sm text-muted-foreground">專業 PCB 報價分析工具</p>
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
                      <SelectItem value="OSP">OSP</SelectItem>
                      <SelectItem value="HASL(噴錫)">HASL (噴錫)</SelectItem>
                      <SelectItem value="LF HASL">LF HASL (無鉛噴錫)</SelectItem>
                      <SelectItem value="IMS(化銀)">IMS (化銀)</SelectItem>
                      <SelectItem value="IMT(化錫)">IMT (化錫)</SelectItem>
                      <SelectItem value="ENIG 2u">ENIG 2u (化金)</SelectItem>
                      <SelectItem value="ENIG 3u">ENIG 3u (化金)</SelectItem>
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
                      <SelectItem value="TG135℃">TG135℃</SelectItem>
                      <SelectItem value="TG140℃">TG140℃</SelectItem>
                      <SelectItem value="TG150℃">TG150℃</SelectItem>
                      <SelectItem value="TG170℃">TG170℃</SelectItem>
                      <SelectItem value="HF140℃">HF140℃</SelectItem>
                      <SelectItem value="HF150℃">HF150℃</SelectItem>
                      <SelectItem value="HF170℃">HF170℃</SelectItem>
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
                      <SelectItem value="0.8">0.8 mm</SelectItem>
                      <SelectItem value="1.0">1.0 mm</SelectItem>
                      <SelectItem value="1.2">1.2 mm</SelectItem>
                      <SelectItem value="1.6">1.6 mm</SelectItem>
                      <SelectItem value="2.0">2.0 mm</SelectItem>
                      <SelectItem value="3.0">3.0 mm</SelectItem>
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
                      <SelectItem value="0.15">0.15 mm</SelectItem>
                      <SelectItem value="0.2">0.2 mm</SelectItem>
                      <SelectItem value="0.25">0.25 mm</SelectItem>
                      <SelectItem value="0.3">0.3 mm</SelectItem>
                      <SelectItem value="0.35">0.35 mm</SelectItem>
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
                      <SelectItem value="Green">Green</SelectItem>
                      <SelectItem value="Blue">Blue</SelectItem>
                      <SelectItem value="Yellow">Yellow</SelectItem>
                      <SelectItem value="Red">Red</SelectItem>
                      <SelectItem value="Black">Black</SelectItem>
                      <SelectItem value="White">White</SelectItem>
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
                      <SelectItem value="H/H oz">H/H oz</SelectItem>
                      <SelectItem value="1/1 oz">1/1 oz</SelectItem>
                      <SelectItem value="1.5/1.5 oz">1.5/1.5 oz</SelectItem>
                      <SelectItem value="2/2 oz">2/2 oz</SelectItem>
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
                      <SelectItem value="H/H oz">H/H oz</SelectItem>
                      <SelectItem value="1/1 oz">1/1 oz</SelectItem>
                      <SelectItem value="1.5/1.5 oz">1.5/1.5 oz</SelectItem>
                      <SelectItem value="2/2 oz">2/2 oz</SelectItem>
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
                      <SelectItem value="2.5/2.5 mil">2.5/2.5 mil</SelectItem>
                      <SelectItem value="3/3 mil">3/3 mil</SelectItem>
                      <SelectItem value="3.2/3.2 mil">3.2/3.2 mil</SelectItem>
                      <SelectItem value="3.5/3.5 mil">3.5/3.5 mil</SelectItem>
                      <SelectItem value="4/4 mil">4/4 mil</SelectItem>
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
                      <SelectItem value="无">無</SelectItem>
                      <SelectItem value="≤3刀">≤3刀</SelectItem>
                      <SelectItem value="4-6刀">4-6刀</SelectItem>
                      <SelectItem value="7-10刀">7-10刀</SelectItem>
                    </SelectContent>
                  </Select>
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
