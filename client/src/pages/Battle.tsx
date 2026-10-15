import { HeroBattle } from "@/components/HeroBattle";
import { SEO } from "@/components/global/SEO";

export default function Battle() {
  return (
    <>
      <SEO />
      <div className="container mx-auto">
        <HeroBattle />
      </div>
    </>
  );
}
