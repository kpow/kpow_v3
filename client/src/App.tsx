import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import ShowStats from "@/pages/show-stats";
import Books from "@/pages/Books";
import StarredArticles from "@/pages/StarredArticles";
import PMonk from "@/pages/PMonk";
import Videos from "@/pages/Videos";
import Instagram from "@/pages/Instagram";
import NotFound from "@/pages/not-found";
import { HeroBattle } from "@/components/HeroBattle";
import Battle from "@/pages/Battle";
import DonutShops from "@/pages/donut-shops";
import SetlistGame from "@/pages/setlist-game";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/stats" component={ShowStats} />
        <Route path="/books/page/:page" component={Books} />
        <Route path="/books" component={Books} />
        <Route path="/starred-articles/page/:page" component={StarredArticles} />
        <Route path="/starred-articles" component={StarredArticles} />
        <Route path="/videos/page/:page" component={Videos} />
        <Route path="/videos" component={Videos} />
        <Route path="/instagram/page/:page" component={Instagram} />
        <Route path="/instagram" component={Instagram} />
        <Route path="/pmonk" component={PMonk} />
        <Route path="/battle" component={Battle} />
        <Route path="/donut-shops" component={DonutShops} />
        <Route path="/setlist-game" component={SetlistGame} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;