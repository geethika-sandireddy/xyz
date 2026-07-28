import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Target, Lock, Wallet } from "lucide-react";
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
            Know where your money actually goes
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground font-display">
            See your real financial picture, maybe for the first time.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Most budgeting tools assume you already have one. SpendShield starts from zero — your income, your fixed costs, your loans, and the subscriptions quietly eating into what's left — so you can actually plan, not just guess.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2 text-lg">
              <Link href="/budget">
                Build My Budget <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg">
              <Link href="/analyze">
                Or Find Wasted Subscriptions First
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-md relative">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"></div>
          <Card className="relative z-10 border-primary/20 shadow-2xl p-6 bg-card/50 backdrop-blur-xl">
            <Badge variant="outline" className="mb-4 text-xs text-muted-foreground">Example — not your real data</Badge>
            <div className="space-y-6">
              <div className="text-center pb-4 border-b">
                <p className="text-sm text-muted-foreground mb-1">Safe to spend this month</p>
                <p className="text-4xl font-bold font-mono text-primary">₹6,400</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Income</span>
                  <span className="font-mono">₹35,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fixed expenses</span>
                  <span className="font-mono text-red-500">− ₹22,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscriptions</span>
                  <span className="font-mono text-red-500">− ₹1,600</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Savings goal</span>
                  <span className="font-mono text-red-500">− ₹5,000</span>
                </div>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/budget">Try It With Your Numbers</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-display">How SpendShield works</h2>
          <p className="text-muted-foreground text-lg">One picture — income, fixed costs, subscriptions, loans — instead of eight things you'd otherwise never check.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4 p-6 rounded-2xl bg-secondary/50 border relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold font-display">1. Tell us your income and fixed costs</h3>
            <p className="text-muted-foreground">
              Rent, EMIs, electricity, whatever you can't avoid paying. No bank login needed — you just type in the numbers.
            </p>
          </div>
          
          <div className="space-y-4 p-6 rounded-2xl bg-secondary/50 border relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold font-display">2. Paste your statement, we flag the waste</h3>
            <p className="text-muted-foreground">
              We catch recurring charges, forgotten trials, and price hikes you'd otherwise scroll right past.
            </p>
          </div>
          
          <div className="space-y-4 p-6 rounded-2xl bg-secondary/50 border relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold font-display">3. See what's actually left, act on it</h3>
            <p className="text-muted-foreground">
              A real remaining-balance number, plus ready-to-send messages for anything worth cancelling or negotiating.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center space-y-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <Lock className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold font-display">What we do and don't store</h2>
          <p className="text-lg text-muted-foreground">
            We don't keep your raw bank statement text — only the subscriptions, budget, and loan details you enter get saved, so the app remembers them next time you visit.
          </p>
        </div>
        <Button asChild size="lg" className="px-8 text-lg rounded-xl">
          <Link href="/budget">
            Get Started
          </Link>
        </Button>
      </section>
    </div>
  );
}
