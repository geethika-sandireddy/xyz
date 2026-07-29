import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
          <Lock className="w-7 h-7 text-primary" /> Privacy
        </h1>
        <p className="text-muted-foreground text-lg">What we store, and what we don't.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">What we store</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Your email and a hashed password (we never store your actual password, just a one-way hash of it).</p>
          <p>Whatever you type into the app — subscriptions, income, fixed expenses, loans, financial goals, renewal dates, savings you've logged.</p>
          <p>The messages you generate and whether you told us they worked.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">What we don't store</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>The raw text of your bank statement. When you paste it in on the Analyze page, we scan it for known subscription patterns and only keep what we find — the pasted text itself never gets saved.</p>
          <p>Your bank login, card numbers, or any way to move money. We don't connect to your bank account at all.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Deleting your data</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>You can permanently delete your account and everything tied to it any time from the Account page. It's immediate and there's no undo.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Community features</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Deal tips and share-a-plan posts you write are visible to other users of the app. Don't put anything in those you're not comfortable being public.</p>
        </CardContent>
      </Card>
    </div>
  );
}
