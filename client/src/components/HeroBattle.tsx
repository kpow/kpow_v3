import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import {
  determineBattleWinner,
  getRandomHero,
  type Hero,
  type Bet,
} from "@/lib/battle-service";
import heroes from "../../../attached_assets/superheros-prod.js";

const STORAGE_KEY = "hero-battle-stash";

export function HeroBattle() {
  const [mode, setMode] = useState<"manual" | "random">("random");
  const [hero1, setHero1] = useState<Hero | null>(null);
  const [hero2, setHero2] = useState<Hero | null>(null);
  const [winner, setWinner] = useState<Hero | null>(null);
  const [stash, setStash] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 100;
  });
  const [bet, setBet] = useState<number>(0);
  const [selectedHero, setSelectedHero] = useState<number | null>(null);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");

  useEffect(() => {
    handleRandom();
  }, []);

  // Save stash to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, stash.toString());
  }, [stash]);

  const handleBattle = () => {
    if (!hero1 || !hero2) return;
    const battleWinner = determineBattleWinner(hero1, hero2);
    setWinner(battleWinner);

    if (mode === "random" && selectedHero) {
      const newStash =
        selectedHero === battleWinner.id ? stash + bet : stash - bet;
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
    setSelectedHero(null);
    setBet(0);
  };

  const handleReset = () => {
    setHero1(null);
    setHero2(null);
    setWinner(null);
    setSelectedHero(null);
    setBet(0);
    setSearchTerm1("");
    setSearchTerm2("");
    // Generate new random heroes after reset
    handleRandom();
  };

  return (
    <div className="container mx-auto p-4">
      {winner && (
        <>
          <div className="flex justify-center text-xl font-bold mb-3">
            Winner: {winner.name}!
          </div>
        </>
      )}
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
            handleRandom();
          }}
        >
          Random Battle
        </Button>

        {hero1 && hero2 && !winner && (
          <Button onClick={handleBattle}>Fight!</Button>
        )}
        {winner && (
          <>
            <Button onClick={handleReset}>Reset</Button>
          </>
        )}
      </div>

      {mode === "manual" && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Select
              onValueChange={(value) => {
                const hero = heroes.find((h) => h.id.toString() === value);
                if (hero) setHero1(hero);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hero 1" />
              </SelectTrigger>
              <SelectContent>
                {heroes.map((hero) => (
                  <SelectItem key={hero.id} value={hero.id.toString()}>
                    {hero.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              onValueChange={(value) => {
                const hero = heroes.find((h) => h.id.toString() === value);
                if (hero) setHero2(hero);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hero 2" />
              </SelectTrigger>
              <SelectContent>
                {heroes.map((hero) => (
                  <SelectItem key={hero.id} value={hero.id.toString()}>
                    {hero.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {mode === "random" && (
        <div className="flex justify-center gap-4 mb-6">
          {/* <Button onClick={handleRandom}>Generate Random Heroes</Button> */}
          {hero1 && hero2 && (
            <div className="flex items-center gap-4">
              <RadioGroup
                onValueChange={(value) => setSelectedHero(Number(value))}
                value={selectedHero?.toString()}
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

      {(hero1 || hero2) && (
        <div className="grid grid-cols-2 gap-4">
          {[hero1, hero2].map(
            (hero, index) =>
              hero && (
                <div key={index} className="relative">
                  <Card className="p-4">
                    <div className="relative">
                      <img
                        src={hero.images.lg}
                        alt={hero.name}
                        className="w-full object-cover"
                      />
                      {winner && winner.id !== hero.id && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-red-600 text-[200px] font-bold transform rotate-45">
                            ×
                          </div>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mt-2">{hero.name}</h3>

                    <div className="mt-4 space-y-2">
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-100 rounded-lg">
                          <span className="font-semibold">Power Stats</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-2">
                          {Object.entries(hero.powerstats).map(
                            ([stat, value]) => (
                              <div key={stat} className="flex justify-between">
                                <span className="capitalize">{stat}</span>
                                <span>{value}</span>
                              </div>
                            ),
                          )}
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-100 rounded-lg">
                          <span className="font-bold">Biography</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-2">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="font-bold text-sm">Full Name</div>
                              <div>{hero.biography.fullName || "Unknown"}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-gray-600">
                                Alignment
                              </div>
                              <div className="capitalize">
                                {hero.biography.alignment}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-gray-600">
                                Place of Birth
                              </div>
                              <div>
                                {hero.biography.placeOfBirth || "Unknown"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-gray-600">
                                First Appearance
                              </div>
                              <div>
                                {hero.biography.firstAppearance || "Unknown"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-gray-600">
                                Publisher
                              </div>
                              <div>{hero.biography.publisher || "Unknown"}</div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-100 rounded-lg">
                          <span className="font-semibold">Appearance</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-2">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Race</span>
                              <span>{hero.appearance.race || "Unknown"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Height</span>
                              <span>
                                {hero.appearance.height[1] || "Unknown"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Weight</span>
                              <span>
                                {hero.appearance.weight[1] || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-100 rounded-lg">
                          <span className="font-semibold">Work</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-2">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-gray-600">
                                Occupation
                              </div>
                              <div>{hero.work.occupation || "Unknown"}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-gray-600">
                                Base
                              </div>
                              <div>{hero.work.base || "Unknown"}</div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-100 rounded-lg">
                          <span className="font-semibold">Connections</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-2">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-gray-600">
                                Group Affiliation
                              </div>
                              <div>
                                {hero.connections.groupAffiliation || "Unknown"}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </Card>
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
}
