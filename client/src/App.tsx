import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import { HelmetProvider } from "react-helmet-async";
import Home from "@/pages/Home";
import About from "@/pages/About";
import ShowStats from "@/pages/Phashboard";
import Books from "@/pages/Books";
import StarredArticles from "@/pages/StarredArticles";
import PMonk from "@/pages/PMonk";
import Videos from "@/pages/Videos";
import NotFound from "@/pages/not-found";
import Battle from "@/pages/Battle";
import DonutShops from "@/pages/DonutShops";
import CubePage from "@/pages/CubePage";  // Add import
import { Route as WouterRoute } from "wouter";
import { SEO } from "@/components/SEO";

function Router() {
  return (
    <Layout>
      <SEO />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/phashboard" component={ShowStats} />
        <Route path="/books/page/:page" component={Books} />
        <Route path="/books" component={Books} />
        <Route
          path="/starred-articles/page/:page"
          component={StarredArticles}
        />
        <Route path="/starred-articles" component={StarredArticles} />
        <Route path="/videos/page/:page" component={Videos} />
        <Route path="/videos" component={Videos} />
        <Route path="/pmonk" component={PMonk} />
        <Route path="/battle" component={Battle} />
        <Route path="/donut-tour" component={DonutShops} />
        <Route path="/donut-tour/:city/:state" component={DonutShops} />
        <Route path="/cube" component={CubePage} />  {/* Add new route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;