import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
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
  tour: "summer" | "fall" | "winter" | "spring";
}

interface ShowData {
  showid: string;
  showdate: string;
  venue: string;
  setlistdata: string;
}

export function SetlistGame() {
  const [gameState, setGameState] = useState<
    "idle" | "loading" | "viewing" | "guessing" | "results"
  >("idle");
  const [currentSetlist, setCurrentSetlist] = useState<ShowData | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timer, setTimer] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [lastGuess, setLastGuess] = useState<{
    guessedYear: string;
    actualYear: string;
    yearScore: number;
    guessedTour: string;
    actualTour: string;
    tourScore: number;
    totalScore: number;
  } | null>(null);

  const years = Array.from({ length: 2025 - 1988 + 1 }, (_, i) => 2025 - i).map(
    String,
  );

  const form = useForm<GameFormValues>({
    defaultValues: {
      year: "",
      tour: "summer",
    },
  });

  useEffect(() => {
    const savedHighScore = localStorage.getItem("phishSetlistHighScore");
    const savedGamesPlayed = localStorage.getItem("phishSetlistGamesPlayed");
    const savedCumulativeScore = localStorage.getItem(
      "phishSetlistCumulativeScore",
    );
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
    if (savedGamesPlayed) setGamesPlayed(parseInt(savedGamesPlayed));
    if (savedCumulativeScore)
      setCumulativeScore(parseInt(savedCumulativeScore));
  }, []);

  const fetchRandomShow = async () => {
    try {
      setGameState("loading");
      const response = await fetch("/api/shows/all");
      if (!response.ok) throw new Error("Failed to fetch shows");
      const data = await response.json();

      if (
        !data.shows ||
        !Array.isArray(data.shows) ||
        data.shows.length === 0
      ) {
        throw new Error("No shows data available");
      }

      const shows = data.shows;
      const randomShow = shows[Math.floor(Math.random() * shows.length)];

      const setlist = await getSetlist(randomShow.id);
      if (!setlist) {
        throw new Error("Failed to fetch setlist");
      }

      setCurrentSetlist({
        showid: randomShow.id,
        showdate: randomShow.date,
        venue: randomShow.venue,
        setlistdata: setlist.setlistdata,
      });
      setGameState("viewing");
      setTimer(10);
    } catch (err) {
      console.error("Game error:", err);
      setError(err instanceof Error ? err.message : "Failed to start game");
      setGameState("idle");
    }
  };

  const startGame = () => {
    setError(null);
    setGamesPlayed((prev) => {
      const newGamesPlayed = prev + 1;
      localStorage.setItem(
        "phishSetlistGamesPlayed",
        newGamesPlayed.toString(),
      );
      return newGamesPlayed;
    });
    fetchRandomShow();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (gameState === "viewing" || gameState === "guessing") {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (gameState === "viewing") {
              setGameState("guessing");
              return 15;
            } else {
              setGameState("results");
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

    const actualYear = new Date(currentSetlist.showdate).getFullYear();
    const yearDiff = Math.abs(parseInt(values.year) - actualYear);
    const yearScore = Math.max(0, 50 - yearDiff * 5);

    const month = new Date(currentSetlist.showdate).getMonth();
    const actualTour =
      month >= 5 && month <= 7
        ? "summer"
        : month >= 8 && month <= 10
          ? "fall"
          : month >= 11 || month <= 1
            ? "winter"
            : "spring";

    const tourScore = values.tour === actualTour ? 15 : 0;
    const totalScore = yearScore + tourScore;

    setScore(totalScore);
    setCumulativeScore((prev) => {
      const newScore = prev + totalScore;
      localStorage.setItem("phishSetlistCumulativeScore", newScore.toString());
      return newScore;
    });

    if (totalScore > highScore) {
      setHighScore(totalScore);
      localStorage.setItem("phishSetlistHighScore", totalScore.toString());
    }

    setLastGuess({
      guessedYear: values.year,
      actualYear: actualYear.toString(),
      yearScore,
      guessedTour: values.tour,
      actualTour,
      tourScore,
      totalScore,
    });

    setGameState("results");
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 md:p-6 lg:p-8 flex flex-col h-full">
        <div className="text-2xl md:text-3xl lg:text-4xl font-slackey">phish setlist game</div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-1 mb-4 md:mb-6 lg:mb-8">
          <div className="flex flex-wrap gap-4 items-center text-sm md:text-base">
            <div className="text-muted-foreground">
              Games: {gamesPlayed}
            </div>
            <div className="text-muted-foreground">
              High Score: {highScore}
            </div>
            <div className="text-muted-foreground">
              Total Score: {cumulativeScore}
            </div>
            {gameState !== "idle" && (
              <div className="font-bold">Current: {score}</div>
            )}
          </div>
        </div>

        <motion.div className="flex-grow">
          {error && (
            <div className="text-red-500 text-center p-4">
              {error}
              <Button onClick={() => setError(null)} className="ml-2">
                Dismiss
              </Button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {gameState === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center h-full flex flex-col items-center justify-center py-8 md:py-12 lg:py-16"
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                  Ready to test your Phish knowledge?
                </h2>
                <p className="mb-6 text-muted-foreground text-base md:text-lg lg:text-xl">
                  You'll get 10 seconds to study a setlist,
                  <br />
                  then 15 seconds to guess the year and tour!
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg md:text-xl lg:text-2xl animate-pulse"
                  onClick={startGame}
                  size="lg"
                >
                  Start Game
                </Button>
              </motion.div>
            )}

            {gameState === "loading" && (
              <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {gameState === "viewing" && currentSetlist && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 p-4"
              >
                <div className="text-center text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                  Time remaining: {timer}s
                </div>
                <div className="whitespace-pre-wrap font-mono text-sm md:text-base lg:text-lg bg-muted/50 p-4 md:p-6 lg:p-8 rounded-lg max-h-[60vh] overflow-y-auto">
                  {currentSetlist.setlistdata}
                </div>
              </motion.div>
            )}

            {gameState === "guessing" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-4"
              >
                <div className="text-center text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                  Make your guess! {timer}s
                </div>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6 max-w-2xl mx-auto"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg md:text-xl">Year</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="h-12 text-base md:text-lg">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem key={year} value={year}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tour"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg md:text-xl">Tour</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="h-12 text-base md:text-lg">
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
                    </div>
                    <Button
                      type="submit"
                      className="w-full text-lg md:text-xl animate-pulse bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                    >
                      Submit Guess
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {gameState === "results" && currentSetlist && lastGuess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 p-4 md:p-6 lg:p-8"
              >
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                  Score: {lastGuess.totalScore} points!
                  {lastGuess.totalScore === highScore && lastGuess.totalScore > 0 && (
                    <div className="text-sm md:text-base text-blue-500 mt-0">
                      New High Score! 🎉
                    </div>
                  )}
                </div>

                <div className="space-y-4 bg-muted/50 p-4 md:p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
                    <div>
                      Year: {lastGuess.guessedYear} → {lastGuess.actualYear}
                    </div>
                    <div className="text-right">
                      {lastGuess.yearScore} pts
                      <span className="text-muted-foreground text-xs md:text-sm ml-1">
                        ({Math.abs(parseInt(lastGuess.guessedYear) - parseInt(lastGuess.actualYear))} off)
                      </span>
                    </div>

                    <div>
                      Tour: {lastGuess.guessedTour} → {lastGuess.actualTour}
                    </div>
                    <div className="text-right">
                      {lastGuess.tourScore} pts
                      <span className="text-muted-foreground text-xs md:text-sm ml-1">
                        ({lastGuess.tourScore > 0 ? "✓" : "✗"})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 bg-muted/50 p-4 md:p-6 rounded-lg">
                  <p className="font-bold text-base md:text-lg">
                    Show Date:{" "}
                    {new Date(currentSetlist.showdate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm md:text-base">Venue: {currentSetlist.venue}</p>
                </div>

                <Button
                  onClick={() => {
                    setGameState("idle");
                    form.reset();
                  }}
                  className="w-full max-w-md mx-auto text-lg md:text-xl animate-pulse bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
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