import { SEO } from "@/components/global/SEO";
import { ContactDialog } from "@/components/ContactDialog";

const USER_DATA_POLICY = "https://developers.google.com/terms/api-services-user-data-policy";
const GOOGLE_PERMISSIONS = "https://myaccount.google.com/permissions";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "What kpow-dash is",
    body: (
      <p>
        kpow-dash is my personal dashboard. It runs only on my own Mac and I'm
        the only person who uses it. It isn't offered to anyone else.
      </p>
    ),
  },
  {
    title: "What it does with Google",
    body: (
      <p>
        It uses Google sign-in to read my own Google Calendar and Gmail. When I
        ask it to, it also adds calendar events, tidies my mail, and writes
        drafts.
      </p>
    ),
  },
  {
    title: "Where the data lives",
    body: (
      <p>
        Google data stays on that Mac: in a local SQLite database, with sign-in
        tokens in the macOS Keychain. It is never sold, shared, or sent to other
        servers. The one exception: when I ask the dashboard's Claude chat a
        question, the parts of my calendar or mail needed to answer it go to
        Anthropic's API.
      </p>
    ),
  },
  {
    title: "Turning it off",
    body: (
      <p>
        Access can be revoked any time at{" "}
        <a href={GOOGLE_PERMISSIONS} className="text-blue-600 underline">
          myaccount.google.com/permissions
        </a>
        .
      </p>
    ),
  },
  {
    title: "Limited Use",
    body: (
      <p>
        kpow-dash's use and transfer to any other app of information received
        from Google APIs will adhere to the{" "}
        <a href={USER_DATA_POLICY} className="text-blue-600 underline">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <>
      <SEO />
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl p-8 mb-8 shadow-[0_0_15px_rgba(0,0,0,0.05)] text-center">
          <h1 className="text-[2.5rem] leading-tight font-slackey mb-4">
            Privacy
          </h1>
          <p className="text-gray-600">
            For kpow-dash, the Google sign-in app on this site's OAuth screen.
            Updated October 15, 2026.
          </p>
        </div>

        <div className="space-y-8 mb-16">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-[1.5rem] leading-tight font-slackey mb-2">
                {s.title}
              </h2>
              <div className="text-gray-700 leading-relaxed">{s.body}</div>
            </section>
          ))}

          <section>
            <h2 className="text-[1.5rem] leading-tight font-slackey mb-2">
              Questions
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Send me a note with the contact form.
            </p>
            <ContactDialog />
          </section>
        </div>
      </div>
    </>
  );
}
