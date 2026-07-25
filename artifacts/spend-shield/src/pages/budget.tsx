import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import {
  useGetBudgetProfile, useSetBudgetProfile, getGetBudgetProfileQueryKey,
  useListFixedExpenses, useCreateFixedExpense, useDeleteFixedExpense, getListFixedExpensesQueryKey,
  useListFinancialGoals, useCreateFinancialGoal, useDeleteFinancialGoal, getListFinancialGoalsQueryKey,
  useGetBudgetSummary, getGetBudgetSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet, Plus, Loader2, Trash2, Target, TrendingDown, TrendingUp,
  PiggyBank, AlertTriangle, CheckCircle2,
} from "lucide-react";

function IncomeCard({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetBudgetProfile({ sessionId }, { query: { enabled: !!sessionId } });
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [editing, setEditing] = useState(false);

  const saveMutation = useSetBudgetProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBudgetProfileQueryKey({ sessionId }) });
        queryClient.invalidateQueries({ queryKey: getGetBudgetSummaryQueryKey({ sessionId }) });
        toast.success("Budget profile saved");
        setEditing(false);
      },
    },
  });

  if (isLoading) return null;

  const showForm = editing || (profile && profile.monthlyIncome === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> Monthly Income</CardTitle>
        <CardDescription>Your salary and how much you want to set aside for savings each month.</CardDescription>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monthly income (₹)</Label>
              <Input type="number" placeholder="e.g. 45000" value={income}
                onChange={(e) => setIncome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Monthly savings target (₹)</Label>
              <Input type="number" placeholder="e.g. 5000" value={savings}
                onChange={(e) => setSavings(e.target.value)} />
            </div>
            <Button
              className="sm:col-span-2"
              disabled={saveMutation.isPending}
              onClick={() => {
                if (!income) { toast.error("Enter your monthly income"); return; }
                saveMutation.mutate({ data: { sessionId, monthlyIncome: parseFloat(income), savingsTarget: parseFloat(savings || "0") } });
              }}
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold font-mono">{formatINR(profile?.monthlyIncome ?? 0)}<span className="text-sm text-muted-foreground font-sans">/mo</span></p>
              <p className="text-sm text-muted-foreground">Savings target: {formatINR(profile?.savingsTarget ?? 0)}/mo</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setIncome(String(profile?.monthlyIncome ?? "")); setSavings(String(profile?.savingsTarget ?? "")); setEditing(true); }}>
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const EXPENSE_CATEGORIES = ["rent", "utilities", "transport", "food", "emi", "insurance", "other"] as const;

