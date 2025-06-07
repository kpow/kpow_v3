import { z } from "zod";
import heroPowers from "../data/superheros-powers.js";

export interface Hero {
  id: number;
  name: string;
  powerstats: {
    intelligence: number;
    strength: number;
    speed: number;
    durability: number;
    power: number;
    combat: number;
  };
  images: {
    lg: string;
  };
  biography: {
    fullName: string;
    alignment: string;
    placeOfBirth?: string;
    firstAppearance?: string;
    publisher?: string;
  };
  appearance?: {
    race: string;
    height: string[];
    weight: string[];
  };
  work?: {
    occupation: string;
    base: string;
  };
  connections?: {
    groupAffiliation: string;
    relatives: string;
  };
  powers?: string[];
}

// Get hero powers from powers data
export function getHeroPowers(heroName: string): string[] {
  const powers: string[] = [];
  const heroIndex = heroPowers.Name.indexOf(heroName);

  if (heroIndex === -1) {
    return powers;
  }

  // Iterate through all power types
  Object.entries(heroPowers).forEach(([power, haspower]) => {
    if (power === "Name") return; // Skip the names array
    if (Array.isArray(haspower) && haspower[heroIndex]) {
      powers.push(power);
    }
  });

  return powers;
}

// Calculate total power level with randomization
export function calculatePowerLevel(hero: Hero): number {
  const stats = hero.powerstats;
  const baseScore =
    stats.intelligence * 0.2 +
    stats.strength * 0.2 +
    stats.speed * 0.15 +
    stats.durability * 0.15 +
    stats.power * 0.15 +
    stats.combat * 0.15;

  // Add randomization factor (-10% to +10%)
  const randomFactor = 0.9 + Math.random() * 0.2;
  return baseScore * randomFactor;
}

// Determine battle winner
export function determineBattleWinner(
  hero1: Hero,
  hero2: Hero,
): { winner: Hero; isMiracleWin: boolean } {
  const hero1Power = calculatePowerLevel(hero1);
  const hero2Power = calculatePowerLevel(hero2);

  // 1% chance of miracle win for significantly weaker hero
  const miracleChance = Math.random() < 0.01;
  const powerDifference = Math.abs(hero1Power - hero2Power);
  const isSignificantDifference = powerDifference > 50;

  if (isSignificantDifference && miracleChance) {
    return {
      winner: hero1Power < hero2Power ? hero1 : hero2,
      isMiracleWin: true,
    };
  }

  return {
    winner: hero1Power >= hero2Power ? hero1 : hero2,
    isMiracleWin: false,
  };
}

// Random hero selection
export function getRandomHero(heroes: Hero[]): Hero {
  const randomIndex = Math.floor(Math.random() * heroes.length);
  const hero = heroes[randomIndex];
  // Add powers to the hero object
  hero.powers = getHeroPowers(hero.name);
  return hero;
}

// Betting validation schema
export const betSchema = z.object({
  amount: z.number().min(1).max(100),
  selectedHero: z.number(), // Hero ID
});

export type Bet = z.infer<typeof betSchema>;

// Process bet result
export function processBet(bet: Bet, winner: Hero, stash: number): number {
  if (winner.id === bet.selectedHero) {
    return stash + bet.amount;
  }
  return stash - bet.amount;
}
