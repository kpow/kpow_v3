import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSetlist } from "@/lib/phish-api";

interface GameFormValues {
  year: string;
  tour: 'summer' | 'fall' | 'winter' | 'spring';
}

export function SetlistGame() {
  const [gameState, setGameState] = useState<'idle' | 'viewing' | 'guessing' | 'results'>('idle');
  const [currentSetlist, setCurrentSetlist] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(5);
  
  const form = useForm<GameFormValues>({
    defaultValues: {
      year: '',
      tour: 'summer'
    }
  });

  const startGame = async () => {
    setGameState('viewing');
    setTimer(5);
    // Fetch random setlist here
    // For now using a placeholder
    const randomShowId = "1234"; // We'll implement random selection
    try {
      const setlist = await getSetlist(randomShowId);
      setCurrentSetlist(setlist);
    } catch (error) {
      console.error("Error fetching setlist:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState === 'viewing' || gameState === 'guessing') {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (gameState === 'viewing') {
              setGameState('guessing');
              return 5;
            } else {
              setGameState('results');
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameState]);

  const onSubmit = (values: GameFormValues) => {
    // Calculate score based on year proximity and correct tour
    const actualYear = new Date(currentSetlist.date).getFullYear();
    const yearDiff = Math.abs(parseInt(values.year) - actualYear);
    const yearScore = Math.max(0, 50 - yearDiff * 10); // Lose 10 points for each year off
    
    // For tour scoring - we'll need to determine the actual tour
    const tourScore = 50; // Placeholder for tour scoring logic
    
    setScore(yearScore + tourScore);
    setGameState('results');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <motion.div className="space-y-6">
          {gameState === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Phish Setlist Game</h2>
              <Button onClick={startGame} size="lg">
                Start Game
              </Button>
            </motion.div>
          )}

          <AnimatePresence>
            {gameState === 'viewing' && currentSetlist && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center text-2xl font-bold mb-4">
                  Time remaining: {timer}s
                </div>
                <div className="whitespace-pre-wrap font-mono">
                  {currentSetlist.setlistdata}
                </div>
              </motion.div>
            )}

            {gameState === 'guessing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-center text-2xl font-bold mb-4">
                  Make your guess! {timer}s
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input type="number" min="1983" max="2025" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tour</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tour" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="summer">Summer</SelectItem>
                              <SelectItem value="fall">Fall</SelectItem>
                              <SelectItem value="winter">Winter</SelectItem>
                              <SelectItem value="spring">Spring</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Submit Guess
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {gameState === 'results' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <h3 className="text-2xl font-bold">Your Score: {score}</h3>
                <div className="space-y-2">
                  <p>Actual Show Date: {currentSetlist?.showdate}</p>
                  <p>Venue: {currentSetlist?.venue}</p>
                </div>
                <Button onClick={() => {
                  setGameState('idle');
                  form.reset();
                }}>
                  Play Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </CardContent>
    </Card>
  );
}
