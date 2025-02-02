import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HeroCardProps {
  hero: any; // Will type this properly once we integrate the hero data
  selected?: boolean;
  onSelect?: () => void;
}

export function HeroCard({ hero, selected, onSelect }: HeroCardProps) {
  if (!hero) return null;

  return (
    <Card className={`relative ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{hero.name}</h3>
          <Badge>{hero.alignment}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="aspect-square relative mb-4">
          <img 
            src={hero.image?.url} 
            alt={hero.name}
            className="object-cover rounded-lg"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Intelligence</span>
            <span className="font-medium">{hero.powerstats?.intelligence}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strength</span>
            <span className="font-medium">{hero.powerstats?.strength}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Speed</span>
            <span className="font-medium">{hero.powerstats?.speed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Durability</span>
            <span className="font-medium">{hero.powerstats?.durability}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Power</span>
            <span className="font-medium">{hero.powerstats?.power}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Combat</span>
            <span className="font-medium">{hero.powerstats?.combat}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
