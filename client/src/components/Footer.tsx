import Aurora from "../reactbits/Aurora/Aurora";

export function Footer() {
  return (
    <footer className="bg-black text-white pb-12">
      <Aurora
        colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
      <div className="container max-w-6xl mx-auto px-4 flex gap-8 justify-between flex-col sm:flex-row -mt-[100px]">
        {/* About Section */}
        <div className="flex items-start gap-4 max-w-sm">
          <div>
            <h3 className="text-xl font-bold mb-1">About kpow</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Digital Architect - Leader - Developer - Pixel Farmer. I'm a
              voracious reader and boogie-down dad. I'm into travel, ukes, pugs,
              live music, and pixels.
            </p>
          </div>
        </div>

        {/* Site Info Section */}
        <div className="max-w-md">
          <h3 className="text-xl font-bold mb-1">Site</h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            This is a Node.js site built with React.js, Shadcn-UI, React-Query,
            and some content in Markdown. Using Instagram, GoodReads, Feedbin,
            Phish.net, Github and whatever other API's I'm playing with :)
          </p>
        </div>
      </div>
      
    </footer>
  );
}
