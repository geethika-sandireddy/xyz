import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/auth-context";
import { useDeleteMe } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { UserCircle, Trash2, Loader2 } from "lucide-react";

export default function Account() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);

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
