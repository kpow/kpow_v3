import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
} from "@/lib/battle-service";
import { PageTitle } from "@/components/ui/page-title";
// @ts-ignore - JavaScript data file
import heroes from "../data/superheros-prod.js";

const STORAGE_KEY = "hero-battle-stash";
const BATTLE_STEPS = ["Data", "AI", "FIGHT!"];
const STEP_DURATION = 800;

export function HeroBattle() {
  const [mode, setMode] = useState<"manual" | "random">("random");
  const [hero1, setHero1] = useState<Hero | null>(null);
  const [hero2, setHero2] = useState<Hero | null>(null);
  const [winner, setWinner] = useState<Hero | null>(null);
  const [isMiracleWin, setIsMiracleWin] = useState(false);
  const [stash, setStash] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 100;
  });
  const [bet, setBet] = useState<number>(10);
  useEffect(() => {
    // Set initial bet to 10
    setBet(10);
  }, []);
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

    // In random mode, validate that a hero is selected and the bet is at least 10
    if (mode === "random") {
      if (!selectedHero) {
        alert("Please select a hero to bet on!");
        return;
      }

      if (bet < 10) {
        alert("Minimum bet is 10 coins!");
        setBet(10);
        return;
      }
    }

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
    setIsMiracleWin(isMiracleWin);
    setIsBattling(false);
    setBattleStep(-1);

    if (mode === "random" && selectedHero) {
      const newStash =
        selectedHero === battleWinner.id
          ? stash + (isMiracleWin ? bet * 3 : bet)
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

    randomHero1.powers = getHeroPowers(randomHero1.name);
    randomHero2.powers = getHeroPowers(randomHero2.name);

    setHero1(randomHero1);
    setHero2(randomHero2);
    setWinner(null);
    setSelectedHero(null);
    setBet(10);
  };

  const handleHeroSelect = (value: string, heroNumber: number) => {
    const hero = heroes.find((h: any) => h.id.toString() === value);
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
    setBet(10);
    handleRandom();
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          <div className="flex items-center gap-4">
            <PageTitle size="lg" alignment="left">
              battle
            </PageTitle>
            <div className="flex items-center gap-2">
              <span className={mode === "manual" ? "font-bold" : ""}>
                Manual
              </span>
              <Switch
                checked={mode === "random"}
                onCheckedChange={(checked) => {
                  setMode(checked ? "random" : "manual");
                  handleReset();
                  if (checked) handleRandom();
                }}
              />
              <span className={mode === "random" ? "font-bold" : ""}>
                Random
              </span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg">
            <div className="text-white text-lg sm:text-2xl font-slackey">
              Stash: {stash}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          {mode === "manual" && (
            <div className="w-full max-w-md mx-auto space-y-4">
              {/* Manual Mode Hero Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Choose Fighter 1</label>
                  <Select onValueChange={(value) => handleHeroSelect(value, 1)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hero 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {heroes.map((hero: any) => (
                        <SelectItem key={hero.id} value={hero.id.toString()}>
                          {hero.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* VS Section */}
                <div className="flex items-center justify-center py-4">
                  <AnimatePresence mode="popLayout">
                    {!isBattling && !winner && hero1 && hero2 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-lg text-white font-bold text-xl text-center"
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
                        className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-lg text-white font-bold text-2xl"
                      >
                        {BATTLE_STEPS[battleStep]}
                      </motion.div>
                    )}
                    {winner && !isBattling && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`px-8 py-4 rounded-lg text-white font-bold text-xl text-center ${
                          isMiracleWin
                            ? "bg-gradient-to-r from-purple-600 to-pink-600"
                            : "bg-gradient-to-r from-green-600 to-emerald-600"
                        }`}
                      >
                        {winner.name} Wins!
                        {isMiracleWin && (
                          <div className="text-yellow-300 mt-2 text-lg animate-pulse">
                            ⚡ MIRACLE VICTORY! ⚡
                          </div>
                        )}
                      </motion.div>
                    )}
                    {!hero1 || !hero2 ? (
                      <div className="bg-gray-200 px-8 py-4 rounded-lg text-gray-600 font-bold text-lg">
                        Select Both Heroes
                      </div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Choose Fighter 2</label>
                  <Select onValueChange={(value) => handleHeroSelect(value, 2)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hero 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {heroes.map((hero: any) => (
                        <SelectItem key={hero.id} value={hero.id.toString()}>
                          {hero.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg py-3 font-slackey"
                  onClick={handleRandom}
                >
                  Randomize
                </Button>
                {hero1 && hero2 && !winner && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-3 font-slackey"
                    onClick={handleBattle}
                  >
                    Fight!
                  </Button>
                )}
                {winner && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg py-3 font-slackey"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          )}

          {mode === "random" && hero1 && hero2 && (
            <>
              {/* Mobile Layout */}
              <div className="lg:hidden w-full max-w-md mx-auto space-y-4">
                <RadioGroup
                  onValueChange={(value) => setSelectedHero(Number(value))}
                  value={selectedHero?.toString()}
                  className="space-y-4"
                >
                  {/* Hero 1 Card */}
                  <motion.div
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedHero === hero1.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 border-blue-400 shadow-lg shadow-blue-400/30"
                        : "bg-gray-900 border-gray-600 hover:border-gray-500"
                    }`}
                    onClick={() => setSelectedHero(hero1.id)}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Selected Indicator */}
                    {selectedHero === hero1.id && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1 z-10">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="text-white text-xs font-bold">✓</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={hero1.images.lg}
                          alt={hero1.name}
                          className="w-full h-full object-cover"
                        />
                        {winner && winner.id !== hero1.id && (
                          <div className="absolute -inset-4 flex items-center justify-center z-20 pointer-events-none">
                            <svg
                              className="w-40 h-40"
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="50" cy="50" r="45" stroke="rgb(239 68 68)" strokeWidth="8" opacity="0.9"/>
                              <path d="M30 30 L70 70 M70 30 L30 70" stroke="rgb(239 68 68)" strokeWidth="8" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-h-32 flex flex-col justify-between">
                        <div>
                          <h3 className={`font-bold text-lg mb-2 ${selectedHero === hero1.id ? "text-white" : "text-white"}`}>
                            {hero1.name}
                          </h3>
                          <div className="space-y-1 text-xs">
                            <div className={`flex justify-between ${selectedHero === hero1.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Intelligence:</span><span className="text-blue-400 font-medium">{hero1.powerstats.intelligence}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero1.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Strength:</span><span className="text-red-400 font-medium">{hero1.powerstats.strength}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero1.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Speed:</span><span className="text-yellow-400 font-medium">{hero1.powerstats.speed}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero1.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Durability:</span><span className="text-green-400 font-medium">{hero1.powerstats.durability}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero1.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Power:</span><span className="text-purple-400 font-medium">{hero1.powerstats.power}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero1.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Combat:</span><span className="text-orange-400 font-medium">{hero1.powerstats.combat}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <RadioGroupItem
                      value={hero1.id.toString()}
                      id="hero1-mobile"
                      className="sr-only"
                    />
                  </motion.div>

                  {/* Smart Battle Control Element */}
                  <div className="flex items-center justify-center py-2">
                    <AnimatePresence mode="popLayout">
                      {!isBattling && !winner && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          onClick={handleBattle}
                          disabled={!selectedHero || bet < 10}
                          className={`px-8 py-4 rounded-full text-white font-bold text-lg transition-all ${
                            selectedHero && bet >= 10
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 cursor-pointer shadow-lg"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                          whileHover={selectedHero && bet >= 10 ? { scale: 1.05 } : {}}
                          whileTap={selectedHero && bet >= 10 ? { scale: 0.95 } : {}}
                        >
                          {selectedHero ? `FIGHT! (${bet} on ${selectedHero === hero1.id ? hero1.name : hero2.name})` : "SELECT HERO"}
                        </motion.button>
                      )}
                      {isBattling && battleStep >= 0 && (
                        <motion.div
                          key={battleStep}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-full text-white font-bold text-xl"
                        >
                          {BATTLE_STEPS[battleStep]}
                        </motion.div>
                      )}
                      {winner && !isBattling && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={handleRandom}
                          className={`px-8 py-4 rounded-full text-white font-bold text-lg cursor-pointer transition-all ${
                            isMiracleWin
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-center">
                            <div>{winner.name} WINS!</div>
                            {isMiracleWin && <div className="text-yellow-300 text-sm">⚡ MIRACLE! ⚡</div>}
                            <div className="text-sm mt-1">NEW BATTLE</div>
                          </div>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hero 2 Card */}
                  <motion.div
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedHero === hero2.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 border-blue-400 shadow-lg shadow-blue-400/30"
                        : "bg-gray-900 border-gray-600 hover:border-gray-500"
                    }`}
                    onClick={() => setSelectedHero(hero2.id)}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Selected Indicator */}
                    {selectedHero === hero2.id && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1 z-10">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="text-white text-xs font-bold">✓</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={hero2.images.lg}
                          alt={hero2.name}
                          className="w-full h-full object-cover"
                        />
                        {winner && winner.id !== hero2.id && (
                          <div className="absolute -inset-4 flex items-center justify-center z-20 pointer-events-none">
                            <svg
                              className="w-40 h-40"
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="50" cy="50" r="45" stroke="rgb(239 68 68)" strokeWidth="8" opacity="0.9"/>
                              <path d="M30 30 L70 70 M70 30 L30 70" stroke="rgb(239 68 68)" strokeWidth="8" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-h-32 flex flex-col justify-between">
                        <div>
                          <h3 className={`font-bold text-lg mb-2 ${selectedHero === hero2.id ? "text-white" : "text-white"}`}>
                            {hero2.name}
                          </h3>
                          <div className="space-y-1 text-xs">
                            <div className={`flex justify-between ${selectedHero === hero2.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Intelligence:</span><span className="text-blue-400 font-medium">{hero2.powerstats.intelligence}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero2.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Strength:</span><span className="text-red-400 font-medium">{hero2.powerstats.strength}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero2.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Speed:</span><span className="text-yellow-400 font-medium">{hero2.powerstats.speed}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero2.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Durability:</span><span className="text-green-400 font-medium">{hero2.powerstats.durability}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero2.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Power:</span><span className="text-purple-400 font-medium">{hero2.powerstats.power}</span>
                            </div>
                            <div className={`flex justify-between ${selectedHero === hero2.id ? "text-blue-100" : "text-gray-300"}`}>
                              <span>Combat:</span><span className="text-orange-400 font-medium">{hero2.powerstats.combat}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <RadioGroupItem
                      value={hero2.id.toString()}
                      id="hero2-mobile"
                      className="sr-only"
                    />
                  </motion.div>
                </RadioGroup>

                {/* Betting Controls */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                  <div className="text-center">
                    <div className="text-lg font-semibold font-slackey mb-2 text-white">
                      Bet Amount
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBet(Math.max(10, bet - 10))}
                        disabled={bet <= 10}
                        className="border-gray-500 text-gray-300 hover:bg-gray-700"
                      >
                        -10
                      </Button>
                      <Input
                        type="number"
                        min={10}
                        max={stash}
                        value={bet}
                        onChange={(e) => setBet(Math.max(10, Number(e.target.value)))}
                        className="w-20 text-center bg-gray-700 border-gray-500 text-white"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBet(Math.min(stash, bet + 10))}
                        disabled={bet >= stash}
                        className="border-gray-500 text-gray-300 hover:bg-gray-700"
                      >
                        +10
                      </Button>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Min: 10 coins | Max: {stash} coins
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex flex-col items-center space-y-8 w-full max-w-6xl mx-auto">
                {/* Desktop Betting Controls & VS Element */}
                <div className="grid grid-cols-2 gap-8 w-full">
                  {/* Left Side - Place Your Bet */}
                  <div className="bg-gray-900 rounded-xl p-8 shadow-2xl border border-gray-700">
                    <h3 className="text-2xl font-black mb-6 text-center text-white">Place Your Bet</h3>
                    
                    {/* Hero Selection - Horizontal Layout */}
                    <RadioGroup
                      onValueChange={(value) => setSelectedHero(Number(value))}
                      value={selectedHero?.toString()}
                      className="grid grid-cols-2 gap-6 mb-6"
                    >
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-28 h-28 rounded-xl overflow-hidden mb-3 border-2 border-gray-600 cursor-pointer hover:border-blue-400 transition-colors"
                          onClick={() => setSelectedHero(hero1.id)}
                        >
                          <img
                            src={hero1.images.lg}
                            alt={hero1.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem 
                            value={hero1.id.toString()} 
                            id="desktop-hero1" 
                            className="border-gray-400 text-blue-400"
                          />
                          <label htmlFor="desktop-hero1" className="cursor-pointer font-bold text-white">{hero1.name}</label>
                        </div>
                        <div className="text-sm text-gray-300">
                          ⚡ {Object.values(hero1.powerstats).reduce((a, b) => a + b, 0)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-28 h-28 rounded-xl overflow-hidden mb-3 border-2 border-gray-600 cursor-pointer hover:border-blue-400 transition-colors"
                          onClick={() => setSelectedHero(hero2.id)}
                        >
                          <img
                            src={hero2.images.lg}
                            alt={hero2.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem 
                            value={hero2.id.toString()} 
                            id="desktop-hero2" 
                            className="border-gray-400 text-blue-400"
                          />
                          <label htmlFor="desktop-hero2" className="cursor-pointer font-bold text-white">{hero2.name}</label>
                        </div>
                        <div className="text-sm text-gray-300">
                          ⚡ {Object.values(hero2.powerstats).reduce((a, b) => a + b, 0)}
                        </div>
                      </div>
                    </RadioGroup>
                    
                    {/* Betting Amount - Horizontal Layout */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-600">
                      <div className="text-center">
                        <div className="text-base font-bold text-white mb-2">Bet Amount</div>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBet(Math.max(10, bet - 10))}
                            disabled={bet <= 10}
                            className="border-gray-500 text-gray-300 hover:bg-gray-700 font-bold px-3 py-1"
                          >
                            -10
                          </Button>
                          <Input
                            type="number"
                            min={10}
                            max={stash}
                            value={bet}
                            onChange={(e) => setBet(Math.max(10, Number(e.target.value)))}
                            className="w-20 text-center bg-gray-700 border-gray-500 text-white font-bold h-8"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBet(Math.min(stash, bet + 10))}
                            disabled={bet >= stash}
                            className="border-gray-500 text-gray-300 hover:bg-gray-700 font-bold px-3 py-1"
                          >
                            +10
                          </Button>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Range: 10 - {stash} coins
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black py-4 text-xl rounded-lg shadow-lg"
                      onClick={handleBattle}
                      disabled={!selectedHero || bet < 10}
                    >
                      Fight!
                    </Button>
                  </div>

                  {/* Right Side - VS Display */}
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 text-white text-center flex items-center justify-center min-h-[200px]">
                    <AnimatePresence mode="popLayout">
                      {!isBattling && !winner && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="w-full"
                        >
                          <div className="text-3xl lg:text-4xl xl:text-5xl font-black mb-4">
                            {hero1.name}
                          </div>
                          <div className="text-5xl lg:text-6xl xl:text-7xl font-black my-6 drop-shadow-lg">VS</div>
                          <div className="text-3xl lg:text-4xl xl:text-5xl font-black">
                            {hero2.name}
                          </div>
                        </motion.div>
                      )}
                      {isBattling && battleStep >= 0 && (
                        <motion.div
                          key={battleStep}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.3 }}
                          className="text-4xl lg:text-5xl xl:text-6xl font-black"
                        >
                          {BATTLE_STEPS[battleStep]}
                        </motion.div>
                      )}
                      {winner && !isBattling && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center w-full"
                        >
                          <div className="text-3xl lg:text-4xl xl:text-5xl font-black">{winner.name}</div>
                          <div className="text-2xl lg:text-3xl xl:text-4xl font-bold mt-2">WINS!</div>
                          {isMiracleWin && (
                            <div className="text-yellow-300 mt-4 text-xl lg:text-2xl xl:text-3xl animate-pulse font-bold">
                              ⚡ MIRACLE VICTORY! ⚡
                            </div>
                          )}
                          <Button
                            className="mt-6 bg-white text-purple-600 hover:bg-gray-100 font-bold px-6 py-3 text-lg"
                            onClick={handleRandom}
                          >
                            🎲 NEW BATTLE
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </>
          )}
          {/* Hero Details - Hidden on Mobile, Shown on Desktop */}
          {(hero1 || hero2) && (
            <div className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-6xl mx-auto">
              {[hero1, hero2].map(
                (hero, index) =>
                  hero && (
                    <div key={index} className="relative">
                      <Card className="p-4 bg-gray-900 border-gray-600">
                        <div className="relative">
                          <img
                            src={hero.images.lg}
                            alt={hero.name}
                            className="w-full object-cover rounded-lg"
                          />
                          {winner && winner.id !== hero.id && (
                            <div className="absolute -inset-2 flex items-center justify-center z-20">
                              <div className="text-red-500 font-black text-9xl drop-shadow-lg transform -rotate-12">✕</div>
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mt-2 text-white">{hero.name}</h3>

                        <div className="mt-4 space-y-2">
                          <Collapsible defaultOpen>
                            <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-800 rounded-lg">
                              <span className="font-semibold text-white">Power Stats</span>
                              <ChevronDown className="h-4 w-4 text-gray-300" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-2">
                              {Object.entries(hero.powerstats).map(
                                ([stat, value]) => (
                                  <div
                                    key={stat}
                                    className="flex justify-between text-gray-300"
                                  >
                                    <span className="capitalize">{stat}</span>
                                    <span className="text-white font-medium">{value}</span>
                                  </div>
                                ),
                              )}
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible>
                            <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-800 rounded-lg">
                              <span className="font-semibold text-white">Powers</span>
                              <ChevronDown className="h-4 w-4 text-gray-300" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-2">
                              <div className="grid grid-cols-2 gap-2">
                                {hero.powers && hero.powers.length > 0 ? (
                                  hero.powers.map((power: string) => (
                                    <div
                                      key={power}
                                      className="bg-gray-700 p-2 rounded text-sm text-gray-200"
                                    >
                                      {power}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-gray-400">
                                    No powers listed
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible>
                            <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-800 rounded-lg">
                              <span className="font-bold text-white">Biography</span>
                              <ChevronDown className="h-4 w-4 text-gray-300" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-2">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-300">Full Name:</span>
                                  <span className="text-white">{hero.biography.fullName || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">Alignment:</span>
                                  <span className="text-white capitalize">{hero.biography.alignment || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">Place of Birth:</span>
                                  <span className="text-white">{hero.biography.placeOfBirth || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">First Appearance:</span>
                                  <span className="text-white">{hero.biography.firstAppearance || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">Publisher:</span>
                                  <span className="text-white">{hero.biography.publisher || "-"}</span>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* Appearance */}
                          {hero.appearance && (
                            <Collapsible>
                              <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-800 rounded-lg">
                                <span className="font-semibold text-white">Appearance</span>
                                <ChevronDown className="h-4 w-4 text-gray-300" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-2">
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">Race:</span>
                                    <span className="text-white">{hero.appearance.race || "Unknown"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">Height:</span>
                                    <span className="text-white">{hero.appearance.height?.[1] || "0 cm"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">Weight:</span>
                                    <span className="text-white">{hero.appearance.weight?.[1] || "0 kg"}</span>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}

                          {/* Work */}
                          {hero.work && (
                            <Collapsible>
                              <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-800 rounded-lg">
                                <span className="font-semibold text-white">Work</span>
                                <ChevronDown className="h-4 w-4 text-gray-300" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-2">
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">Occupation:</span>
                                    <span className="text-white">{hero.work.occupation || "-"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">Base:</span>
                                    <span className="text-white">{hero.work.base || "-"}</span>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}

                          {/* Connections */}
                          {hero.connections && (
                            <Collapsible>
                              <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-800 rounded-lg">
                                <span className="font-semibold text-white">Connections</span>
                                <ChevronDown className="h-4 w-4 text-gray-300" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-2">
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <div className="text-gray-300 mb-1">Group Affiliation:</div>
                                    <div className="text-white text-xs">{hero.connections.groupAffiliation || "-"}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-300 mb-1">Relatives:</div>
                                    <div className="text-white text-xs">{hero.connections.relatives || "-"}</div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </div>
                      </Card>
                    </div>
                  ),
              )}
            </div>
          )}

          {/* Mobile Hero Detailed View */}
          {(hero1 || hero2) && (
            <div className="lg:hidden w-full max-w-md mx-auto">
              <div className="bg-gray-900 rounded-lg border border-gray-600 p-4">
                <h3 className="font-semibold text-center mb-4 text-white">Battle Participants</h3>
                
                <div className="space-y-4">
                  {/* Hero 1 Compact Details */}
                  {hero1 && (
                    <div className="border border-gray-600 bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={hero1.images.lg}
                          alt={hero1.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-white">{hero1.name}</div>
                          <div className="text-xs text-gray-300">
                            {hero1.biography.fullName || "Unknown Identity"}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {hero1.biography.alignment}
                          </div>
                        </div>
                      </div>

                      {/* Powers */}
                      {hero1.powers && hero1.powers.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Powers:</div>
                          <div className="flex flex-wrap gap-1">
                            {hero1.powers.map((power: string) => (
                              <span key={power} className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded">
                                {power}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Collapsible Details */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-700 rounded mt-3 text-xs text-gray-300">
                          <span>View Details</span>
                          <ChevronDown className="h-3 w-3" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 space-y-3">
                          {/* Power Stats */}
                          <div>
                            <div className="text-xs font-bold text-gray-400 mb-2">Power Stats</div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-blue-400">{hero1.powerstats.intelligence}</div>
                                <div className="text-gray-300">INT</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-red-400">{hero1.powerstats.strength}</div>
                                <div className="text-gray-300">STR</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-yellow-400">{hero1.powerstats.speed}</div>
                                <div className="text-gray-300">SPD</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-green-400">{hero1.powerstats.durability}</div>
                                <div className="text-gray-300">DUR</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-purple-400">{hero1.powerstats.power}</div>
                                <div className="text-gray-300">PWR</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-orange-400">{hero1.powerstats.combat}</div>
                                <div className="text-gray-300">CMB</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Biography */}
                          {hero1.biography && (
                            <div>
                              <div className="text-xs font-bold text-gray-400 mb-1">Biography</div>
                              <div className="text-xs space-y-1 text-gray-300">
                                <div><span className="text-gray-400">Full Name:</span> {hero1.biography.fullName || "-"}</div>
                                <div><span className="text-gray-400">Alignment:</span> {hero1.biography.alignment || "-"}</div>
                                <div><span className="text-gray-400">Place of Birth:</span> {hero1.biography.placeOfBirth || "-"}</div>
                                <div><span className="text-gray-400">First Appearance:</span> {hero1.biography.firstAppearance || "-"}</div>
                                <div><span className="text-gray-400">Publisher:</span> {hero1.biography.publisher || "-"}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Appearance */}
                          {hero1.appearance && (
                            <div>
                              <div className="text-xs font-bold text-gray-400 mb-1">Appearance</div>
                              <div className="text-xs space-y-1 text-gray-300">
                                <div><span className="text-gray-400">Race:</span> {hero1.appearance.race || "Unknown"}</div>
                                <div><span className="text-gray-400">Height:</span> {hero1.appearance.height?.[1] || "0 cm"}</div>
                                <div><span className="text-gray-400">Weight:</span> {hero1.appearance.weight?.[1] || "0 kg"}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Work */}
                          {hero1.work && (
                            <div>
                              <div className="text-xs font-bold text-gray-400 mb-1">Work</div>
                              <div className="text-xs space-y-1 text-gray-300">
                                <div><span className="text-gray-400">Occupation:</span> {hero1.work.occupation || "-"}</div>
                                <div><span className="text-gray-400">Base:</span> {hero1.work.base || "-"}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Connections */}
                          {hero1.connections && (
                            <div>
                              <div className="text-xs font-bold text-gray-400 mb-1">Connections</div>
                              <div className="text-xs space-y-1 text-gray-300">
                                <div><span className="text-gray-400">Group Affiliation:</span> {hero1.connections.groupAffiliation || "-"}</div>
                                <div><span className="text-gray-400">Relatives:</span> {hero1.connections.relatives || "-"}</div>
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {/* VS Divider */}
                  <div className="text-center text-gray-400 font-bold">VS</div>

                  {/* Hero 2 Compact Details */}
                  {hero2 && (
                    <div className="border border-gray-600 bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={hero2.images.lg}
                          alt={hero2.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-white">{hero2.name}</div>
                          <div className="text-xs text-gray-300">
                            {hero2.biography.fullName || "Unknown Identity"}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {hero2.biography.alignment}
                          </div>
                        </div>
                      </div>

                      {/* Powers */}
                      {hero2.powers && hero2.powers.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Powers:</div>
                          <div className="flex flex-wrap gap-1">
                            {hero2.powers.map((power: string) => (
                              <span key={power} className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded">
                                {power}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Collapsible Details */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-gray-700 rounded mt-3 text-xs text-gray-300">
                          <span>View Details</span>
                          <ChevronDown className="h-3 w-3" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 space-y-3">
                          {/* Power Stats */}
                          <div>
                            <div className="text-xs font-bold text-gray-400 mb-2">Power Stats</div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-blue-400">{hero2.powerstats.intelligence}</div>
                                <div className="text-gray-300">INT</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-red-400">{hero2.powerstats.strength}</div>
                                <div className="text-gray-300">STR</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-yellow-400">{hero2.powerstats.speed}</div>
                                <div className="text-gray-300">SPD</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-green-400">{hero2.powerstats.durability}</div>
                                <div className="text-gray-300">DUR</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-purple-400">{hero2.powerstats.power}</div>
                                <div className="text-gray-300">PWR</div>
                              </div>
                              <div className="text-center bg-gray-700 rounded py-1">
                                <div className="font-medium text-orange-400">{hero2.powerstats.combat}</div>
                                <div className="text-gray-300">CMB</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Biography */}
                          {hero2.biography && (
                            <div>
                              <div className="text-xs font-bold text-gray-400 mb-1">Biography</div>
                              <div className="text-xs space-y-1 text-gray-300">
                                <div><span className="text-gray-400">Full Name:</span> {hero2.biography.fullName || "-"}</div>
                                <div><span className="text-gray-400">Alignment:</span> {hero2.biography.alignment || "-"}</div>
                                <div><span className="text-gray-400">Place of Birth:</span> {hero2.biography.placeOfBirth || "-"}</div>
                                <div><span className="text-gray-400">First Appearance:</span> {hero2.biography.firstAppearance || "-"}</div>
                                <div><span className="text-gray-400">Publisher:</span> {hero2.biography.publisher || "-"}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Appearance */}
                          {hero2.appearance && (
                            <div>
                              <div className="text-xs font-bold text-gray-400 mb-1">Appearance</div>
                              <div className="text-xs space-y-1 text-gray-300">
                                <div><span className="text-gray-400">Race:</span> {hero2.appearance.race || "Unknown"}</div>
                                <div><span className="text-gray-400">Height:</span> {hero2.appearance.height?.[1] || "0 cm"}</div>
                                <div><span className="text-gray-400">Weight:</span> {hero2.appearance.weight?.[1] || "0 kg"}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Work */}
                          {hero2.work && (
                            <div>
                              <div className="text-xs font-bold text-gray-400 mb-1">Work</div>
                              <div className="text-xs space-y-1 text-gray-300">
                                <div><span className="text-gray-400">Occupation:</span> {hero2.work.occupation || "-"}</div>
                                <div><span className="text-gray-400">Base:</span> {hero2.work.base || "-"}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Connections */}
                          {hero2.connections && (
                            <div>
                              <div className="text-xs font-bold text-gray-400 mb-1">Connections</div>
                              <div className="text-xs space-y-1 text-gray-300">
                                <div><span className="text-gray-400">Group Affiliation:</span> {hero2.connections.groupAffiliation || "-"}</div>
                                <div><span className="text-gray-400">Relatives:</span> {hero2.connections.relatives || "-"}</div>
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
