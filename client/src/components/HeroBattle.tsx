import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
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
  getHeroPowers,
  type Hero,
  type Bet,
} from "@/lib/battle-service";
import { PageTitle } from "@/components/ui/page-title";
import heroes from "../data/superheros-prod.js";

const STORAGE_KEY = "hero-battle-stash";
const BATTLE_STEPS = ["Data", "AI", "FIGHT!"];
const STEP_DURATION = 800;

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
  const [battleStep, setBattleStep] = useState<number>(-1);
  const [isBattling, setIsBattling] = useState(false);

  useEffect(() => {
    handleRandom();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, stash.toString());
  }, [stash]);

  const handleBattle = async () => {
    if (!hero1 || !hero2) return;
    setIsBattling(true);
    setBattleStep(0);

    for (let i = 0; i < BATTLE_STEPS.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, STEP_DURATION));
      setBattleStep(i);
    }

    await new Promise((resolve) => setTimeout(resolve, STEP_DURATION));
    const { winner: battleWinner, isMiracleWin } = determineBattleWinner(
      hero1,
      hero2,
    );
    setWinner(battleWinner);
    setIsBattling(false);
    setBattleStep(-1);

    if (mode === "random" && selectedHero) {
      const newStash =
        selectedHero === battleWinner.id
          ? stash + (isMiracleWin ? bet * 3 : bet)
          : stash - bet;
      setStash(newStash);
    }

    // Show miracle win message
    if (isMiracleWin) {
      const winnerDiv = document.querySelector(".winner-message");
      if (winnerDiv) {
        winnerDiv.textContent = `${battleWinner.name} Wins! (MIRACLE WIN!)`;
      }
    }
  };

  const handleRandom = () => {
    const randomHero1 = getRandomHero(heroes);
    let randomHero2 = getRandomHero(heroes);
    while (randomHero2.id === randomHero1.id) {
      randomHero2 = getRandomHero(heroes);
    }

    randomHero1.powers = getHeroPowers(randomHero1.name);
    randomHero2.powers = getHeroPowers(randomHero2.name);

    setHero1(randomHero1);
    setHero2(randomHero2);
    setWinner(null);
    setSelectedHero(null);
    setBet(0);
  };

  const handleHeroSelect = (value: string, heroNumber: number) => {
    const hero = heroes.find((h) => h.id.toString() === value);
    if (hero) {
      hero.powers = getHeroPowers(hero.name);
      if (heroNumber === 1) {
        setHero1(hero);
      } else {
        setHero2(hero);
      }
    }
  };

  const handleReset = () => {
    setHero1(null);
    setHero2(null);
    setWinner(null);
    setSelectedHero(null);
    setBet(0);
    handleRandom();
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-left items-center gap-4">
        <PageTitle size="lg" alignment="left">
          battle
        </PageTitle>
        <div className="flex items-center gap-2 mb-2">
          <span className={mode === "manual" ? "font-bold" : ""}>Manual</span>
          <Switch
            checked={mode === "random"}
            onCheckedChange={(checked) => {
              setMode(checked ? "random" : "manual");
              handleReset();
              if (checked) handleRandom();
            }}
          />
          <span className={mode === "random" ? "font-bold" : ""}>Random</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-4 flex justify-center flex-col md:flex-row">
          <div className="mt-4">
            {mode === "manual" && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Select onValueChange={(value) => handleHeroSelect(value, 1)}>
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
                  <Select onValueChange={(value) => handleHeroSelect(value, 2)}>
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
                {hero1 && hero2 && (
                  <div className="flex items-center gap-4">
                    <RadioGroup
                      onValueChange={(value) => setSelectedHero(Number(value))}
                      value={selectedHero?.toString()}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={hero1.id.toString()}
                          id="hero1"
                        />
                        <Label htmlFor="hero1">{hero1.name}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={hero2.id.toString()}
                          id="hero2"
                        />
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
                    <div className="font-bold text-1xl">Stash: {stash}</div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-center gap-4 mb-6">
              {hero1 && hero2 && !winner && (
                <Button
                  className="w-3/4 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold rounded"
                  onClick={handleBattle}
                >
                  Fight!
                </Button>
              )}
              {winner && (
                <Button
                  className="w-3/4 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold rounded"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="gap-4 pl-4">
            <AnimatePresence mode="wait">
              {!isBattling && !winner && hero1 && hero2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center p-2 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg text-white font-bold text-2xl m-2 text-center min-w-[300px]"
                >
                  {hero1.name}
                  <br />
                  vs.
                  <br />
                  {hero2.name}
                </motion.div>
              )}
              {isBattling && battleStep >= 0 && (
                <motion.div
                  key={battleStep}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg text-white font-bold text-4xl min-w-[300px]"
                >
                  {BATTLE_STEPS[battleStep]}
                </motion.div>
              )}
              {winner && !isBattling && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center w-full h-32 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg text-white font-bold text-2xl p-4 text-center min-w-[300px]"
                >
                  {winner.name} Wins!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <img
                            src="/images/loser.png"
                            alt="Loser"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
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
                          <span className="font-semibold">Powers</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-2">
                          <div className="grid grid-cols-2 gap-2">
                            {hero.powers && hero.powers.length > 0 ? (
                              hero.powers.map((power) => (
                                <div
                                  key={power}
                                  className="bg-gray-50 p-2 rounded text-sm"
                                >
                                  {power}
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500">
                                No powers listed
                              </div>
                            )}
                          </div>
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