function ExpensesCard({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const { data: expenses = [] } = useListFixedExpenses({ sessionId }, { query: { enabled: !!sessionId } });
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("other");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListFixedExpensesQueryKey({ sessionId }) });
    queryClient.invalidateQueries({ queryKey: getGetBudgetSummaryQueryKey({ sessionId }) });
  };

  const createMutation = useCreateFixedExpense({
    mutation: {
      onSuccess: () => { invalidate(); setLabel(""); setAmount(""); toast.success("Expense added"); },
    },
  });
  const deleteMutation = useDeleteFixedExpense({ mutation: { onSuccess: invalidate } });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingDown className="w-5 h-5 text-destructive" /> Fixed Monthly Expenses</CardTitle>
        <CardDescription>Rent, electricity, petrol, food, EMIs — the costs you can't skip.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_120px_140px_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input placeholder="e.g. Rent" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Amount (₹)</Label>
            <Input type="number" placeholder="12000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="icon"
            disabled={createMutation.isPending}
            onClick={() => {
              if (!label.trim() || !amount) { toast.error("Label and amount required"); return; }
              createMutation.mutate({ data: { sessionId, label: label.trim(), amount: parseFloat(amount), category: category as any } });
            }}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {expenses.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-xs">{e.category}</Badge>
                  <span>{e.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">{formatINR(e.amount)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate({ id: e.id })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t">
              <span>Total fixed expenses</span>
              <span className="font-mono">{formatINR(total)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GoalsCard({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useListFinancialGoals({ sessionId }, { query: { enabled: !!sessionId } });
  const { data: summary } = useGetBudgetSummary({ sessionId }, { query: { enabled: !!sessionId } });
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListFinancialGoalsQueryKey({ sessionId }) });
    queryClient.invalidateQueries({ queryKey: getGetBudgetSummaryQueryKey({ sessionId }) });
  };

  const createMutation = useCreateFinancialGoal({
    mutation: {
      onSuccess: () => { invalidate(); setTitle(""); setTargetAmount(""); setTargetDate(""); toast.success("Goal added"); },
    },
  });
  const deleteMutation = useDeleteFinancialGoal({ mutation: { onSuccess: invalidate } });

  const summaryByTitle = new Map((summary?.goals ?? []).map(g => [g.title, g]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Financial Goals</CardTitle>
        <CardDescription>Short or long-term — like a home down payment. We'll work out what you need to save monthly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_140px_160px_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Goal</Label>
            <Input placeholder="e.g. Home down payment" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Target (₹)</Label>
            <Input type="number" placeholder="500000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Target date</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <Button
            size="icon"
            disabled={createMutation.isPending}
            onClick={() => {
              if (!title.trim() || !targetAmount) { toast.error("Goal name and target amount required"); return; }
              createMutation.mutate({ data: { sessionId, title: title.trim(), targetAmount: parseFloat(targetAmount), targetDate: targetDate || undefined } });
            }}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {goals.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            {goals.map(g => {
              const s = summaryByTitle.get(g.title);
              const pct = g.targetAmount > 0 ? Math.min(100, (g.savedSoFar / g.targetAmount) * 100) : 0;
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{g.title}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate({ id: g.id })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatINR(g.savedSoFar)} of {formatINR(g.targetAmount)}</span>
                    {s?.requiredMonthlySaving != null && <span>Need {formatINR(s.requiredMonthlySaving)}/mo to hit it</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RemainingBalanceCard({ sessionId }: { sessionId: string }) {
  const { data: summary, isLoading } = useGetBudgetSummary({ sessionId }, { query: { enabled: !!sessionId } });

  if (isLoading || !summary) return null;

  const isNegative = summary.remainingBalance < 0;

  return (
    <Card className={isNegative ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5" />
          Estimated Remaining Balance
        </CardTitle>
        <CardDescription>Income − fixed expenses − active subscriptions − savings target</CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-4xl font-bold font-mono ${isNegative ? "text-destructive" : "text-primary"}`}>
          {formatINR(summary.remainingBalance)}
          <span className="text-sm text-muted-foreground font-sans font-normal ml-2">safe to spend this month</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <p className="text-muted-foreground">Income</p>
            <p className="font-mono font-semibold">{formatINR(summary.monthlyIncome)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fixed expenses</p>
            <p className="font-mono font-semibold text-destructive">− {formatINR(summary.fixedExpensesTotal)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Subscriptions</p>
            <p className="font-mono font-semibold text-destructive">− {formatINR(summary.subscriptionsTotal)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Savings target</p>
            <p className="font-mono font-semibold text-destructive">− {formatINR(summary.savingsTarget)}</p>
          </div>
        </div>
        {isNegative && (
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>You're spending more than you earn once fixed costs and subscriptions are accounted for. Check your Subscriptions and Fixed Expenses for anything to trim.</p>
          </div>
        )}
        {!isNegative && summary.remainingBalance > 0 && (
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-primary/10 text-primary text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <p>You're on track — this is roughly what's left for discretionary spending after everything fixed is covered.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Budget() {
  const sessionId = useSession();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-primary" /> Budget
        </h1>
        <p className="text-muted-foreground text-lg">
          Your income, fixed costs, and goals — so you know exactly what's actually free to spend.
        </p>
      </div>

      <RemainingBalanceCard sessionId={sessionId} />
      <IncomeCard sessionId={sessionId} />
      <ExpensesCard sessionId={sessionId} />
      <GoalsCard sessionId={sessionId} />
    </div>
  );
}
