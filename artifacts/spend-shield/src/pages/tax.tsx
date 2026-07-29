import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useEstimateTax } from "@workspace/api-client-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Receipt, Loader2, Info } from "lucide-react";

export default function Tax() {
  const sessionId = useSession();
  const [annualIncome, setAnnualIncome] = useState("");
  const [deductions80C, setDeductions80C] = useState("");

  const estimateMutation = useEstimateTax({
    mutation: {
      onError: (err: any) => {
        if (err?.status === 402) {
          toast.error("tax estimator is a pro feature - upgrade on the Account page");
        } else {
          toast.error("couldn't estimate, try again");
        }
      },
    },
  });

  const handleEstimate = () => {
    if (!annualIncome) return;
    estimateMutation.mutate({
      data: {
        sessionId,
        annualIncome: parseFloat(annualIncome),
        deductions80C: parseFloat(deductions80C || "0"),
        standardDeduction: true,
      },
    });
  };

  const result = estimateMutation.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
          <Receipt className="w-7 h-7 text-primary" /> Tax Estimator
        </h1>
        <p className="text-muted-foreground text-lg">A rough estimate of tax under the old vs. new regime.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Numbers</CardTitle>
          <CardDescription>Annual gross income and any Section 80C investments (PF, ELSS, insurance, etc.)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Annual income (₹)</Label>
              <Input type="number" placeholder="e.g. 900000" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Section 80C investments (₹, optional)</Label>
              <Input type="number" placeholder="e.g. 150000" value={deductions80C} onChange={(e) => setDeductions80C(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleEstimate} disabled={!annualIncome || estimateMutation.isPending} className="w-full">
            {estimateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Estimate Tax"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className={result.recommendedRegime === "new" ? "border-primary/40 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">New Regime</CardTitle>
                  {result.recommendedRegime === "new" && <Badge>Better for you</Badge>}
                </div>
                <CardDescription>Taxable income: {formatINR(result.new.taxableIncome)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono">{formatINR(result.new.estimatedTax)}</p>
              </CardContent>
            </Card>
            <Card className={result.recommendedRegime === "old" ? "border-primary/40 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Old Regime</CardTitle>
                  {result.recommendedRegime === "old" && <Badge>Better for you</Badge>}
                </div>
                <CardDescription>Taxable income: {formatINR(result.old.taxableIncome)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono">{formatINR(result.old.estimatedTax)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50 border border-dashed text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{result.disclaimer}</p>
          </div>
        </>
      )}
    </div>
  );
}
