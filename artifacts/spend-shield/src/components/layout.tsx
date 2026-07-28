import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, Search, List, PieChart, AlarmClock, Wallet, Landmark, Receipt, Users, LogOut } from "lucide-react";
import { useAuth } from "../hooks/auth-context";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analyze", label: "Analyze", icon: Search },
    { href: "/subscriptions", label: "Subscriptions", icon: List },
    { href: "/renewals", label: "Renewals", icon: AlarmClock },
    { href: "/budget", label: "Budget", icon: Wallet },
    { href: "/loans", label: "Loans", icon: Landmark },
    { href: "/tax", label: "Tax", icon: Receipt },
    { href: "/share-plans", label: "Share a Plan", icon: Users },
    { href: "/savings", label: "Savings", icon: PieChart },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">
              SpendShield
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-muted-foreground">{user.email}</span>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => logout()}>
                  <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log Out</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">Log In</Link>
                <Button asChild size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SpendShield. Know where your money goes.
        </div>
      </footer>
    </div>
  );
}
