import { useState } from "react";

export default function Battle() {
  const [randomMode, setRandomMode] = useState(false);

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen bg-[#0e1117]">
      <div className="flex flex-col items-center justify-center w-full max-w-[600px]">
        <h1 className="text-6xl font-extrabold mb-16 text-white tracking-wider">
          Hero Battle
        </h1>

        <div className="flex flex-col gap-8 w-full">
          <button 
            className="w-full py-4 bg-transparent border-2 border-white text-white text-xl font-medium rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setRandomMode(!randomMode)}
          >
            Manual Selection
          </button>

          <button 
            className="w-full py-4 bg-transparent border-2 border-white text-white text-xl font-medium rounded-lg hover:bg-white/10 transition-colors"
          >
            Fight!
          </button>
        </div>
      </div>
    </div>
  );
}