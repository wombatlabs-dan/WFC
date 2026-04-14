import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BackgroundProvider } from "@/contexts/background";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";

// Pages
import Today from "@/pages/today";
import History from "@/pages/history";
import Places from "@/pages/places";
import PlaceDetail from "@/pages/place-detail";
import NewPlaces from "@/pages/new";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Today} />
        <Route path="/history" component={History} />
        <Route path="/places" component={Places} />
        <Route path="/places/:id" component={PlaceDetail} />
        <Route path="/new" component={NewPlaces} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BackgroundProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </BackgroundProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
