import { Layout } from "@/components/Layout";
import {
  Briefcase,
  Users2,
  Code2,
  Coffee,
  Download,
  Link
} from "lucide-react";

export default function About() {
  const skills = [
    {
      icon: <Briefcase className="w-4 h-4" />,
      text: "A digital Swiss Army knife with 20+ years of experience"
    },
    {
      icon: <Users2 className="w-4 h-4" />,
      text: "Interfacing with stakeholders and UX/design teams"
    },
    {
      icon: <Code2 className="w-4 h-4" />,
      text: "Managing development resources and product development"
    },
    {
      icon: <Coffee className="w-4 h-4" />,
      text: "Maintaining partner relationships"
    },
    {
      icon: <Download className="w-4 h-4" />,
      text: "Defining requirements and providing documentation"
    },
    {
      icon: <Link className="w-4 h-4" />,
      text: "evaluating and elevating platforms, tools, and environments"
    }
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header section */}
        <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
          <h1 className="text-4xl font-bold font-slackey mb-4">
            Hi, I'm Kevin
          </h1>
          <p className="text-gray-600 mb-2">
            Digital Architect - Leader - Developer - Pixel Farmer.
          </p>
          <p className="text-gray-600">
            I'm into travel, ukes, pugs, live music, and pixels.
          </p>
        </div>

        {/* What's up section */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold font-slackey">What's up?</h2>
          
          <div className="space-y-6">
            {skills.map((skill, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1 text-gray-400">
                  {skill.icon}
                </div>
                <span className="text-gray-800">
                  {skill.text}
                </span>
              </div>
            ))}
          </div>

          <p className="text-gray-800 mt-8">
            I am a technologist with a relentless passion for designing solutions that
            overcome technical obstacles. Pushing for innovation, I continually challenge
            myself and my teams to make technology work harder and smarter for clients.
            Crafting dynamic experiences, robust design systems, efficient development
            practices, and continuous learning are among my core principles. Also, I am a
            donut connoisseur.
          </p>

          <div className="mt-8">
            <img
              src="/team-photo.jpg"
              alt="Team photo"
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
