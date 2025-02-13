import { PageTitle } from "@/components/ui/page-title";
import { SetlistGame } from "@/components/setlist-game";

export default function SetlistGamePage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 min-h-screen flex flex-col">
      <PageTitle size="lg" className="mb-4 md:mb-6 lg:mb-8">phish setlist game</PageTitle>
      <div className="flex-grow flex">
        <SetlistGame />
      </div>
    </div>
  );
}