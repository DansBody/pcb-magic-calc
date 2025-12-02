import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PCBSpecs, suppliers, Supplier } from "@/data/pcbData";
import { calculateCost } from "@/utils/costCalculator";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { PieChart, ChevronDown, Calculator, Percent } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface CostBreakdownProps {
  specs: PCBSpecs;
}

const CostBreakdown = ({ specs }: CostBreakdownProps) => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>("全成信");
  const cost = calculateCost(specs, selectedSupplier);

  const breakdownData = [
    { name: "基礎價格", value: cost.basePrice, color: "hsl(var(--primary))" },
    { name: "表面處理", value: cost.surfaceTreatment, color: "hsl(var(--accent))" },
    { name: "材料類型", value: cost.materialType, color: "hsl(235 60% 65%)" },
    { name: "板厚", value: cost.thickness, color: "hsl(270 60% 60%)" },
    { name: "孔徑", value: cost.holeSize, color: "hsl(150 60% 50%)" },
    { name: "防焊顏色", value: cost.smColor, color: "hsl(35 80% 55%)" },
    { name: "內層銅厚", value: cost.innerCopper, color: "hsl(200 60% 55%)" },
    { name: "外層銅厚", value: cost.outerCopper, color: "hsl(320 60% 60%)" },
    { name: "線寬/線距", value: cost.lineSpace, color: "hsl(180 55% 50%)" },
    { name: "V-Cut", value: cost.vCut, color: "hsl(60 70% 55%)" }
  ].filter(item => item.value !== 0);

  return (
    <Card className="border-border/50 shadow-elevated">
      <CardHeader className="bg-gradient-to-br from-accent/10 via-primary/5 to-accent/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-accent" />
            成本明細分析
          </CardTitle>
          <Select value={selectedSupplier} onValueChange={(v) => setSelectedSupplier(v as Supplier)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(supplier => (
                <SelectItem key={supplier} value={supplier}>
                  {supplier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={80}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))"
                  }}
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, "成本"]}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="text-sm text-muted-foreground">每平方米價格</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-1">
                ¥{cost.totalPerM2.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
              <div className="text-sm text-muted-foreground">總成本 ({specs.areaM2.toFixed(2)} m²)</div>
              <div className="text-3xl font-bold text-success mt-1">
                ¥{cost.totalCost.toFixed(2)}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-sm font-semibold text-foreground">成本組成</div>
              {breakdownData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    ¥{item.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* 公式加價詳細分解 */}
            <div className="pt-4">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="formula-amount">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-accent" />
                      <span className="font-medium">公式加價金額詳細分解</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (¥{cost.formulaAdderAmount.toFixed(2)})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {cost.formulaAdderBreakdown.length > 0 ? (
                        cost.formulaAdderBreakdown.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">{item.name}</span>
                              {item.percentage > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({item.percentage.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              ¥{item.amount.toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          無公式加價項目
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* 公式加價百分比詳細分解 */}
                <AccordionItem value="formula-percentage">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-accent" />
                      <span className="font-medium">公式加價百分比詳細分解</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({cost.formulaAdderPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {cost.formulaPercentageBreakdown.length > 0 ? (
                        cost.formulaPercentageBreakdown.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                            <span className="text-sm text-foreground">{item.name}</span>
                            <span className="text-sm font-medium text-foreground">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          無百分比加價項目
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* MSTC 标准平米价详细分解 */}
                <AccordionItem value="mstc-breakdown">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-accent" />
                      <span className="font-medium">MSTC 标准平米价详细分解</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (¥{cost.mstcStandardPricePerM2.toFixed(2)})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {cost.mstcStandardPriceBreakdown.length > 0 ? (
                        cost.mstcStandardPriceBreakdown.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">{item.name}</span>
                              {item.type === 'percent' && item.percent !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  ({item.percent.toFixed(1)}%)
                                </span>
                              )}
                              {item.type === 'fixed' && (
                                <span className="text-xs text-muted-foreground">(定值)</span>
                              )}
                              {item.type === 'base' && (
                                <span className="text-xs text-muted-foreground">(基礎單價)</span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              ¥{item.amount.toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          無 MSTC 標準平米價加項
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdown;
