import { PageTitle } from "@/components/ui/page-title";
import { SetlistGame } from "@/components/setlist-game";
import { SEO } from "@/components/SEO";

export default function SetlistGamePage() {
  return (
    <>
      <SEO 
        title="Phish Setlist Guessing Game"
        description="Test your Phish knowledge with our interactive setlist guessing game! Guess songs from any show in Phish's history and challenge your friends."
        image="/phish-game.jpg"
        type="game"
      />
      <div className="container mx-auto p-4 min-h-screen flex flex-col">
        <PageTitle size="lg" className="mb-4">phish setlist game</PageTitle>
        <div className="flex-grow">
          <SetlistGame />
        </div>
      </div>
    </>
  );
}