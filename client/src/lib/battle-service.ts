import { z } from "zod";
import heroPowers from '../../../attached_assets/superheros-powers.js';

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
  };
  powers?: string[];
}

// Get hero powers from powers data
export function getHeroPowers(heroName: string): string[] {
  console.log('Getting powers for hero:', heroName);
  console.log('Powers data available:', Object.keys(heroPowers));

  const powers: string[] = [];
  const heroIndex = heroPowers.Name.indexOf(heroName);

  console.log('Hero index in powers data:', heroIndex);

  if (heroIndex === -1) {
    console.log('Hero not found in powers data');
    return powers;
  }

  // Iterate through all power types
  Object.entries(heroPowers).forEach(([power, haspower]) => {
    if (power === 'Name') return; // Skip the names array
    if (Array.isArray(haspower) && haspower[heroIndex]) {
      powers.push(power);
    }
  });

  console.log('Found powers:', powers);
  return powers;
}

// Calculate total power level with randomization
export function calculatePowerLevel(hero: Hero): number {
  const stats = hero.powerstats;
  const baseScore = (
    stats.intelligence * 0.2 +
    stats.strength * 0.2 +
    stats.speed * 0.15 +
    stats.durability * 0.15 +
    stats.power * 0.15 +
    stats.combat * 0.15
  );

  // Add randomization factor (-10% to +10%)
  const randomFactor = 0.9 + Math.random() * 0.2;
  return baseScore * randomFactor;
}

// Determine battle winner
export function determineBattleWinner(hero1: Hero, hero2: Hero): Hero {
  const hero1Power = calculatePowerLevel(hero1);
  const hero2Power = calculatePowerLevel(hero2);

  return hero1Power >= hero2Power ? hero1 : hero2;
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