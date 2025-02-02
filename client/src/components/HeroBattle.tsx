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
import { motion, AnimatePresence } from "framer-motion";

export function HeroBattle() {
  const [mode, setMode] = useState<"manual" | "random">("manual");
  const [hero1, setHero1] = useState<Hero | null>(null);
  const [hero2, setHero2] = useState<Hero | null>(null);
  const [winner, setWinner] = useState<Hero | null>(null);
  const [stash, setStash] = useState(100);
  const [bet, setBet] = useState<number>(0);
  const [selectedHero, setSelectedHero] = useState<number | null>(null);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [isBattling, setIsBattling] = useState(false);

  const filteredHeroes1 = heroes.filter(h => 
    h.name.toLowerCase().includes(searchTerm1.toLowerCase())
  );

  const filteredHeroes2 = heroes.filter(h => 
    h.name.toLowerCase().includes(searchTerm2.toLowerCase())
  );

  const handleBattle = async () => {
    if (!hero1 || !hero2) return;

    setIsBattling(true);

    // Simulate battle animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const battleWinner = determineBattleWinner(hero1, hero2);
    setWinner(battleWinner);
    setIsBattling(false);

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
    setSearchTerm1("");
    setSearchTerm2("");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-center gap-4 mb-6">
        <Button 
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => {
            setMode("manual");
            handleReset();
          }}
        >
          Manual Selection
        </Button>
        <Button
          variant={mode === "random" ? "default" : "outline"}
          onClick={() => {
            setMode("random");
            handleReset();
          }}
        >
          Random Battle
        </Button>
      </div>

      {mode === "manual" && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Input
              placeholder="Search hero 1..."
              value={searchTerm1}
              onChange={(e) => setSearchTerm1(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {filteredHeroes1.map(h => (
                <div
                  key={h.id}
                  className="cursor-pointer p-1 hover:bg-gray-100"
                  onClick={() => setHero1(h)}
                >
                  {h.name}
                </div>
              ))}
            </div>
          </div>
          <div>
            <Input
              placeholder="Search hero 2..."
              value={searchTerm2}
              onChange={(e) => setSearchTerm2(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {filteredHeroes2.map(h => (
                <div
                  key={h.id}
                  className="cursor-pointer p-1 hover:bg-gray-100"
                  onClick={() => setHero2(h)}
                >
                  {h.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Battle Animation */}
      {isBattling && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="text-6xl font-bold text-white"
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, 360, 0]
            }}
            transition={{ duration: 2 }}
          >
            BATTLE!
          </motion.div>
        </motion.div>
      )}

      {/* Hero Display */}
      {(hero1 || hero2) && (
        <div className="grid grid-cols-2 gap-4">
          {[hero1, hero2].map((hero, index) => hero && (
            <div key={index} className="relative">
              <Card className="p-4">
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
              {winner && winner.id !== hero.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-red-600 text-[200px] font-bold transform rotate-45">
                    ×
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Battle Controls */}
      <div className="flex justify-center gap-4 mt-6">
        {hero1 && hero2 && !winner && !isBattling && (
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