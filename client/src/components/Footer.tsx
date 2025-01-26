import { Twitter, Instagram, Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black bg-opacity-95 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-6">
            <a 
              href="https://twitter.com/kpow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="https://instagram.com/kpow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com/kpow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>

          <div className="text-sm text-gray-400">
            © {currentYear} KPOW. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}