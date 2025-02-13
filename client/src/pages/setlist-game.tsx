import { PageTitle } from "@/components/ui/page-title";
import { SetlistGame } from "@/components/setlist-game";

export default function SetlistGamePage() {
  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col">
      <PageTitle size="lg" className="mb-4">phish setlist game</PageTitle>
      <div className="flex-grow">
        <SetlistGame />
      </div>
    </div>
  );
}