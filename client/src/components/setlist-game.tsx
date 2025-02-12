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
import { Skeleton } from "@/components/ui/skeleton";

interface GameFormValues {
  year: string;
  tour: 'summer' | 'fall' | 'winter' | 'spring';
}

interface ShowData {
  showid: string;
  showdate: string;
  venue: string;
  setlistdata: string;
}

export function SetlistGame() {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'viewing' | 'guessing' | 'results'>('idle');
  const [currentSetlist, setCurrentSetlist] = useState<ShowData | null>(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GameFormValues>({
    defaultValues: {
      year: '',
      tour: 'summer'
    }
  });

  const fetchRandomShow = async () => {
    try {
      setGameState('loading');
      // Get a list of all Phish shows from the API
      const response = await fetch('/api/shows/all');
      if (!response.ok) throw new Error('Failed to fetch shows');
      const data = await response.json();

      // Pick a random show from the list
      const shows = data.shows;
      const randomShow = shows[Math.floor(Math.random() * shows.length)];

      // Get the setlist for this show
      const setlist = await getSetlist(randomShow.id);
      setCurrentSetlist({
        showid: randomShow.id,
        showdate: randomShow.date,
        venue: randomShow.venue,
        setlistdata: setlist.setlistdata
      });
      setGameState('viewing');
      setTimer(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
      setGameState('idle');
    }
  };

  const startGame = () => {
    setScore(0);
    setError(null);
    fetchRandomShow();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (gameState === 'viewing' || gameState === 'guessing') {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (gameState === 'viewing') {
              setGameState('guessing');
              return 15; // Changed from 5 to 15 seconds for guessing phase
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
    if (!currentSetlist) return;

    // Calculate score based on year proximity and correct tour
    const actualYear = new Date(currentSetlist.showdate).getFullYear();
    const yearDiff = Math.abs(parseInt(values.year) - actualYear);
    const yearScore = Math.max(0, 50 - yearDiff * 10); // Lose 10 points for each year off

    // Determine the actual tour based on the show date
    const month = new Date(currentSetlist.showdate).getMonth();
    const actualTour =
      month >= 5 && month <= 7 ? 'summer' :
      month >= 8 && month <= 10 ? 'fall' :
      month >= 11 || month <= 1 ? 'winter' : 'spring';

    const tourScore = values.tour === actualTour ? 50 : 0;

    setScore(yearScore + tourScore);
    setGameState('results');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <motion.div className="space-y-6">
          {error && (
            <div className="text-red-500 text-center p-4">
              {error}
              <Button onClick={() => setError(null)} className="ml-2">
                Dismiss
              </Button>
            </div>
          )}

          {gameState === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Phish Setlist Game</h2>
              <p className="mb-4 text-muted-foreground">
                View a setlist for 5 seconds, then guess the year and tour!
              </p>
              <Button onClick={startGame} size="lg">
                Start Game
              </Button>
            </motion.div>
          )}

          {gameState === 'loading' && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
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

            {gameState === 'results' && currentSetlist && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <h3 className="text-2xl font-bold">Your Score: {score}</h3>
                <div className="space-y-2">
                  <p>Show Date: {new Date(currentSetlist.showdate).toLocaleDateString()}</p>
                  <p>Venue: {currentSetlist.venue}</p>
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