import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShowDetailsModal } from "@/components/phashboard/show-details-modal";
import { RetroGrid } from "@/components/magicui/retro-grid";

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
import { Info } from "lucide-react";
import BlurText from "@/reactbits/BlurText/BlurText";

const handleAnimationComplete = () => {
  console.log("Animation completed!");
};

interface GameFormValues {
  year: string;
  tour: "summer" | "fall" | "winter" | "spring" | "";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastGuess, setLastGuess] = useState<{
    guessedYear: string;
    actualYear: string;
    yearScore: number;
    guessedTour: string;
    actualTour: string;
    tourScore: number;
    totalScore: number;
  } | null>(null);
  const [showDetailsOpen, setShowDetailsOpen] = useState(false);

  const years = Array.from({ length: 2025 - 1984 + 1 }, (_, i) => 2025 - i).map(
    String,
  );

  const form = useForm<GameFormValues>({
    defaultValues: {
      year: "",
      tour: "",
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
      setIsModalOpen(true);
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
              setIsModalOpen(false);
              setGameState("guessing");
              return 15;
            } else {
              if (!lastGuess) {
                setError("Time's up! You didn't make a guess.");
                setGameState("idle");
                form.reset();
              } else {
                setGameState("results");
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameState, lastGuess, form]);

  const onSubmit = (values: GameFormValues) => {
    if (!currentSetlist || !values.year || !values.tour) {
      setError("Please select both a year and a tour before submitting");
      return;
    }

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
    <Card className="w-full h-full min-h-[400px] overflow-hidden">
      <CardContent className="p-2 flex flex-col h-full">
        <div className="justify-center flex flex-col md:flex-row lg:flex-col xl:flex-row bg-black text-white rounded-sm p-1 pl-4 m-0 mb-4">
          <div className="text-2xl font-slackey mr-4">guess the setlist</div>
        </div>

        <div className="flex-grow">
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
              <div className="px-4 text-center h-full flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
                <div className="">
                  <BlurText
                    text="Ready to test your Phish knowledge?"
                    delay={150}
                    animateBy="words"
                    direction="bottom"
                    onAnimationComplete={handleAnimationComplete}
                    className="text-center flex justify-center font-slackey text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold"
                  />

                  {/* <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4">
                    Ready to test your Phish knowledge?
                  </h2> */}
                </div>

                <div>
                  <p className="mb-6 text-muted-foreground">
                    You'll get 10 seconds to study a setlist,
                    <br />
                    then 15 seconds to guess the year and tour!
                  </p>
                </div>

                <div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg animate-gentle-bounce"
                    onClick={startGame}
                    size="lg"
                  >
                    Start Game
                  </Button>
                </div>
              
                 <RetroGrid />
              </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogTitle className="text-center text-3xl font-bold">
                  Study the Setlist! {timer}s
                </DialogTitle>
                {gameState === "loading" && (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                )}

                {gameState === "viewing" && currentSetlist && (
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap font-mono bg-muted/50 p-6 rounded-lg">
                      {currentSetlist.setlistdata}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {gameState === "guessing" && (
              <div className="space-y-4">
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
                              <SelectValue placeholder="Choose one" />
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
                    <Button
                      type="submit"
                      className="w-full text-lg animate-pulse bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-6 rounded-lg text-lg"
                    >
                      Submit Guess
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {gameState === "results" && currentSetlist && lastGuess && (
              <div className="text-center space-y-6">
                <div className="text-2xl md:text-3xl lg:text-3xl xl:text-5xl font-bold m-4">
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
                    <div className="text-sm md:text lg:text-sm xl:text-xl font-bold">
                      Year: {lastGuess.guessedYear} → {lastGuess.actualYear}
                    </div>
                    <div className="text-right text-sm md:text lg:text-sm xl:text-xl font-bold">
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

                    <div className="text-sm md:text lg:text-sm xl:text-xl font-bold">
                      Tour: {lastGuess.guessedTour} → {lastGuess.actualTour}
                    </div>
                    <div className="text-right text-sm md:text lg:text-sm xl:text-xl font-bold">
                      {lastGuess.tourScore} pts
                      <span className="text-muted-foreground text-xs ml-1">
                        ({lastGuess.tourScore > 0 ? "✓" : "✗"})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 bg-muted/50 p-2 rounded-lg relative">
                  <p className="font-bold">
                    Show Date:{" "}
                    {new Date(currentSetlist.showdate).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetailsOpen(true)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </p>
                  <p className="text-sm">Venue: {currentSetlist.venue}</p>
                </div>

                <Button
                  onClick={() => {
                    setGameState("idle");
                    form.reset();
                  }}
                  className="w-3/4 text-lg animate-pulse bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-6 rounded-lg text-lg"
                >
                  Play Again
                </Button>

                <ShowDetailsModal
                  show={{
                    showid: currentSetlist.showid,
                    showdate: currentSetlist.showdate,
                    venue: currentSetlist.venue,
                    city: "",
                    state: "",
                    country: "",
                  }}
                  isOpen={showDetailsOpen}
                  onClose={() => setShowDetailsOpen(false)}
                />
              </div>
            )}
          </AnimatePresence>
          
         
        </div>
        <div className="justify-center flex flex-col md:flex-row lg:flex-col xl:flex-row bg-black text-white rounded-sm p-1 pl-4 m-0 mt-8">
          <div className="flex justify-between items-center mt-1 mb-1">
            <div className="flex gap-4 items-center">
              <div className="text-sm font-bold">Games: {gamesPlayed}</div>
              <div className="text-sm font-bold">High Score: {highScore}</div>
              <div className="text-sm font-bold">
                Total Score: {cumulativeScore}
              </div>
              {gameState !== "idle" && (
                <div className="text-sm font-bold">Current: {score}</div>
              )}
            </div>
          </div>
        </div>
      
      </CardContent>
    </Card>
  );
}
