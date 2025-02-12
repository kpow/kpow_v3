import { PageTitle } from "@/components/ui/page-title";
import { SetlistGame } from "@/components/setlist-game";

export default function SetlistGamePage() {
  return (
    <div className="container mx-auto p-4">
      <PageTitle size="lg" className="mb-8">setlist guesser</PageTitle>
      <SetlistGame />
    </div>
  );
}
