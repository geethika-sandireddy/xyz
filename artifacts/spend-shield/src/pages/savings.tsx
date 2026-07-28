import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { 
  useGetSavingsSummary, 
  useListSavings, 
  useRecordSaving,
  getGetSavingsSummaryQueryKey,
  getListSavingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PiggyBank, ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

export default function Savings() {
  const sessionId = useSession();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionName: "",
    amountSaved: "",
    note: ""
  });

  const { data: summary, isLoading: isSummaryLoading } = useGetSavingsSummary({ sessionId }, { query: { enabled: !!sessionId, queryKey: getGetSavingsSummaryQueryKey({ sessionId }) } });
  const { data: listData, isLoading: isListLoading } = useListSavings({ sessionId }, { query: { enabled: !!sessionId, queryKey: getListSavingsQueryKey({ sessionId }) } });

  const recordMutation = useRecordSaving({
    mutation: {
      onSuccess: () => {
        toast.success("Savings recorded successfully!");
        setFormData({ subscriptionName: "", amountSaved: "", note: "" });
        setIsRecording(false);
        queryClient.invalidateQueries({ queryKey: getGetSavingsSummaryQueryKey({ sessionId }) });
        queryClient.invalidateQueries({ queryKey: getListSavingsQueryKey({ sessionId }) });
      },
      onError: (err) => {
        toast.error("Failed to record savings.");
        console.error(err);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subscriptionName || !formData.amountSaved) {
      toast.error("Please fill in all required fields.");
      return;
    }

    recordMutation.mutate({
      data: {
        sessionId,
        subscriptionName: formData.subscriptionName,
        amountSaved: Number(formData.amountSaved),
        note: formData.note || undefined
      }
    });
  };

  const isLoading = isSummaryLoading || isListLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const savings = listData?.savings || [];
  const chartData = summary?.monthlySavings || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display tracking-tight">Savings Impact</h1>
          <p className="text-muted-foreground text-lg">
            Track the money you've protected from unwanted subscriptions.
          </p>
        </div>
        <Button onClick={() => setIsRecording(!isRecording)} className="gap-2" variant={isRecording ? "secondary" : "default"}>
          {isRecording ? "Cancel" : <><Plus className="w-4 h-4" /> Record Win</>}
        </Button>
      </div>

      {isRecording && (
        <Card className="border-primary/50 shadow-md animate-in slide-in-from-top-4 fade-in duration-300">
          <CardHeader>
            <CardTitle>Record a Savings Win</CardTitle>
            <CardDescription>Manually log money saved by negotiating or cancelling a service.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscriptionName">Service Name *</Label>
                  <Input 
                    id="subscriptionName" 
                    placeholder="e.g. Adobe Creative Cloud" 
                    value={formData.subscriptionName}
                    onChange={e => setFormData({ ...formData, subscriptionName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amountSaved">Amount Saved (Annualized) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input 
                      id="amountSaved" 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="pl-8"
                      placeholder="5000" 
                      value={formData.amountSaved}
                      onChange={e => setFormData({ ...formData, amountSaved: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Notes (Optional)</Label>
                <Textarea 
                  id="note" 
                  placeholder="e.g. Negotiated a 50% discount for the next year." 
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={recordMutation.isPending} className="w-full sm:w-auto">
                {recordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Record
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <PiggyBank className="w-48 h-48" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-primary-foreground/80 font-medium">Total Wealth Protected</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl sm:text-5xl font-bold font-mono tracking-tighter">
              {formatINR(summary?.totalSaved || 0)}
            </div>
            <p className="mt-2 text-primary-foreground/80 text-sm flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> Across {summary?.totalCount || 0} subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Monthly Savings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[180px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: number) => [formatINR(value), 'Saved']}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg mt-2">
                No savings data to chart yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-display">Recent Wins</h2>
        {savings.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <PiggyBank className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You haven't recorded any savings yet.</p>
              <p className="text-sm mt-1">Start canceling unwanted subscriptions and log your wins here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savings.map(saving => (
              <Card key={saving.id} className="group hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold">{saving.subscriptionName}</div>
                    <div className="font-mono text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded text-sm">
                      +{formatINR(saving.amountSaved)}
                    </div>
                  </div>
                  {saving.note && (
                    <p className="text-sm text-muted-foreground line-clamp-2">"{saving.note}"</p>
                  )}
                  <div className="text-xs text-muted-foreground/60 pt-2 border-t">
                    Saved on {new Date(saving.savedAt).toLocaleDateString('en-IN', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
