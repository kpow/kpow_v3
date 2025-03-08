import { Briefcase, Users2, Code2, Coffee, Download, Link } from "lucide-react";
import { SEO } from "@/components/global/SEO";

export default function About() {
  const pageTitle = "About Kevin - Digital Architect & Developer";
  const pageDescription =
    "Digital Architect, Leader, and Developer with 20+ years of experience in designing solutions and managing development resources. Learn more about my work and interests.";
  const pageImage = "/kpow_about.jpg";
  const skills = [
    {
      icon: <Briefcase className="w-4 h-4" />,
      text: "A digital Swiss Army knife with 20+ years of experience",
    },
    {
      icon: <Users2 className="w-4 h-4" />,
      text: "Interfacing with stakeholders and UX/design teams",
    },
    {
      icon: <Code2 className="w-4 h-4" />,
      text: "Managing development resources and product development",
    },
    {
      icon: <Coffee className="w-4 h-4" />,
      text: "Maintaining partner relationships",
    },
    {
      icon: <Download className="w-4 h-4" />,
      text: "Defining requirements and providing documentation",
    },
    {
      icon: <Link className="w-4 h-4" />,
      text: "evaluating and elevating platforms, tools, and environments",
    },
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        image={pageImage}
        type="profile"
      />
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Header section */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow-[0_0_15px_rgba(0,0,0,0.05)] text-center">
          <h1 className="text-[2.5rem] leading-tight font-slackey mb-4">
            Hi, I'm Kevin
          </h1>
          <div className="space-y-2">
            <p className="text-lg text-gray-600">
              Digital Architect - Leader - Developer - Pixel Farmer.
            </p>
            <p className="text-gray-600">Voracious Reader and Dad.</p>
            <p className="text-gray-600">
              I'm into travel, ukes, pugs, live music, and pixels.
            </p>
          </div>
        </div>

        {/* What's up section */}
        <div>
          <h2 className="text-[2rem] leading-tight font-slackey mb-6">
            What's up?
          </h2>

          <div className="space-y-5">
            {skills.map((skill, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="mt-1.5 text-gray-400">{skill.icon}</div>
                <span className="text-gray-700 leading-relaxed">
                  {skill.text}
                </span>
              </div>
            ))}
          </div>

          <p className="text-gray-700 leading-relaxed mt-8 mb-8">
            I am a technologist with a relentless passion for designing
            solutions that overcome technical obstacles. Pushing for innovation,
            I continually challenge myself and my teams to make technology work
            harder and smarter for clients. Crafting dynamic experiences, robust
            design systems, efficient development practices, and continuous
            learning are among my core principles. Also, I am a donut
            connoisseur.
          </p>

          <div className="mb-16">
            <img
              src="/kpow_about.jpg"
              alt="Team photo"
              className="w-full rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            />
          </div>
        </div>
      </div>
    </>
  );
}
