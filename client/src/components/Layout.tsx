import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="bg-white rounded-lg shadow-lg p-2 md:p-6 lg:p-8 min-h-[calc(100vh-theme(spacing.24)-theme(spacing.12))]">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
