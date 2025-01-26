export function Footer() {
  return (
    <footer className="bg-black bg-opacity-95 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">About</h3>
            <p className="text-gray-400">
              A modern platform for digital content and experiences.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Discord</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
