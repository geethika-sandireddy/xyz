import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/auth-context";
import { useDeleteMe, useUpgradeToPro, useDowngradeToFree } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { UserCircle, Trash2, Loader2, Sparkles } from "lucide-react";

export default function Account() {
  const { user, logout, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const upgradeMutation = useUpgradeToPro({
    mutation: {
      onSuccess: (data) => {
        updateUser(data);
        toast.success("switched to pro (demo only, nothing was charged)");
      },
    },
  });

  const downgradeMutation = useDowngradeToFree({
    mutation: {
      onSuccess: (data) => {
        updateUser(data);
        toast.success("back to free plan");
      },
    },
  });

  const deleteMutation = useDeleteMe({
    mutation: {
      onSuccess: async () => {
        toast.success("account deleted");
        await logout();
        setLocation("/");
      },
    },
  });

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
          <UserCircle className="w-7 h-7 text-primary" /> Account
        </h1>
        <p className="text-muted-foreground text-lg">{user?.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Plan: <Badge variant={user?.plan === "pro" ? "default" : "outline"} className="capitalize">{user?.plan ?? "free"}</Badge>
          </CardTitle>
          <CardDescription>
            Negotiate/downgrade/refund message drafting, loan tracking, and the tax estimator are pro features.
            Cancel messages, subscription detection, and budgeting stay free.
            <br /><br />
            <span className="italic">Note: this is a demo toggle. No payment processor is connected, so upgrading here doesn't charge anything real.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.plan === "pro" ? (
            <Button variant="outline" onClick={() => downgradeMutation.mutate()} disabled={downgradeMutation.isPending}>
              {downgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Switch back to free"}
            </Button>
          ) : (
            <Button onClick={() => upgradeMutation.mutate()} disabled={upgradeMutation.isPending} className="gap-2">
              {upgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Upgrade to Pro (demo)</>}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Delete account</CardTitle>
          <CardDescription>
            This deletes your account and everything in it — subscriptions, budget, loans, renewals, savings history. There's no undo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" /> Delete my account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  Everything tied to your account gets permanently deleted. This can't be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, delete everything"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
