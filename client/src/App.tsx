import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminPage from "@/pages/AdminPage";
import AuthPage from "@/pages/AuthPage";
import Home from "@/pages/Home";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";
import Itunez from "@/pages/itunez";
import Phashboard from "@/pages/Phashboard";
import { SEO } from "@/components/global/SEO";

function Router() {
  return (
    <Layout>
      <SEO />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/itunez" component={Itunez} />
        <Route path="/phashboard" component={Phashboard} />
        <ProtectedRoute path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;