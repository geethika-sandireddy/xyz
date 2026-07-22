import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import {
  useListRenewals,
  useCreateRenewal,
  useUpdateRenewal,
  useDeleteRenewal,
  useGenerateRenewalMessage,
  getListRenewalsQueryKey,
  type Renewal,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlarmClock, Plus, Loader2, Trash2, CheckCircle2, XCircle,
  MessageSquareText, Copy, CalendarClock, Bell,
} from "lucide-react";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / MS_PER_DAY);
}

function urgencyBadge(days: number) {
  if (days < 0) {
    return <Badge variant="secondary" className="gap-1.5"><CheckCircle2 className="w-3 h-3" /> Passed</Badge>;
  }
  if (days <= 1) {
    return <Badge variant="destructive" className="gap-1.5 animate-pulse"><Bell className="w-3 h-3" /> {days === 0 ? "Today" : "Tomorrow"}</Badge>;
  }
  if (days <= 3) {
    return <Badge variant="destructive" className="gap-1.5"><Bell className="w-3 h-3" /> in {days} days</Badge>;
  }
  return <Badge variant="outline" className="gap-1.5 text-muted-foreground"><CalendarClock className="w-3 h-3" /> in {days} days</Badge>;
}

function AddRenewalDialog({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [renewalDate, setRenewalDate] = useState("");
  const [isTrial, setIsTrial] = useState(true);
  const queryClient = useQueryClient();

  const createMutation = useCreateRenewal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRenewalsQueryKey({ sessionId }) });
        toast.success("Renewal Watch is now tracking this");
        setIsOpen(false);
        setServiceName("");
        setAmount("");
        setRenewalDate("");
        setIsTrial(true);
      },
      onError: () => toast.error("Couldn't save this renewal — try again"),
    },
  });

  const handleSubmit = () => {
    if (!serviceName.trim() || !amount || !renewalDate) {
      toast.error("Service name, amount, and date are required");
      return;
    }
    createMutation.mutate({
      data: {
        sessionId,
        serviceName: serviceName.trim(),
        amount: parseFloat(amount),
        frequency: frequency as any,
        renewalDate: new Date(renewalDate).toISOString(),
        isTrial,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Track a Trial or Renewal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track a Trial or Renewal</DialogTitle>
          <DialogDescription>
            We'll remind you before you get charged — never lose money to a forgotten free trial again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service name</Label>
            <Input
              id="serviceName"
              placeholder="e.g. YouTube Music"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) after trial</Label>
              <Input
                id="amount"
                type="number"
                placeholder="99"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="one_time_trial">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="renewalDate">
              {isTrial ? "Trial ends / first charge date" : "Next renewal date"}
            </Label>
            <Input
              id="renewalDate"
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isTrial"
              type="checkbox"
              checked={isTrial}
              onChange={(e) => setIsTrial(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="isTrial" className="font-normal cursor-pointer">
              This is a free trial that auto-converts to paid
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Tracking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelMessageDialog({ renewal }: { renewal: Renewal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const generateMutation = useGenerateRenewalMessage({
    mutation: {
      onSuccess: (data) => {
        setMessage(data.message);
        toast.success("Cancellation draft ready");
      },
      onError: () => toast.error("Couldn't generate the message"),
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquareText className="w-4 h-4" /> Cancel for me
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel {renewal.serviceName}</DialogTitle>
          <DialogDescription>
            A ready-to-send message to cancel before you're charged {formatINR(renewal.amount)}.
          </DialogDescription>
        </DialogHeader>
        {message ? (
          <div className="relative">
            <Textarea readOnly value={message} className="min-h-[150px] text-sm pr-10 resize-none font-mono bg-muted/30" />
            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-6 text-center text-sm text-muted-foreground border border-dashed">
            Click generate to draft a cancellation email for {renewal.serviceName}.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          <Button onClick={() => generateMutation.mutate({ id: renewal.id })} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Renewals() {
  const sessionId = useSession();
  const queryClient = useQueryClient();

  const { data: renewals = [], isLoading } = useListRenewals(
    { sessionId },
    { query: { enabled: !!sessionId } },
  );

  const updateMutation = useUpdateRenewal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRenewalsQueryKey({ sessionId }) });
      },
    },
  });

  const deleteMutation = useDeleteRenewal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRenewalsQueryKey({ sessionId }) });
        toast.success("Removed from Renewal Watch");
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const active = renewals.filter(r => r.status === "upcoming" || r.status === "reminded");
  const resolved = renewals.filter(r => r.status === "cancelled" || r.status === "renewed" || r.status === "ignored");
  const sortedActive = [...active].sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate));
  const urgent = sortedActive.filter(r => daysUntil(r.renewalDate) <= 3 && daysUntil(r.renewalDate) >= 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
            <AlarmClock className="w-7 h-7 text-primary" /> Renewal Watch
          </h1>
          <p className="text-muted-foreground text-lg">
            Track free trials and renewals — get reminded before you're charged, not after.
          </p>
        </div>
        <AddRenewalDialog sessionId={sessionId} />
      </div>

      {urgent.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Bell className="w-4 h-4" /> {urgent.length} renewal{urgent.length > 1 ? "s" : ""} coming up fast
            </CardTitle>
            <CardDescription>
              These are within 3 days — decide now to avoid getting charged.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {renewals.length === 0 ? (
        <div className="text-center space-y-6 py-20 max-w-md mx-auto">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <AlarmClock className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display">Nothing tracked yet</h2>
            <p className="text-muted-foreground">
              Add a free trial or upcoming renewal and we'll alert you before it converts to a paid charge.
            </p>
          </div>
          <AddRenewalDialog sessionId={sessionId} />
        </div>
      ) : (
        <>
          {sortedActive.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold">Being Watched</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedActive.map((r) => {
                  const days = daysUntil(r.renewalDate);
                  return (
                    <Card key={r.id} className={days <= 3 && days >= 0 ? "border-destructive/30 bg-destructive/5" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          {r.isTrial && (
                            <Badge variant="outline" className="text-purple-500 border-purple-500/30">Free Trial</Badge>
                          )}
                          <div className="ml-auto">{urgencyBadge(days)}</div>
                        </div>
                        <CardTitle className="text-xl">{r.serviceName}</CardTitle>
                        <div className="font-mono font-bold text-2xl tracking-tight">
                          {formatINR(r.amount)}
                          <span className="text-sm text-muted-foreground font-sans font-normal ml-1">
                            /{r.frequency === "annual" ? "yr" : r.frequency === "weekly" ? "wk" : r.frequency === "one_time_trial" ? "once" : "mo"}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {r.isTrial ? "Converts to paid on" : "Renews on"} {new Date(r.renewalDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        {r.notes && <p className="text-sm text-muted-foreground mt-2 italic">"{r.notes}"</p>}
                      </CardContent>
                      <CardFooter className="pt-0 border-t p-4 mt-auto gap-2 bg-muted/20 flex-wrap">
                        <CancelMessageDialog renewal={r} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => updateMutation.mutate({ id: r.id, data: { status: "cancelled" } })}
                        >
                          <XCircle className="w-4 h-4" /> Mark Cancelled
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => updateMutation.mutate({ id: r.id, data: { status: "renewed" } })}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Keeping it
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate({ id: r.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold text-muted-foreground">Resolved</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolved.map((r) => (
                  <Card key={r.id} className="opacity-60">
                    <CardHeader className="pb-3">
                      <Badge variant="secondary" className="w-fit mb-2 capitalize">{r.status}</Badge>
                      <CardTitle className="text-lg line-through">{r.serviceName}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
