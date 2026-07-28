import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Route, Switch, Router as WouterRouter, Link } from 'wouter';
import { Lock, Loader2 } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from '@/hooks/auth-context';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';

// Pages
import Home from '@/pages/home';
import Dashboard from '@/pages/dashboard';
import Analyze from '@/pages/analyze';
import Subscriptions from '@/pages/subscriptions';
import Savings from '@/pages/savings';
import Renewals from '@/pages/renewals';
import Budget from '@/pages/budget';
import Loans from '@/pages/loans';
import Tax from '@/pages/tax';
import SharePlans from '@/pages/share-plans';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup';

const queryClient = new QueryClient();

function NeedsLogin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <Lock className="w-10 h-10 text-muted-foreground" />
      <h1 className="text-2xl font-bold font-display">Log in to see this</h1>
      <p className="text-muted-foreground">Your data is tied to your account now, not the browser you're on.</p>
      <div className="flex gap-3">
        <Button asChild><Link href="/login">Log In</Link></Button>
        <Button asChild variant="outline"><Link href="/signup">Sign Up</Link></Button>
      </div>
    </div>
  );
}

// wraps a page component so it only renders once you're logged in
function needsAuth(Component: React.ComponentType) {
  return function Wrapped() {
    const { user, loading } = useAuth();
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    if (!user) return <NeedsLogin />;
    return <Component />;
  };
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <h1 className="text-4xl font-bold font-display">404</h1>
      <p className="text-muted-foreground text-lg">Page not found</p>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={needsAuth(Dashboard)} />
        <Route path="/analyze" component={needsAuth(Analyze)} />
        <Route path="/subscriptions" component={needsAuth(Subscriptions)} />
        <Route path="/renewals" component={needsAuth(Renewals)} />
        <Route path="/budget" component={needsAuth(Budget)} />
        <Route path="/loans" component={needsAuth(Loans)} />
        <Route path="/tax" component={needsAuth(Tax)} />
        <Route path="/share-plans" component={needsAuth(SharePlans)} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/savings" component={needsAuth(Savings)} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="spendshield-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster theme="dark" position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
