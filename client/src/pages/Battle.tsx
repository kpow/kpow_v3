import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Battle() {
  const [randomMode, setRandomMode] = useState(false);

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-4xl font-bold mb-8">Hero Battle</h1>

      <div className="flex flex-col gap-4 w-full max-w-[300px]">
        <Button 
          variant="outline" 
          size="lg"
          className="w-full"
          onClick={() => setRandomMode(!randomMode)}
        >
          Manual Selection
        </Button>

        <Button 
          size="lg"
          className="w-full"
        >
          Fight!
        </Button>
      </div>
    </div>
  );
}