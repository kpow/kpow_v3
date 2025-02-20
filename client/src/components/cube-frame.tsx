import { Card, CardContent } from "@/components/ui/card";

export function CubeFrame() {
  return (
    <Card className="w-full h-full">
      <CardContent className="p-2 flex flex-col h-full">
        <div className="flex-grow relative">
          <iframe 
            src="/cube"
            className="absolute inset-0 w-full h-full border-0"
            title="Cube Display"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </CardContent>
    </Card>
  );
}
