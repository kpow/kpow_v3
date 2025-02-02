import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
// @ts-ignore
import superheroesData from '../../../attached_assets/superheros-prod.js';

// Define type for superhero data
interface Superhero {
  name: string;
  biography: {
    fullName: string;
    alignment: string;
    publisher: string;
  };
  appearance: {
    race: string;
  };
  images: {
    lg: string;
  };
}

export default function Battle() {
  const [randomMode, setRandomMode] = useState(false);
  const superheroes = superheroesData as Superhero[];
  const [hero1] = useState(superheroes[0]); // For now, using first hero
  const [hero2] = useState(superheroes[1]); // For now, using second hero

  return (
    <div className="container mx-auto px-4 pt-8">
      {/* Top Navigation */}
      <div className="flex justify-center gap-8 mb-8">
        <div className="rounded-full bg-blue-600 p-4 text-white">DMS</div>
        <div className="rounded-full bg-blue-600 p-4 text-white">AI</div>
        <div className="rounded-full bg-blue-600 p-4 text-white">FIGHT</div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">battle beta</h1>
        <div className="flex items-center gap-2">
          <span>random</span>
          <input
            type="checkbox"
            checked={randomMode}
            onChange={(e) => setRandomMode(e.target.checked)}
            className="toggle"
          />
        </div>
      </div>

      {/* Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Hero 1 Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{hero1.name}</h2>
          <img src={hero1.images.lg} alt={hero1.name} className="w-full mb-4" />
          <div className="space-y-2">
            <div>Name: {hero1.biography.fullName}</div>
            <div>Race: {hero1.appearance.race}</div>
            <div>Alignment: {hero1.biography.alignment}</div>
            <div>Publisher: {hero1.biography.publisher}</div>
          </div>
        </Card>

        {/* Hero 2 Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{hero2.name}</h2>
          <img src={hero2.images.lg} alt={hero2.name} className="w-full mb-4" />
          <div className="space-y-2">
            <div>Name: {hero2.biography.fullName}</div>
            <div>Race: {hero2.appearance.race}</div>
            <div>Alignment: {hero2.biography.alignment}</div>
            <div>Publisher: {hero2.biography.publisher}</div>
          </div>
        </Card>
      </div>

      {/* Battle Controls */}
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-xl font-bold">Winner: ????</h3>

        {randomMode && (
          <div className="flex items-center gap-4">
            <RadioGroup defaultValue="hero1">
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hero1" id="hero1" />
                  <Label htmlFor="hero1">{hero1.name}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hero2" id="hero2" />
                  <Label htmlFor="hero2">{hero2.name}</Label>
                </div>
              </div>
            </RadioGroup>

            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="Bet"
                className="w-20"
              />
              <Input 
                type="number" 
                placeholder="Stash"
                className="w-20"
                disabled
              />
            </div>
          </div>
        )}

        <Button className="w-32">FIGHT</Button>
      </div>
    </div>
  );
}