import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PCBSpecs, suppliers } from "@/data/pcbData";
import { calculateCost } from "@/utils/costCalculator";
import { TrendingDown, TrendingUp, Award, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface SupplierComparisonProps {
  specs: PCBSpecs;
}

const SupplierComparison = ({ specs }: SupplierComparisonProps) => {
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  
  const costs = suppliers.map(supplier => ({
    supplier,
    cost: calculateCost(specs, supplier)
  }));

  // Sort by total cost
  const sortedCosts = [...costs].sort((a, b) => a.cost.totalCost - b.cost.totalCost);
  const lowestCost = sortedCosts[0].cost.totalCost;
  const highestCost = sortedCosts[sortedCosts.length - 1].cost.totalCost;

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
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {sortedCosts.map((item, index) => {
            const isLowest = item.cost.totalCost === lowestCost;
            const isHighest = item.cost.totalCost === highestCost;
            const savingsPercent = ((highestCost - item.cost.totalCost) / highestCost * 100).toFixed(1);
            const isExpanded = expandedSupplier === item.supplier;
            
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
                            ¥{item.cost.totalCost.toFixed(2)}
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
                          width: `${(item.cost.totalCost / highestCost) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 border-t border-border/50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">公式加价金额</div>
                          <div className="font-semibold">¥{item.cost.formulaAdderAmount.toFixed(2)}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">公式加价百分比</div>
                          <div className="font-semibold">{item.cost.formulaAdderPercentage.toFixed(2)}%</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">MSTC 标准平米价</div>
                          <div className="font-semibold">¥{item.cost.mstcStandardPricePerM2.toFixed(2)}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">币别</div>
                          <div className="font-semibold">{item.cost.currency}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="text-muted-foreground mb-1">目前平米价</div>
                          <div className="font-semibold">¥{item.cost.totalPerM2.toFixed(2)}</div>
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
