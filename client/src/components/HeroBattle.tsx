import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  determineBattleWinner, 
  getRandomHero, 
  type Hero, 
  type Bet 
} from "@/lib/battle-service";
import heroes from "../../../attached_assets/superheros-prod.js";

export function HeroBattle() {
  const [mode, setMode] = useState<"manual" | "random">("manual");
  const [hero1, setHero1] = useState<Hero | null>(null);
  const [hero2, setHero2] = useState<Hero | null>(null);
  const [winner, setWinner] = useState<Hero | null>(null);
  const [stash, setStash] = useState(100);
  const [bet, setBet] = useState<number>(0);
  const [selectedHero, setSelectedHero] = useState<number | null>(null);

  const handleBattle = () => {
    if (!hero1 || !hero2) return;

    const battleWinner = determineBattleWinner(hero1, hero2);
    setWinner(battleWinner);

    if (mode === "random" && selectedHero) {
      const newStash = selectedHero === battleWinner.id 
        ? stash + bet 
        : stash - bet;
      setStash(newStash);
    }
  };

  const handleRandom = () => {
    const randomHero1 = getRandomHero(heroes);
    let randomHero2 = getRandomHero(heroes);
    while (randomHero2.id === randomHero1.id) {
      randomHero2 = getRandomHero(heroes);
    }
    setHero1(randomHero1);
    setHero2(randomHero2);
    setWinner(null);
  };

  const handleReset = () => {
    setHero1(null);
    setHero2(null);
    setWinner(null);
    setSelectedHero(null);
    setBet(0);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-center gap-4 mb-6">
        <Button 
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
        >
          Manual Selection
        </Button>
        <Button
          variant={mode === "random" ? "default" : "outline"}
          onClick={() => setMode("random")}
        >
          Random Battle
        </Button>
      </div>

      {mode === "random" && (
        <div className="flex justify-center gap-4 mb-6">
          <Button onClick={handleRandom}>Generate Random Heroes</Button>
          {hero1 && hero2 && !winner && (
            <div className="flex items-center gap-4">
              <RadioGroup 
                onValueChange={(value) => setSelectedHero(Number(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={hero1.id.toString()} id="hero1" />
                  <Label htmlFor="hero1">{hero1.name}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={hero2.id.toString()} id="hero2" />
                  <Label htmlFor="hero2">{hero2.name}</Label>
                </div>
              </RadioGroup>
              <Input
                type="number"
                min={1}
                max={stash}
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                className="w-24"
              />
              <div>Stash: {stash}</div>
            </div>
          )}
        </div>
      )}

      {/* Hero Display */}
      {(hero1 || hero2) && (
        <div className="grid grid-cols-2 gap-4">
          {[hero1, hero2].map((hero, index) => hero && (
            <Card key={index} className="p-4">
              <img 
                src={hero.images.lg} 
                alt={hero.name} 
                className="w-full h-64 object-cover"
              />
              <h3 className="text-xl font-bold mt-2">{hero.name}</h3>
              <div className="mt-2 space-y-1">
                {Object.entries(hero.powerstats).map(([stat, value]) => (
                  <div key={stat} className="flex justify-between">
                    <span className="capitalize">{stat}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Battle Controls */}
      <div className="flex justify-center gap-4 mt-6">
        {hero1 && hero2 && !winner && (
          <Button onClick={handleBattle}>Fight!</Button>
        )}
        {winner && (
          <>
            <div className="text-xl font-bold">
              Winner: {winner.name}!
            </div>
            <Button onClick={handleReset}>Reset</Button>
          </>
        )}
      </div>
    </div>
  );
}