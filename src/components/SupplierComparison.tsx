import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PCBSpecs, suppliers } from "@/data/pcbData";
import { calculateCost } from "@/utils/costCalculator";
import { TrendingDown, TrendingUp, Award, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { getPartNumberByPartNumber } from "@/utils/partNumberStorage";

// USD 到 RMB 匯率（可根據需要調整）
const USD_TO_RMB_RATE = 7.2;

// 比較項目類型
type ComparisonMetric = 
  | "totalCost" 
  | "totalPerM2" 
  | "mstcStandardPricePerM2" 
  | "mstcStandardUnitPrice"
  | "formulaAdderAmount"
  | "priceDifferencePerM2"
  | "priceDifference";

// 比較項目選項
const comparisonMetrics: { value: ComparisonMetric; label: string }[] = [
  { value: "totalCost", label: "总金额 (RMB)" },
  { value: "totalPerM2", label: "总平米价 (RMB/m²)" },
  { value: "mstcStandardPricePerM2", label: "MSTC 标准平米价 (RMB/m²)" },
  { value: "mstcStandardUnitPrice", label: "MSTC 标准单价 (RMB)" },
  { value: "formulaAdderAmount", label: "公式加价金额 (RMB)" },
  { value: "priceDifferencePerM2", label: "与标准平米价 AM 之价差 (RMB)" },
  { value: "priceDifference", label: "与标准单价 AN 之价差 (RMB)" },
];

interface SupplierComparisonProps {
  specs: PCBSpecs;
}

const SupplierComparison = ({ specs }: SupplierComparisonProps) => {
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>("totalCost");
  
  // 取得 PN 對應的價格資訊
  const partNumberInfo = specs.partNumber ? getPartNumberByPartNumber(specs.partNumber) : null;
  const currentUnitPriceRMB = partNumberInfo 
    ? (partNumberInfo.currency === "USD" 
        ? partNumberInfo.unitPrice * USD_TO_RMB_RATE 
        : partNumberInfo.unitPrice)
    : null;
  
  const costs = suppliers.map(supplier => ({
    supplier,
    cost: calculateCost(specs, supplier)
  }));

  // 根據選擇的比較項目獲取比較值
  const getComparisonValue = (item: typeof costs[0]): number => {
    const { cost } = item;
    
    switch (comparisonMetric) {
      case "totalCost":
        return cost.totalCost;
      case "totalPerM2":
        return cost.totalPerM2;
      case "mstcStandardPricePerM2":
        return cost.mstcStandardPricePerM2;
      case "mstcStandardUnitPrice": {
        const mstcStandardUnitPriceRMB = 
          specs.panelLengthMm && specs.panelWidthMm && specs.panelCount
            ? cost.mstcStandardPricePerM2 *
              ((specs.panelLengthMm * specs.panelWidthMm) / 1000000 / specs.panelCount)
            : 0;
        return mstcStandardUnitPriceRMB;
      }
      case "formulaAdderAmount":
        return cost.formulaAdderAmount;
      case "priceDifferencePerM2": {
        const currentPricePerM2RMB = 
          currentUnitPriceRMB !== null && specs.panelLengthMm && specs.panelWidthMm && specs.panelCount
            ? (currentUnitPriceRMB / (specs.panelLengthMm * specs.panelWidthMm)) * 1000000 * specs.panelCount
            : null;
        const priceDifferencePerM2RMB = 
          currentPricePerM2RMB !== null
            ? currentPricePerM2RMB - cost.mstcStandardPricePerM2
            : 0;
        return priceDifferencePerM2RMB;
      }
      case "priceDifference": {
        const mstcStandardUnitPriceRMB = 
          specs.panelLengthMm && specs.panelWidthMm && specs.panelCount
            ? cost.mstcStandardPricePerM2 *
              ((specs.panelLengthMm * specs.panelWidthMm) / 1000000 / specs.panelCount)
            : null;
        const priceDifferenceRMB = 
          currentUnitPriceRMB !== null && mstcStandardUnitPriceRMB !== null
            ? currentUnitPriceRMB - mstcStandardUnitPriceRMB
            : 0;
        return priceDifferenceRMB;
      }
      default:
        return cost.totalCost;
    }
  };

  // 根據選擇的比較項目排序（值越小越優惠）
  const sortedCosts = [...costs].sort((a, b) => {
    const valueA = getComparisonValue(a);
    const valueB = getComparisonValue(b);
    return valueA - valueB;
  });
  
  const comparisonValues = sortedCosts.map(item => getComparisonValue(item));
  const lowestValue = comparisonValues[0];
  const highestValue = comparisonValues[comparisonValues.length - 1];

  return (
    <Card className="border-border/50 shadow-elevated">
      <CardHeader className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5">
        <CardTitle className="flex items-center justify-between">
          <span>供應商報價比較</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-card">
              總面積: {specs.areaM2.toFixed(4)} m²
            </Badge>
            <Badge variant="outline" className="bg-card">
              需求量: {specs.quantity} pcs
            </Badge>
          </div>
        </CardTitle>
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <Label htmlFor="comparison-metric" className="text-sm font-medium">
              比較項目：
            </Label>
            <Select value={comparisonMetric} onValueChange={(v) => setComparisonMetric(v as ComparisonMetric)}>
              <SelectTrigger id="comparison-metric" className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {comparisonMetrics.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {sortedCosts.map((item, index) => {
            const comparisonValue = getComparisonValue(item);
            const isLowest = comparisonValue === lowestValue && lowestValue !== highestValue;
            const isHighest = comparisonValue === highestValue;
            const savingsPercent = highestValue !== 0 
              ? ((highestValue - comparisonValue) / Math.abs(highestValue) * 100).toFixed(1)
              : "0.0";
            const isExpanded = expandedSupplier === item.supplier;
            
            // 計算 MSTC 标准单价(RMB)
            const mstcStandardUnitPriceRMB = 
              specs.panelLengthMm && specs.panelWidthMm && specs.panelCount
                ? item.cost.mstcStandardPricePerM2 *
                  ((specs.panelLengthMm * specs.panelWidthMm) / 1000000 / specs.panelCount)
                : null;
            
            // 計算与标准单价 AN 之价差 (RMB)
            const priceDifferenceRMB = 
              currentUnitPriceRMB !== null && mstcStandardUnitPriceRMB !== null
                ? currentUnitPriceRMB - mstcStandardUnitPriceRMB
                : null;
            
            // 計算偏差值（百分比）
            const deviationPercent = 
              priceDifferenceRMB !== null && mstcStandardUnitPriceRMB !== null && mstcStandardUnitPriceRMB !== 0
                ? (priceDifferenceRMB / mstcStandardUnitPriceRMB) * 100
                : null;
            
            // 計算目前平米价 (RMB)
            const currentPricePerM2RMB = 
              currentUnitPriceRMB !== null && specs.panelLengthMm && specs.panelWidthMm && specs.panelCount
                ? (currentUnitPriceRMB / (specs.panelLengthMm * specs.panelWidthMm)) * 1000000 * specs.panelCount
                : null;
            
            // 計算与标准平米价 AM 之价差 (RMB)
            const priceDifferencePerM2RMB = 
              currentPricePerM2RMB !== null
                ? currentPricePerM2RMB - item.cost.mstcStandardPricePerM2
                : null;
            
            // 計算影响金额 (RMB) - 總价差
            const totalPriceDifferenceRMB = 
              priceDifferenceRMB !== null
                ? specs.quantity * priceDifferenceRMB
                : null;
            
            return (
              <Collapsible
                key={item.supplier}
                open={isExpanded}
                onOpenChange={() => setExpandedSupplier(isExpanded ? null : item.supplier)}
              >
                <div
                  className={`rounded-lg border transition-all ${
                    isLowest 
                      ? "bg-gradient-to-r from-success/10 to-success/5 border-success/30" 
                      : "bg-card/50 border-border/50"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isLowest && (
                          <Award className="h-5 w-5 text-success" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{item.supplier}</span>
                            {isLowest && (
                              <Badge className="bg-success text-success-foreground">最優惠</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            ¥{item.cost.totalPerM2.toFixed(2)}/m² × {specs.areaM2.toFixed(2)}m²
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            ¥{comparisonValue.toFixed(2)}
                          </div>
                          {!isLowest && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>+{savingsPercent}%</span>
                            </div>
                          )}
                        </div>
                        
                        <CollapsibleTrigger className="p-2 hover:bg-muted rounded-md transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isLowest 
                            ? "bg-gradient-to-r from-success to-success/70" 
                            : "bg-gradient-to-r from-primary to-accent"
                        }`}
                        style={{ 
                          width: (() => {
                            if (highestValue === lowestValue) return "100%";
                            const range = highestValue - lowestValue;
                            if (range === 0) return "0%";
                            const normalizedValue = (comparisonValue - lowestValue) / range;
                            return `${Math.max(0, Math.min(100, normalizedValue * 100))}%`;
                          })()
                        }}
                      />
                    </div>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 border-t border-border/50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">MSTC 标准单价 (RMB)</div>
                          <div className="font-semibold">{
  specs.panelLengthMm && specs.panelWidthMm && specs.panelCount
    ? `¥${(
        item.cost.mstcStandardPricePerM2 *
        ((specs.panelLengthMm * specs.panelWidthMm) / 1000000 / specs.panelCount)
      ).toFixed(2)}`
    : "--"
}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">公式加价金额</div>
                          <div className="font-semibold">¥{item.cost.formulaAdderAmount.toFixed(2)}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">公式加价百分比</div>
                          <div className="font-semibold">{item.cost.formulaAdderPercentage.toFixed(2)}%</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">MSTC 标准平米价 (RMB)</div>
                          <div className="font-semibold">¥{item.cost.mstcStandardPricePerM2.toFixed(2)}</div>
                        </div>
                        
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">目前单价 (RMB)</div>
                          <div className="font-semibold">
                            {currentUnitPriceRMB !== null 
                              ? `¥${currentUnitPriceRMB.toFixed(2)}`
                              : "--"}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">目前平米价 (RMB)</div>
                          <div className="font-semibold">
                            {currentPricePerM2RMB !== null 
                              ? `¥${currentPricePerM2RMB.toFixed(2)}`
                              : "--"}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">与标准平米价 AM 之价差 (RMB)</div>
                          <div className="font-semibold">
                            {priceDifferencePerM2RMB !== null 
                              ? `¥${priceDifferencePerM2RMB.toFixed(2)}`
                              : "--"}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">与标准单价 AN 之价差 (RMB)</div>
                          <div className="font-semibold">
                            {priceDifferenceRMB !== null 
                              ? `¥${priceDifferenceRMB.toFixed(2)}`
                              : "--"}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">影响金额 (RMB)</div>
                          <div className="font-semibold">
                            {totalPriceDifferenceRMB !== null 
                              ? `¥${totalPriceDifferenceRMB.toFixed(2)}`
                              : "--"}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">偏差值</div>
                          <div className="font-semibold">
                            {deviationPercent !== null 
                              ? `${deviationPercent >= 0 ? '+' : ''}${deviationPercent.toFixed(2)}%`
                              : "--"}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">总面积</div>
                          <div className="font-semibold">{specs.areaM2.toFixed(4)} m²</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-primary/5 rounded-md border border-primary/20">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">总金额 (RMB)</span>
                          <span className="text-lg font-bold text-primary">¥{item.cost.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierComparison;
