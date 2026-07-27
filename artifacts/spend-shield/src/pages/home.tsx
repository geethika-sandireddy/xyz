import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, TrendingDown, Target, Lock, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col gap-24 py-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <section className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
        <div className="flex-1 space-y-6">
          <Badge variant="outline" className="px-4 py-1.5 rounded-full text-sm">
            <span className="text-primary mr-2 flex items-center inline-block">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now live
            </span>
            Stop bleeding money
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground font-display">
            Protect your wealth from stealth subscriptions.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            SpendShield analyzes your bank statements, flags predatory recurring charges, and writes the exact messages you need to cancel them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2 text-lg">
              <Link href="/analyze">
                Analyze My Bills <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-md relative">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"></div>
          <Card className="relative z-10 border-primary/20 shadow-2xl p-6 bg-card/50 backdrop-blur-xl">
            <Badge variant="outline" className="mb-4 text-xs text-muted-foreground">Example — not your real data</Badge>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">FitTech Pro App</p>
                    <p className="text-sm text-muted-foreground">Monthly</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold font-mono text-red-500">₹1,999</p>
                  <Badge variant="destructive" className="mt-1">Flagged</Badge>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg text-sm border font-mono">
                "Hi FitTech support, I noticed a recurring charge of ₹1,999 on my account. I want to cancel this immediately and request a prorated refund..."
              </div>
              
              <Button className="w-full" variant="outline">Copy Cancellation Email</Button>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-display">How SpendShield works</h2>
          <p className="text-muted-foreground text-lg">We do the tedious work of finding and fighting bad subscriptions, so you can keep your money.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4 p-6 rounded-2xl bg-secondary/50 border relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold font-display">1. Paste your statement</h3>
            <p className="text-muted-foreground">
              Securely paste the text from your bank or credit card statement. We don't need your bank login or API access.
            </p>
          </div>
          
          <div className="space-y-4 p-6 rounded-2xl bg-secondary/50 border relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold font-display">2. We flag the leeches</h3>
            <p className="text-muted-foreground">
              Our analyzer detects recurring patterns, hidden fees, and trial-ended charges that you might have missed.
            </p>
          </div>
          
          <div className="space-y-4 p-6 rounded-2xl bg-secondary/50 border relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold font-display">3. Cancel with confidence</h3>
            <p className="text-muted-foreground">
              We generate perfectly worded cancellation or negotiation emails tailored to each specific service.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center space-y-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <Lock className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold font-display">Privacy by Design</h2>
          <p className="text-lg text-muted-foreground">
            Your financial data is processed in your current session. We don't store your raw statements, and you don't even need an account to start analyzing.
          </p>
        </div>
        <Button asChild size="lg" className="px-8 text-lg rounded-xl">
          <Link href="/analyze">
            Start Scanning Now
          </Link>
        </Button>
      </section>
    </div>
  );
}
