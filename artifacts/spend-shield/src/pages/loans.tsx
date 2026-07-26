import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import {
  useListLoans, useCreateLoan, useDeleteLoan, useUpdateLoan, getListLoansQueryKey,
  useGetLoanPayoff, getGetLoanPayoffQueryKey,
  type Loan,
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, Plus, Loader2, Trash2, TrendingDown, Calendar } from "lucide-react";

const LOAN_TYPES = ["home", "car", "personal", "education", "credit_card", "other"] as const;

function AddLoanDialog({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [loanType, setLoanType] = useState<string>("home");
  const [principal, setPrincipal] = useState("");
  const [outstandingBalance, setOutstandingBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useCreateLoan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey({ sessionId }) });
        toast.success("Loan added");
        setIsOpen(false);
        setLabel(""); setPrincipal(""); setOutstandingBalance(""); setInterestRate(""); setEmiAmount("");
      },
    },
  });

  const handleSubmit = () => {
    if (!label.trim() || !principal || !outstandingBalance || !interestRate || !emiAmount) {
      toast.error("Fill in all fields");
      return;
    }
    createMutation.mutate({
      data: {
        sessionId,
        label: label.trim(),
        loanType: loanType as any,
        principal: parseFloat(principal),
        outstandingBalance: parseFloat(outstandingBalance),
        interestRate: parseFloat(interestRate),
        emiAmount: parseFloat(emiAmount),
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Loan</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Loan</DialogTitle>
          <DialogDescription>Track EMIs and see how long until it's paid off.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Label</Label>
              <Input placeholder="e.g. Home Loan - SBI" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Type</Label>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOAN_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Principal (₹)</Label>
              <Input type="number" placeholder="2500000" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Outstanding (₹)</Label>
              <Input type="number" placeholder="1800000" value={outstandingBalance} onChange={(e) => setOutstandingBalance(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Interest rate (%)</Label>
              <Input type="number" step="0.01" placeholder="8.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>EMI (₹/mo)</Label>
              <Input type="number" placeholder="22000" value={emiAmount} onChange={(e) => setEmiAmount(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Loan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoanCard({ loan, sessionId }: { loan: Loan; sessionId: string }) {
  const queryClient = useQueryClient();
  const { data: payoff, isLoading } = useGetLoanPayoff(
    loan.id,
    { query: { queryKey: getGetLoanPayoffQueryKey(loan.id) } },
  );

  const deleteMutation = useDeleteLoan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey({ sessionId }) });
        toast.success("Loan removed");
      },
    },
  });

  const pctPaid = loan.principal > 0 ? Math.round(((loan.principal - loan.outstandingBalance) / loan.principal) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="outline" className="capitalize mb-2">{loan.loanType.replace("_", " ")}</Badge>
            <CardTitle className="text-lg">{loan.label}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate({ id: loan.id })}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>{formatINR(loan.outstandingBalance)} outstanding of {formatINR(loan.principal)} ({pctPaid}% paid) at {loan.interestRate}% p.a.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">EMI</span>
          <span className="font-mono font-semibold">{formatINR(loan.emiAmount)}/mo</span>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : payoff && (
          <>
            {payoff.monthsRemaining != null ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Payoff in</span>
                <span className="font-mono font-semibold">{payoff.monthsRemaining} months (~{(payoff.monthsRemaining / 12).toFixed(1)} yrs)</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded p-2">
                <TrendingDown className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{payoff.note}</span>
              </div>
            )}
            {payoff.monthsRemaining != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest remaining</span>
                <span className="font-mono">{formatINR(payoff.totalInterestRemaining)}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Loans() {
  const sessionId = useSession();
  const { data: loans = [], isLoading } = useListLoans({ sessionId }, { query: { enabled: !!sessionId, queryKey: getListLoansQueryKey({ sessionId }) } });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
            <Landmark className="w-7 h-7 text-primary" /> Loans
          </h1>
          <p className="text-muted-foreground text-lg">Track EMIs and see how long until you're debt-free.</p>
        </div>
        <AddLoanDialog sessionId={sessionId} />
      </div>

      {loans.length === 0 ? (
        <div className="text-center space-y-6 py-20 max-w-md mx-auto">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Landmark className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display">No loans tracked yet</h2>
            <p className="text-muted-foreground">Add a loan to see your payoff timeline and remaining interest.</p>
          </div>
          <AddLoanDialog sessionId={sessionId} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {loans.map(l => <LoanCard key={l.id} loan={l} sessionId={sessionId} />)}
        </div>
      )}
    </div>
  );
}
