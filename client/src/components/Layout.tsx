import { Header } from "@/components/global/Header";
import { Footer } from "@/components/global/Footer";
import { SlideMenu } from "@/components/global/SlideMenu";
import { ScrollToTop } from "@/components/global/ScrollToTop";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-14 pb-12">
        <div className="bg-white rounded-lg shadow-lg p-2 md:p-6 lg:p-8 min-h-[calc(100vh-theme(spacing.24)-theme(spacing.12))]">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
