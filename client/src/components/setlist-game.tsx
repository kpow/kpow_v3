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

  const headerStyle = "bg-black text-white p-4";
  const footerStyle = "bg-black w-full h-16 fixed bottom-0 left-0";
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
    <Card className="w-full h-full">
      <div className={headerStyle}>
        <div className="container mx-auto">
          <div className="text-2xl font-slackey mb-2">phish setlist game</div>
          <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="text-sm text-muted-foreground">
              Games: {gamesPlayed}
            </div>
            <div className="text-sm text-muted-foreground">
              High Score: {highScore}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Score: {cumulativeScore}
            </div>
            {gameState !== "idle" && (
              <div className="text-sm font-bold">Current: {score}</div>
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

          {gameState === "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center h-full flex flex-col items-center justify-center"
            >
              <h2 className="text-2xl font-bold mb-4">
                Ready to test your Phish knowledge?
              </h2>
              <p className="mb-6 text-muted-foreground">
                You'll get 10 seconds to study a setlist,
                <br />
                then 15 seconds to guess the year and tour!
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
                onClick={startGame}
                size="lg"
              >
                Start Game
              </Button>
            </motion.div>
          )}

          {gameState === "loading" && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          <AnimatePresence mode="wait">
            {gameState === "viewing" && currentSetlist && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center text-3xl font-bold mb-4">
                  Time remaining: {timer}s
                </div>
                <div className="whitespace-pre-wrap font-mono bg-muted/50 p-6 rounded-lg">
                  {currentSetlist.setlistdata}
                </div>
              </motion.div>
            )}

            {gameState === "guessing" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-center text-3xl font-bold mb-4">
                  Make your guess! {timer}s
                </div>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6 max-w-md mx-auto"
                  >
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg">Year</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-12">
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
                          <FormLabel className="text-lg">Tour</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-12">
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
                    <Button type="submit" className="w-full h-12 text-lg">
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
                className="text-center space-y-6"
              >
                <div className="text-2xl font-bold mb-2">
                  Score: {lastGuess.totalScore} points!
                  {lastGuess.totalScore === highScore &&
                    lastGuess.totalScore > 0 && (
                      <div className="text-sm text-blue-500 mt-0">
                        New High Score! 🎉
                      </div>
                    )}
                </div>

                <div className="space-y-4 bg-muted/50 p-2 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      Year: {lastGuess.guessedYear} → {lastGuess.actualYear}
                    </div>
                    <div className="text-right">
                      {lastGuess.yearScore} pts
                      <span className="text-muted-foreground text-xs ml-1">
                        (
                        {Math.abs(
                          parseInt(lastGuess.guessedYear) -
                            parseInt(lastGuess.actualYear),
                        )}{" "}
                        off)
                      </span>
                    </div>

                    <div>
                      Tour: {lastGuess.guessedTour} → {lastGuess.actualTour}
                    </div>
                    <div className="text-right">
                      {lastGuess.tourScore} pts
                      <span className="text-muted-foreground text-xs ml-1">
                        ({lastGuess.tourScore > 0 ? "✓" : "✗"})
                      </span>
                    </div>

                    {/* <div className="col-span-2 border-t mt-1 pt-1">
                      <div className="flex justify-between items-center text-base">
                        <span className="text-sm">Total / Cumulative</span>
                        <span className="font-bold">
                          {lastGuess.totalScore} / {cumulativeScore} pts
                        </span>
                      </div>
                    </div> */}
                  </div>
                </div>

                <div className="space-y-1 bg-muted/50 p-2 rounded-lg">
                  <p className="text-sm">
                    Show Date:{" "}
                    {new Date(currentSetlist.showdate).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                  <p className="text-sm">Venue: {currentSetlist.venue}</p>
                </div>

                <Button
                  onClick={() => {
                    setGameState("idle");
                    form.reset();
                  }}
                  className="text-lg px-8 py-1"
                >
                  Play Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      </CardContent>
      <div className={footerStyle}></div>
    </Card>
  );
}
