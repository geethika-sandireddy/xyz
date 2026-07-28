import { useState, useRef } from "react";
import { useSession } from "@/hooks/use-session";
import { 
  useListSubscriptions, 
  useUpdateSubscription, 
  useGenerateSubscriptionMessage,
  useSetMessageOutcome,
  useGetBundleSuggestions,
  getGetBundleSuggestionsQueryKey,
  useGetDealWatch,
  useAddSubscription,
  getGetDealWatchQueryKey,
  SubscriptionCategory,
  SubscriptionStatus,
  type Subscription,
  getListSubscriptionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, CheckCircle2, XCircle, Clock, 
  MessageSquareText, ShieldAlert, Loader2, Copy, 
  Link, Layers, Sparkles, Plus
} from "lucide-react";

const categoryColors: Record<string, string> = {
  streaming: "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20",
  fitness: "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20",
  software: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
  food: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20",
  finance: "bg-teal-500/10 text-teal-500 border-teal-500/20 hover:bg-teal-500/20",
  utility: "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20",
  gaming: "bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20",
  education: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
  other: "bg-muted text-muted-foreground border-border hover:bg-muted/80"
};

function MessageGenerator({ subscription }: { subscription: Subscription }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageType, setMessageType] = useState<"cancel" | "negotiate" | "downgrade" | "refund">("cancel");
  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [messageId, setMessageId] = useState<number | null>(null);
  const [outcomeSent, setOutcomeSent] = useState(false);
  
  const generateMutation = useGenerateSubscriptionMessage({
    mutation: {
      onSuccess: (data) => {
        setGeneratedMessage(data.message);
        setMessageId(data.id);
        setOutcomeSent(false);
        toast.success("Message generated successfully");
      },
      onError: () => toast.error("Failed to generate message")
    }
  });

  const outcomeMutation = useSetMessageOutcome({
    mutation: {
      onSuccess: () => {
        setOutcomeSent(true);
        toast.success("thanks, that helps other people using this app");
      },
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      id: subscription.id,
      data: { messageType }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast.success("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquareText className="w-4 h-4" />
          Draft Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Draft Message</DialogTitle>
          <DialogDescription>
            Generate a personalized email to {subscription.name} to {messageType === "refund" ? "request a refund from" : messageType}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal</label>
            <Select value={messageType} onValueChange={(val: any) => setMessageType(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cancel">Cancel Subscription</SelectItem>
                <SelectItem value="negotiate">Negotiate Lower Rate</SelectItem>
                <SelectItem value="downgrade">Downgrade Plan</SelectItem>
                <SelectItem value="refund">Request Refund (already charged)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {generatedMessage ? (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium">Generated Draft</label>
              <div className="relative">
                <Textarea 
                  readOnly 
                  value={generatedMessage} 
                  className="min-h-[150px] text-sm pr-10 resize-none font-mono bg-muted/30"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {messageId && !outcomeSent && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-sm text-muted-foreground">Did you send this? Let us know what happened.</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => outcomeMutation.mutate({ id: messageId, data: { outcome: "worked" } })}>
                      it worked
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => outcomeMutation.mutate({ id: messageId, data: { outcome: "partial" } })}>
                      partial win
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => outcomeMutation.mutate({ id: messageId, data: { outcome: "declined" } })}>
                      they said no
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => outcomeMutation.mutate({ id: messageId, data: { outcome: "ignored" } })}>
                      no reply
                    </Button>
                  </div>
                </div>
              )}
              {outcomeSent && (
                <p className="text-sm text-muted-foreground pt-2 border-t">thanks for letting us know</p>
              )}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-6 text-center text-sm text-muted-foreground border border-dashed">
              Click generate to create an email draft for {subscription.name}.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              "Generate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DealWatchCard({ sessionId }: { sessionId: string }) {
  const { data: deals = [] } = useGetDealWatch({ sessionId }, { query: { enabled: !!sessionId, queryKey: getGetDealWatchQueryKey({ sessionId }) } });

  if (deals.length === 0) return null;

  return (
    <div className="space-y-3">
      {deals.map((d, i) => (
        <Card key={`${d.subscriptionName}-${i}`} className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" /> Deal Watch — {d.subscriptionName}
            </CardTitle>
            <CardDescription>{d.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{d.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BundleSuggestionsCard({ sessionId }: { sessionId: string }) {
  const { data: suggestions = [] } = useGetBundleSuggestions({ sessionId }, { query: { enabled: !!sessionId, queryKey: getGetBundleSuggestionsQueryKey({ sessionId }) } });

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <Card key={s.category} className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" /> Bundle Opportunity — {s.category}
            </CardTitle>
            <CardDescription>
              {s.subscriptions.join(", ")} — combined ~{formatINR(s.combinedMonthlyCost)}/mo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{s.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AddSubForm({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [freq, setFreq] = useState("monthly");
  const [cat, setCat] = useState("other");
  const queryClient = useQueryClient();

  const addMutation = useAddSubscription({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey({ sessionId }) });
        toast.success("added");
        setOpen(false);
        setName("");
        setAmount("");
      },
    },
  });

  const submit = () => {
    if (!name.trim() || !amount) {
      toast.error("need a name and amount");
      return;
    }
    addMutation.mutate({
      data: {
        sessionId,
        name: name.trim(),
        amount: parseFloat(amount),
        frequency: freq as any,
        category: cat as any,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> Add one manually
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a subscription</DialogTitle>
          <DialogDescription>Didn't get caught by the auto-detector? Add it yourself.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder="name, like Netflix" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Select value={freq} onValueChange={setFreq}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">monthly</SelectItem>
                <SelectItem value="annual">annual</SelectItem>
                <SelectItem value="weekly">weekly</SelectItem>
                <SelectItem value="unknown">not sure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="streaming">streaming</SelectItem>
              <SelectItem value="fitness">fitness</SelectItem>
              <SelectItem value="software">software</SelectItem>
              <SelectItem value="food">food</SelectItem>
              <SelectItem value="finance">finance</SelectItem>
              <SelectItem value="utility">utility</SelectItem>
              <SelectItem value="gaming">gaming</SelectItem>
              <SelectItem value="education">education</SelectItem>
              <SelectItem value="other">other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={addMutation.isPending}>
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Subscriptions() {
  const sessionId = useSession();
  const queryClient = useQueryClient();
  
  const { data: subscriptions = [], isLoading } = useListSubscriptions(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getListSubscriptionsQueryKey({ sessionId }) } }
  );

  const updateMutation = useUpdateSubscription({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey({ sessionId }) });
        if (data.previousAmount != null) {
          toast.error(`Price hike detected: ${data.name} went from ${formatINR(data.previousAmount)} to ${formatINR(data.amount)}`);
        } else if (data.status) {
          toast.success(`Marked as ${data.status}`);
        }
      }
    }
  });

  const handleStatusChange = (id: number, status: typeof SubscriptionStatus[keyof typeof SubscriptionStatus]) => {
    updateMutation.mutate({ id, data: { status } });
  };

  const handleAmountUpdate = (id: number, currentAmount: number) => {
    const input = window.prompt("Enter the new billed amount (₹) — if it's higher, this'll be flagged as a price hike:", String(currentAmount));
    if (!input) return;
    const newAmount = parseFloat(input);
    if (isNaN(newAmount) || newAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    updateMutation.mutate({ id, data: { amount: newAmount } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center space-y-6 py-20 max-w-md mx-auto">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display">No subscriptions found</h2>
          <p className="text-muted-foreground">
            We haven't found any subscriptions for this session. Go to the Analyze page to scan your statements.
          </p>
        </div>
        <Button variant="default" asChild>
          <Link href="/analyze">Analyze Statements</Link>
        </Button>
      </div>
    );
  }

  const flagged = subscriptions.filter(s => s.status === 'flagged');
  const active = subscriptions.filter(s => s.status === 'active');
  const other = subscriptions.filter(s => s.status !== 'flagged' && s.status !== 'active');

  const renderSection = (title: string, items: Subscription[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4 mb-10">
        <h3 className="text-xl font-display font-semibold flex items-center gap-2">
          {title} <Badge variant="secondary" className="rounded-full">{items.length}</Badge>
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(sub => (
            <Card key={sub.id} className={`flex flex-col transition-all duration-300 ${sub.status === 'cancelled' ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : ''} ${sub.status === 'flagged' ? 'border-destructive/30 bg-destructive/5' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className={`capitalize ${categoryColors[sub.category] || categoryColors.other}`}>
                    {sub.category}
                  </Badge>
                  {sub.status === 'flagged' && (
                    <Badge variant="destructive" className="gap-1.5 px-2 py-0.5"><AlertTriangle className="w-3 h-3" /> Flagged</Badge>
                  )}
                  {sub.status === 'active' && (
                    <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1.5 px-2 py-0.5"><CheckCircle2 className="w-3 h-3" /> Active</Badge>
                  )}
                  {sub.status === 'cancelled' && (
                    <Badge variant="secondary" className="gap-1.5 px-2 py-0.5"><XCircle className="w-3 h-3" /> Cancelled</Badge>
                  )}
                  {sub.status === 'reviewing' && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1.5 px-2 py-0.5"><Clock className="w-3 h-3" /> Reviewing</Badge>
                  )}
                </div>
                <CardTitle className={`text-xl ${sub.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>{sub.name}</CardTitle>
                <div className="font-mono font-bold text-2xl tracking-tight text-foreground flex items-baseline gap-2">
                  <span>
                    {formatINR(sub.amount)}
                    <span className="text-sm text-muted-foreground font-sans font-normal ml-1">/{sub.frequency === 'annual' ? 'yr' : 'mo'}</span>
                  </span>
                  {sub.previousAmount != null && (
                    <span className="text-sm font-sans font-normal text-muted-foreground line-through">
                      {formatINR(sub.previousAmount)}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {sub.flagReason && sub.status === 'flagged' && (
                  <p className="text-sm text-destructive/90 bg-destructive/10 p-3 rounded-md border border-destructive/10">
                    {sub.flagReason}
                  </p>
                )}
                {sub.keepCount >= 2 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-md border border-amber-500/10 mt-2 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    You've kept this despite {sub.keepCount} flags — worth asking yourself if it's really earning its cost.
                  </p>
                )}
                {sub.notes && (
                  <p className="text-sm text-muted-foreground mt-3 italic text-balance">
                    "{sub.notes}"
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-0 border-t p-4 mt-auto gap-2 bg-muted/20 flex-wrap">
                <MessageGenerator subscription={sub} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={() => handleAmountUpdate(sub.id, sub.amount)}
                >
                  Update Price
                </Button>
                <Select 
                  value={sub.status} 
                  onValueChange={(val: any) => handleStatusChange(sub.id, val)}
                >
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Set Active</SelectItem>
                    <SelectItem value="flagged">Flag Issue</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="cancelled">Mark Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display tracking-tight">Your Subscriptions</h1>
          <p className="text-muted-foreground text-lg">
            Manage detected subscriptions, draft cancellation emails, and track status.
          </p>
        </div>
        <AddSubForm sessionId={sessionId} />
      </div>

      <DealWatchCard sessionId={sessionId} />
      <BundleSuggestionsCard sessionId={sessionId} />

      <div className="space-y-2">
        {renderSection("Flagged for Review", flagged)}
        {renderSection("Active Subscriptions", active)}
        {renderSection("Other", other)}
      </div>
    </div>
  );
}
