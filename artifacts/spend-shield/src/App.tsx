import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/auth-context';
import { Layout } from '@/components/layout';

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
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/analyze" component={Analyze} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/renewals" component={Renewals} />
        <Route path="/budget" component={Budget} />
        <Route path="/loans" component={Loans} />
        <Route path="/tax" component={Tax} />
        <Route path="/share-plans" component={SharePlans} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/savings" component={Savings} />
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
