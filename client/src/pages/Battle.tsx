import { HeroBattle } from "@/components/HeroBattle";
import { SEO } from "@/components/global/SEO";

export default function Battle() {
  const pageTitle = "Battle - Choose Your Champion";
  const pageDescription =
    "Enter the arena and battle with your favorite heroes and villians. An interactive experience testing different hero/villian combinations and their powers.";
  const pageImage = "/battle.jpg";
  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        image={pageImage}
        type="game"
      />
      <div className="container mx-auto">
        <HeroBattle />
      </div>
    </>
  );
}
