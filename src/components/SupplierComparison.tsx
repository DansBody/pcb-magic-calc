import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PCBSpecs, suppliers } from "@/data/pcbData";
import { calculateCost } from "@/utils/costCalculator";
import { TrendingDown, TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SupplierComparisonProps {
  specs: PCBSpecs;
}

const SupplierComparison = ({ specs }: SupplierComparisonProps) => {
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
          <Badge variant="outline" className="bg-card">
            總面積: {specs.areaM2.toFixed(2)} m²
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {sortedCosts.map((item, index) => {
            const isLowest = item.cost.totalCost === lowestCost;
            const isHighest = item.cost.totalCost === highestCost;
            const savingsPercent = ((highestCost - item.cost.totalCost) / highestCost * 100).toFixed(1);
            
            return (
              <div
                key={item.supplier}
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  isLowest 
                    ? "bg-gradient-to-r from-success/10 to-success/5 border-success/30" 
                    : "bg-card/50 border-border/50"
                }`}
              >
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierComparison;
