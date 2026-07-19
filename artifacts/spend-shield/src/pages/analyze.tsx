import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useAnalyzeBills } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { formatINR } from "@/lib/utils";

export default function Analyze() {
  const sessionId = useSession();
  const [statement, setStatement] = useState("");
  
  const analyzeMutation = useAnalyzeBills({
    mutation: {
      onSuccess: (data) => {
        toast.success(`Analysis complete! Found ${data.totalFound} subscriptions.`);
      },
      onError: (error) => {
        toast.error("Failed to analyze statement. Please try again.");
        console.error(error);
      }
    }
  });

  const handleAnalyze = () => {
    if (!statement.trim()) {
      toast.error("Please paste your bank statement text first.");
      return;
    }
    
    analyzeMutation.mutate({
      data: {
        text: statement,
        sessionId: sessionId
      }
    });
  };

  const isSuccess = analyzeMutation.isSuccess;
  const result = analyzeMutation.data;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight">Analyze Statements</h1>
        <p className="text-muted-foreground text-lg">
          Paste your bank or credit card statement text below. We'll automatically find hidden and recurring subscriptions.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Statement Text</CardTitle>
              <CardDescription>
                Copy and paste the transaction history directly from your banking portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="01/10/2023    NETFLIX.COM      ₹649.00&#10;03/10/2023    ANYTIME FITNESS  ₹2,500.00&#10;..."
                className="min-h-[300px] font-mono text-sm"
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                disabled={analyzeMutation.isPending}
              />
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzeMutation.isPending || !statement.trim()}
                className="w-full text-lg h-12"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="mr-2 h-5 w-5" />
                    Scan for Subscriptions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-secondary/30 border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Safe & Secure</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>Everything is processed locally in your session. We do not store your raw statements.</p>
              <p>For best results, make sure the text includes dates, merchant names, and amounts.</p>
            </CardContent>
          </Card>

          {isSuccess && result && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <CardTitle className="text-lg">Analysis Complete</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                  <span className="text-sm">Total Found</span>
                  <span className="font-bold font-mono">{result.totalFound}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                  <span className="text-sm">Flagged for Review</span>
                  <span className="font-bold text-destructive font-mono">{result.totalFlagged}</span>
                </div>
                
                <Button asChild className="w-full gap-2 mt-2" variant="default">
                  <Link href="/subscriptions">
                    Review Findings <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
