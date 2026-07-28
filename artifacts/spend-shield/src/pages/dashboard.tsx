import { Link } from "wouter";
import { useSession } from "@/hooks/use-session";
import {
  useGetBudgetSummary, getGetBudgetSummaryQueryKey,
  useListSubscriptions, getListSubscriptionsQueryKey,
  useListUpcomingRenewals, getListUpcomingRenewalsQueryKey,
  useGetSavingsSummary,
  useGetMessageStats,
} from "@workspace/api-client-react";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet, List, AlarmClock, PiggyBank, ArrowRight, Loader2, Bell, TrendingUp, MessageSquareText,
} from "lucide-react";

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default function Dashboard() {
  const sessionId = useSession();

  const budget = useGetBudgetSummary({ sessionId }, { query: { enabled: !!sessionId, queryKey: getGetBudgetSummaryQueryKey({ sessionId }) } });
  const subscriptions = useListSubscriptions({ sessionId }, { query: { enabled: !!sessionId, queryKey: getListSubscriptionsQueryKey({ sessionId }) } });
  const upcoming = useListUpcomingRenewals({ sessionId, days: 7 }, { query: { enabled: !!sessionId, queryKey: getListUpcomingRenewalsQueryKey({ sessionId, days: 7 }) } });
  const savings = useGetSavingsSummary();
  const stats = useGetMessageStats();

  const isLoading = budget.isLoading || subscriptions.isLoading || upcoming.isLoading || savings.isLoading;

  if (!sessionId || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeSubs = (subscriptions.data ?? []).filter(s => s.status === "active" || s.status === "flagged");
  const flaggedCount = (subscriptions.data ?? []).filter(s => s.status === "flagged").length;
  const hasAnyData = activeSubs.length > 0 || (budget.data && budget.data.monthlyIncome > 0);

  if (!hasAnyData) {
    return (
      <div className="text-center space-y-6 py-24 max-w-md mx-auto">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Wallet className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display">Nothing here yet</h2>
          <p className="text-muted-foreground">
            Paste in your bank statement to detect subscriptions, or set up your budget — either one gets this dashboard going.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link href="/analyze">Analyze Bills</Link></Button>
          <Button asChild variant="outline"><Link href="/budget">Set Up Budget</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Your financial picture, all in one place.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Remaining balance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold font-mono ${budget.data && budget.data.remainingBalance < 0 ? "text-destructive" : ""}`}>
              {budget.data ? formatINR(budget.data.remainingBalance) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> Active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{activeSubs.length}</p>
            {flaggedCount > 0 && <p className="text-xs text-destructive mt-1">{flaggedCount} flagged</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><AlarmClock className="w-3.5 h-3.5" /> Renewals this week</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{upcoming.data?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><PiggyBank className="w-3.5 h-3.5" /> Total saved</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-primary">{savings.data ? formatINR(savings.data.totalSaved) : formatINR(0)}</p>
          </CardContent>
        </Card>
      </div>

      {upcoming.data && upcoming.data.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Bell className="w-4 h-4" /> Coming up this week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.data.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.serviceName}</span>
                <Badge variant="destructive">{daysUntil(r.renewalDate) <= 0 ? "today" : `${daysUntil(r.renewalDate)}d`}</Badge>
              </div>
            ))}
            <Link href="/renewals" className="text-sm text-primary hover:underline flex items-center gap-1 pt-1">
              View all renewals <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      )}

      {stats.data && stats.data.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" /> What actually works
            </CardTitle>
            <CardDescription>Based on outcomes people reported after sending a message.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.data
              .filter((s) => s.totalReported > 0)
              .sort((a, b) => b.winRate - a.winRate)
              .slice(0, 5)
              .map((s) => (
                <div key={s.serviceName} className="flex items-center justify-between text-sm">
                  <span>{s.serviceName}</span>
                  <span className="text-muted-foreground">
                    {Math.round(s.winRate * 100)}% worked ({s.totalReported} report{s.totalReported === 1 ? "" : "s"})
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/subscriptions">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Manage Subscriptions <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>Review flags, draft cancellations, find bundle savings.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/budget">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Update Budget <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Income, expenses, and goals.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
