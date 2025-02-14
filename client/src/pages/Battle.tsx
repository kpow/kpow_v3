import { HeroBattle } from "@/components/HeroBattle";
import { SEO } from "@/components/SEO";

export default function Battle() {
  const pageTitle = "Hero Battle - Choose Your Champion";
  const pageDescription =
    "Enter the arena and battle with your favorite heroes. An interactive experience testing different hero combinations and their powers.";
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
