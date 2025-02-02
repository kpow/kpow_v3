import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial dark mode on mount
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    
    // Toggle the class on document
    document.documentElement.classList.toggle("dark", newDarkMode);
    
    // Save preference
    localStorage.setItem("darkMode", newDarkMode ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full flex items-center justify-start gap-3 px-3"
      onClick={toggleDarkMode}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="text-[13px]">
        {isDark ? "Light mode" : "Dark mode"}
      </span>
    </Button>
  );
}
